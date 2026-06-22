import logging
from typing import Dict, List, Optional, Any, TypedDict
import google.generativeai as genai
from sqlalchemy import select

from app.config import get_settings
from app.models.base import AsyncSessionLocal
from app.models.equipment import Equipment
from app.rag.confidence import (
    calculate_confidence,
    extract_llm_confidence,
    get_confidence_label,
)
from app.rag.prompt_templates import INDUSTRIAL_QA_PROMPT
from app.rag.retriever import get_retriever
from langgraph.graph import StateGraph, END

logger = logging.getLogger(__name__)
settings = get_settings()

# Define state structure
class AgentState(TypedDict):
    question: str
    equipment_tags: List[str]
    context_chunks: List[Dict[str, Any]]
    maintenance_data: Optional[str]
    compliance_data: Optional[str]
    answer: str
    sources: List[Dict[str, Any]]
    confidence_score: int
    confidence_label: str


# Helper functions
async def get_equipment_info(tag: str) -> Optional[str]:
    """Fetch description and metadata for a specific equipment tag from the DB."""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Equipment).where(Equipment.tag == tag))
            eq = result.scalar_one_or_none()
            if eq:
                return f"Equipment Tag: {eq.tag} | Type: {eq.equipment_type} | Description: {eq.description}"
    except Exception as e:
        logger.error(f"Error querying equipment table for {tag}: {e}")
    return None


def build_context(chunks: List[Dict]) -> str:
    """Format retrieved chunks into a numbered context block for the prompt."""
    parts: List[str] = []
    for chunk in chunks:
        meta = chunk.get("metadata", {})
        doc_name = meta.get("document_name", meta.get("filename", "Unknown"))
        page = meta.get("page_number", meta.get("page", "?"))
        text = chunk.get("text", "")
        parts.append(f"[Source: {doc_name}, Page {page}]\n{text}\n---")
    return "\n".join(parts)


def build_sources(chunks: List[Dict]) -> List[Dict]:
    """Deduplicate chunks by (document_name, page) and build a sources list."""
    seen = set()
    sources: List[Dict] = []
    for chunk in chunks:
        meta = chunk.get("metadata", {})
        doc_name = meta.get("document_name", meta.get("filename", "Unknown"))
        page = meta.get("page_number", meta.get("page", "?"))
        key = (doc_name, page)
        if key not in seen:
            seen.add(key)
            sources.append(
                {
                    "document_name": doc_name,
                    "page": page,
                    "similarity_score": round(chunk.get("similarity_score", 0.0), 4),
                    "document_id": meta.get("document_id", ""),
                    "equipment_tags": meta.get("equipment_tags", ""),
                }
            )
    return sources


# Agent Node Definitions
async def retrieval_agent(state: AgentState) -> Dict[str, Any]:
    """Queries the vector store for chunks matching the question and equipment tags."""
    logger.info("LangGraph | RetrievalAgent activated")
    retriever = get_retriever()
    try:
        chunks = retriever.retrieve(
            query=state["question"],
            equipment_tags=state["equipment_tags"]
        )
    except Exception as e:
        logger.error(f"Retrieval agent failed: {e}")
        chunks = []

    return {"context_chunks": chunks}


async def maintenance_agent(state: AgentState) -> Dict[str, Any]:
    """Extracts operational status and metadata for equipment tags from the database."""
    logger.info("LangGraph | MaintenanceAgent activated")
    maintenance_info = []
    if state["equipment_tags"]:
        for tag in state["equipment_tags"]:
            info = await get_equipment_info(tag)
            if info:
                maintenance_info.append(info)

    maintenance_data = "\n".join(maintenance_info) if maintenance_info else None
    return {"maintenance_data": maintenance_data}


async def compliance_agent(state: AgentState) -> Dict[str, Any]:
    """Appends regulatory safety warnings if compliance-related terminology is present."""
    logger.info("LangGraph | ComplianceAgent activated")
    compliance_data = None
    safety_keywords = [
        "safety", "hazard", "compliance", "standard", "osha",
        "regulation", "danger", "warning", "caution", "protective",
        "ppe", "loto", "lockout", "tagout"
    ]
    if any(kw in state["question"].lower() for kw in safety_keywords):
        compliance_data = (
            "REGULATORY & SAFETY COMPLIANCE WARNING:\n"
            "- All maintenance activity must strictly comply with OSHA and facility-specific safety standards.\n"
            "- Lockout/Tagout (LOTO) protocols must be fully executed before starting any maintenance work.\n"
            "- Required PPE: Hard hat, safety glasses, high-visibility vest, steel-toed boots, and any chemical/electrical protective gear as specified in the SOP."
        )
    return {"compliance_data": compliance_data}


async def summarization_agent(state: AgentState) -> Dict[str, Any]:
    """Compiles technical context, maintenance records, and safety compliance warnings into a final answer."""
    logger.info("LangGraph | SummarizationAgent activated")
    
    chunks = state["context_chunks"]
    if not chunks:
        return {
            "answer": (
                "I could not find this information in the uploaded documents. "
                "Please ensure the relevant documents have been ingested."
            ),
            "sources": [],
            "confidence_score": 0,
            "confidence_label": "low"
        }

    # Synthesize context block
    doc_context = build_context(chunks)
    context_parts = [f"--- COGNITIVE CONTEXT FROM INGESTED DOCUMENTS ---\n{doc_context}"]

    if state.get("maintenance_data"):
        context_parts.append(f"--- LIVE ASSET DATABASE STATUS ---\n{state['maintenance_data']}")

    if state.get("compliance_data"):
        context_parts.append(f"--- REGULATORY SAFETY PROTOCOLS ---\n{state['compliance_data']}")

    full_context = "\n\n".join(context_parts)

    # Call Gemini model
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(model_name=settings.gemini_model)
    
    prompt = INDUSTRIAL_QA_PROMPT.format(
        context=full_context,
        question=state["question"]
    )

    try:
        response = model.generate_content(prompt)
        raw_answer = response.text
    except Exception as exc:
        logger.error(f"Gemini generation inside agent failed: {exc}")
        raw_answer = f"An error occurred while generating the answer: {exc}"

    # Extract confidence & answer
    llm_confidence, answer = extract_llm_confidence(raw_answer)
    sources = build_sources(chunks)
    retrieval_scores = [c.get("similarity_score", 0.0) for c in chunks]

    # Calculate overall confidence
    confidence = calculate_confidence(
        retrieval_scores=retrieval_scores,
        llm_confidence=llm_confidence,
        num_sources=len(sources),
    )
    confidence_label = get_confidence_label(confidence)

    return {
        "answer": answer,
        "sources": sources,
        "confidence_score": confidence,
        "confidence_label": confidence_label
    }


# Compile state graph
def build_agent_graph() -> Any:
    """Builds and compiles the StateGraph workflow."""
    workflow = StateGraph(AgentState)

    # Register nodes
    workflow.add_node("retrieval", retrieval_agent)
    workflow.add_node("maintenance", maintenance_agent)
    workflow.add_node("compliance", compliance_agent)
    workflow.add_node("summarize", summarization_agent)

    # Define flow sequence
    workflow.set_entry_point("retrieval")
    workflow.add_edge("retrieval", "maintenance")
    workflow.add_edge("maintenance", "compliance")
    workflow.add_edge("compliance", "summarize")
    workflow.add_edge("summarize", END)

    return workflow.compile()


# Global graph instance
_agent_graph = None


def get_agent_graph() -> Any:
    """Lazy initializer for the compiled LangGraph workflow."""
    global _agent_graph
    if _agent_graph is None:
        _agent_graph = build_agent_graph()
    return _agent_graph


async def run_agent_workflow(question: str, equipment_tags: List[str]) -> Dict[str, Any]:
    """Execute the compiled multi-agent LangGraph workflow."""
    graph = get_agent_graph()
    initial_state = {
        "question": question,
        "equipment_tags": equipment_tags,
        "context_chunks": [],
        "maintenance_data": None,
        "compliance_data": None,
        "answer": "",
        "sources": [],
        "confidence_score": 0,
        "confidence_label": ""
    }
    
    result_state = await graph.ainvoke(initial_state)
    return {
        "answer": result_state["answer"],
        "sources": result_state["sources"],
        "confidence": result_state["confidence_score"],
        "confidence_label": result_state["confidence_label"],
        "equipment_tags": equipment_tags
    }
