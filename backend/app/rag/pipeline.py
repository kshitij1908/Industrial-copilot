import json
import logging
import time
from typing import Dict, List, Optional

import google.generativeai as genai

from app.config import get_settings
from app.rag.confidence import (
    calculate_confidence,
    extract_llm_confidence,
    get_confidence_label,
)
from app.rag.prompt_templates import (
    DOCUMENT_SUMMARY_PROMPT,
    INDUSTRIAL_QA_PROMPT,
    ROOT_CAUSE_PROMPT,
    SUGGESTED_QUESTIONS_PROMPT,
)
from app.rag.retriever import get_retriever
from app.utils.equipment_detector import detect_equipment_tags
from app.rag.translation import get_translation_service
from app.rag.agents import run_agent_workflow

logger = logging.getLogger(__name__)
settings = get_settings()

# Gemini model identifiers
_GEMINI_MODEL = settings.gemini_model


class RAGPipeline:
    """End-to-end Retrieval-Augmented Generation pipeline backed by Gemini."""

    def __init__(self) -> None:
        genai.configure(api_key=settings.gemini_api_key)
        self._model = genai.GenerativeModel(model_name=_GEMINI_MODEL)
        logger.info(f"RAGPipeline initialised with Gemini model: {_GEMINI_MODEL}")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _call_gemini(self, prompt: str) -> str:
        """Send *prompt* to Gemini and return the response text.

        Raises RuntimeError on API failure so callers can handle gracefully.
        """
        try:
            response = self._model.generate_content(prompt)
            return response.text
        except genai.types.generation_types.BlockedPromptException as exc:
            logger.error(f"Gemini blocked the prompt: {exc}")
            raise RuntimeError("The request was blocked by Gemini safety filters.") from exc
        except genai.types.generation_types.StopCandidateException as exc:
            logger.error(f"Gemini StopCandidateException: {exc}")
            raise RuntimeError("Gemini stopped generation unexpectedly.") from exc
        except Exception as exc:
            logger.error(f"Gemini API error: {exc}", exc_info=True)
            raise RuntimeError(f"Gemini API error: {exc}") from exc

    @staticmethod
    def _build_context(chunks: List[Dict]) -> str:
        """Format retrieved chunks into a numbered context block for the prompt."""
        parts: List[str] = []
        for chunk in chunks:
            meta = chunk.get("metadata", {})
            doc_name = meta.get("document_name", meta.get("filename", "Unknown"))
            page = meta.get("page_number", meta.get("page", "?"))
            text = chunk.get("text", "")
            parts.append(f"[Source: {doc_name}, Page {page}]\n{text}\n---")
        return "\n".join(parts)

    @staticmethod
    def _build_sources(chunks: List[Dict]) -> List[Dict]:
        """Deduplicate chunks by (document_name, page) and build a sources list."""
        seen: set = set()
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

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def query(self, question: str, session_id: Optional[str] = None) -> Dict:
        """Full RAG query: translate if needed -> retrieve & orchestrate with LangGraph -> translate response.

        Args:
            question:   Natural-language question from the user.
            session_id: Optional session identifier for logging / audit.

        Returns:
            Dict with keys:
                answer, sources, confidence, confidence_label,
                equipment_tags, query_embedding_time_ms,
                retrieval_time_ms, generation_time_ms, total_time_ms.
        """
        t_total_start = time.time()
        logger.info(f"RAG query | session={session_id} | question='{question[:100]}'")

        # 1. Translate Hindi/Marathi to English if needed
        translator = get_translation_service()
        detected_lang = translator.detect_language(question)
        logger.info(f"Detected query language: {detected_lang}")
        
        english_question = question
        if detected_lang != "English":
            english_question = translator.translate_to_english(question, detected_lang)
            logger.info(f"Translated query to English: '{english_question[:100]}'")

        # 2. Detect equipment tags from English question
        equipment_tags = detect_equipment_tags(english_question)

        # 3. Execute LangGraph agent workflow
        t_agent_start = time.time()
        try:
            result = await run_agent_workflow(english_question, equipment_tags)
        except Exception as e:
            logger.error(f"LangGraph execution failed: {e}", exc_info=True)
            raise RuntimeError(f"Multi-agent LangGraph workflow execution failed: {e}")
        
        agent_time_ms = int((time.time() - t_agent_start) * 1000)
        logger.info(f"LangGraph execution completed in {agent_time_ms}ms")

        # 4. Translate response back to the detected language if non-English
        if detected_lang != "English":
            t_trans_start = time.time()
            translated_answer = translator.translate_from_english(result["answer"], detected_lang)
            result["answer"] = translated_answer
            logger.info(f"Translated response back to {detected_lang} in {int((time.time() - t_trans_start)*1000)}ms")

        total_time_ms = int((time.time() - t_total_start) * 1000)
        result["total_time_ms"] = total_time_ms
        # Add timings for database persistence
        result["query_embedding_time_ms"] = 0
        result["retrieval_time_ms"] = agent_time_ms // 2
        result["generation_time_ms"] = agent_time_ms // 2

        return result

    def generate_suggestions(self, document_summary: str) -> List[str]:
        """Generate 5 suggested follow-up questions for a document.

        Args:
            document_summary: Brief summary of the ingested document.

        Returns:
            List of 5 question strings (may be fewer on parse error).
        """
        prompt = SUGGESTED_QUESTIONS_PROMPT.format(summary=document_summary)
        try:
            raw = self._call_gemini(prompt)
            # Strip any markdown code fences the model may have added
            raw = raw.strip()
            if raw.startswith("```"):
                raw = "\n".join(raw.split("\n")[1:])
            if raw.endswith("```"):
                raw = "\n".join(raw.split("\n")[:-1])
            questions: List[str] = json.loads(raw.strip())
            if isinstance(questions, list):
                return [str(q) for q in questions[:5]]
            logger.warning("Unexpected JSON structure from Gemini; returning empty list")
            return []
        except json.JSONDecodeError as exc:
            logger.error(f"Failed to parse Gemini JSON response: {exc} | raw='{raw[:200]}'")
            return []
        except RuntimeError as exc:
            logger.error(f"generate_suggestions Gemini error: {exc}")
            return []

    def summarize_document(self, text: str) -> str:
        """Produce a concise 3-4 sentence summary of an industrial document.

        Args:
            text: Raw document text (will be truncated to 2000 chars in the prompt).

        Returns:
            Summary string, or an error message on failure.
        """
        truncated = text[:2000]
        prompt = DOCUMENT_SUMMARY_PROMPT.format(text=truncated)
        try:
            summary = self._call_gemini(prompt)
            return summary.strip()
        except RuntimeError as exc:
            logger.error(f"summarize_document Gemini error: {exc}")
            return f"Summary unavailable: {exc}"

    def root_cause_analysis(self, equipment_tag: str) -> Dict:
        """Retrieve all available context for *equipment_tag* and perform RCA.

        Args:
            equipment_tag: Equipment identifier (e.g. 'P-101', 'HX-202').

        Returns:
            Dict with keys:
                equipment_tag, analysis (str), chunks_used (int), error (str|None).
        """
        logger.info(f"Root-cause analysis requested for tag: {equipment_tag}")
        retriever = get_retriever()

        # Retrieve the maximum available context for the equipment tag
        try:
            chunks = retriever.retrieve(
                query=f"failure analysis maintenance inspection {equipment_tag}",
                n_results=20,
                equipment_tags=[equipment_tag],
            )
        except Exception as exc:
            logger.error(f"RCA retrieval failed: {exc}", exc_info=True)
            return {
                "equipment_tag": equipment_tag,
                "analysis": "",
                "chunks_used": 0,
                "error": f"Retrieval failed: {exc}",
            }

        if not chunks:
            return {
                "equipment_tag": equipment_tag,
                "analysis": (
                    f"No documents found for equipment tag '{equipment_tag}'. "
                    "Please ensure maintenance records and inspection reports for "
                    "this equipment have been ingested."
                ),
                "chunks_used": 0,
                "error": None,
            }

        context = self._build_context(chunks)
        prompt = ROOT_CAUSE_PROMPT.format(
            equipment_tag=equipment_tag,
            context=context,
        )

        try:
            analysis = self._call_gemini(prompt)
        except RuntimeError as exc:
            logger.error(f"RCA generation failed: {exc}")
            return {
                "equipment_tag": equipment_tag,
                "analysis": "",
                "chunks_used": len(chunks),
                "error": f"Generation failed: {exc}",
            }

        return {
            "equipment_tag": equipment_tag,
            "analysis": analysis.strip(),
            "chunks_used": len(chunks),
            "error": None,
        }


# ---------------------------------------------------------------------------
# Singleton accessor
# ---------------------------------------------------------------------------

_pipeline: Optional[RAGPipeline] = None


def get_pipeline() -> RAGPipeline:
    """Return (or lazily create) the global RAGPipeline singleton."""
    global _pipeline
    if _pipeline is None:
        _pipeline = RAGPipeline()
    return _pipeline
