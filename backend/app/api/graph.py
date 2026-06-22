import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.base import get_db
from app.models.document import Document, DocumentStatus
from app.models.equipment import Equipment

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/{tag}")
async def get_knowledge_graph(tag: str, db: AsyncSession = Depends(get_db)):
    """
    Build a knowledge graph for an equipment tag.
    Returns React Flow compatible nodes and edges.
    """
    tag_upper = tag.upper()
    import networkx as nx

    G = nx.DiGraph()
    nodes = []
    edges = []

    # Central equipment node
    G.add_node(tag_upper, type="equipment")
    nodes.append({
        "id": tag_upper,
        "type": "equipment",
        "data": {"label": tag_upper, "type": "Equipment"},
        "position": {"x": 400, "y": 300},
        "style": {"background": "#f59e0b", "color": "#000", "border": "2px solid #d97706"},
    })

    # Find all documents related to this tag
    result = await db.execute(
        select(Document).where(Document.status == DocumentStatus.READY)
    )
    all_docs = result.scalars().all()

    doc_count = 0
    angle_step = 360 / max(len(all_docs), 1)
    import math

    for i, doc in enumerate(all_docs):
        tags = doc.equipment_tags or []
        if tag_upper.upper() not in [t.upper() for t in tags]:
            continue

        angle = math.radians(i * angle_step)
        radius = 250
        x = 400 + radius * math.cos(angle)
        y = 300 + radius * math.sin(angle)

        doc_node_id = f"doc_{doc.id[:8]}"
        G.add_node(doc_node_id, type="document", label=doc.original_name)
        nodes.append({
            "id": doc_node_id,
            "type": "document",
            "data": {
                "label": doc.original_name[:30] + ("..." if len(doc.original_name) > 30 else ""),
                "type": doc.document_type or "Document",
                "full_name": doc.original_name,
            },
            "position": {"x": x, "y": y},
            "style": {"background": "#3b82f6", "color": "#fff", "border": "2px solid #2563eb"},
        })
        edges.append({
            "id": f"e_{tag_upper}_{doc_node_id}",
            "source": tag_upper,
            "target": doc_node_id,
            "label": doc.document_type or "Related",
            "animated": True,
            "style": {"stroke": "#6366f1"},
        })
        G.add_edge(tag_upper, doc_node_id)
        doc_count += 1

        # Add document type sub-node if not already present
        type_id = f"type_{(doc.document_type or 'other').replace(' ', '_').lower()}"
        if type_id not in [n["id"] for n in nodes]:
            type_angle = angle + 0.3
            nodes.append({
                "id": type_id,
                "type": "category",
                "data": {"label": doc.document_type or "Document", "type": "Category"},
                "position": {"x": x + 120, "y": y + 80},
                "style": {"background": "#10b981", "color": "#fff", "border": "2px solid #059669"},
            })
            edges.append({
                "id": f"e_{doc_node_id}_{type_id}",
                "source": doc_node_id,
                "target": type_id,
                "style": {"stroke": "#10b981", "strokeDasharray": "5,5"},
            })

    # Add equipment tags that co-occur with this tag
    related_tags = set()
    for doc in all_docs:
        tags = doc.equipment_tags or []
        if tag_upper.upper() in [t.upper() for t in tags]:
            for t in tags:
                if t.upper() != tag_upper.upper():
                    related_tags.add(t)

    for j, related_tag in enumerate(list(related_tags)[:5]):
        r_angle = math.radians(j * 72 + 180)
        r_x = 400 + 400 * math.cos(r_angle)
        r_y = 300 + 400 * math.sin(r_angle)
        r_id = f"eq_{related_tag}"
        nodes.append({
            "id": r_id,
            "type": "equipment",
            "data": {"label": related_tag, "type": "Related Equipment"},
            "position": {"x": r_x, "y": r_y},
            "style": {"background": "#f59e0b", "color": "#000", "border": "1px dashed #d97706", "opacity": "0.7"},
        })
        edges.append({
            "id": f"e_{tag_upper}_{r_id}",
            "source": tag_upper,
            "target": r_id,
            "label": "co-occurs",
            "style": {"stroke": "#f59e0b", "strokeDasharray": "5,5"},
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "equipment_tag": tag_upper,
        "document_count": doc_count,
        "related_equipment_count": len(related_tags),
    }


@router.get("/")
async def get_full_graph(db: AsyncSession = Depends(get_db)):
    """Get a high-level graph of all equipment and their document relationships."""
    result = await db.execute(
        select(Equipment).order_by(desc(Equipment.access_count)).limit(20)
    )
    equipment_list = result.scalars().all()

    nodes = []
    edges = []
    import math

    for i, eq in enumerate(equipment_list):
        angle = math.radians(i * (360 / max(len(equipment_list), 1)))
        x = 500 + 350 * math.cos(angle)
        y = 400 + 350 * math.sin(angle)
        nodes.append({
            "id": eq.tag,
            "type": "equipment",
            "data": {"label": eq.tag, "type": eq.equipment_type or "Equipment", "count": eq.access_count},
            "position": {"x": x, "y": y},
        })

    return {"nodes": nodes, "edges": edges}
