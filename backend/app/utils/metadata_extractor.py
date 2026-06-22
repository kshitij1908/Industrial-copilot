"""
metadata_extractor.py
~~~~~~~~~~~~~~~~~~~~~
Builds ChromaDB-compatible metadata dicts for document chunks.

ChromaDB only supports scalar metadata values (str, int, float, bool),
so lists are serialised to comma-separated strings.  A separate key that
stores the Python list is included for in-process filtering when the caller
needs the native type.
"""

from typing import Dict, List, Optional

from app.utils.equipment_detector import detect_equipment_tags


def build_chunk_metadata(
    chunk: Dict,
    document_type: str,
    upload_date: str,
    equipment_tags: Optional[List[str]] = None,
) -> Dict:
    """Build a ChromaDB-compatible metadata dict for a single chunk.

    Equipment tags are detected in the chunk text and merged with any
    document-level tags supplied by the caller.  The combined set is stored
    both as a comma-separated string (for ChromaDB) and as a Python list
    (for in-process use).

    Args:
        chunk: Chunk dict as produced by :class:`~app.utils.chunker.DocumentChunker`.
               Must contain ``"text"``, ``"document_id"``, ``"document_name"``,
               ``"page_number"``, and ``"chunk_index"``.
        document_type: High-level document classification string (e.g.
                       ``"SOP"``, ``"Maintenance Record"``).
        upload_date: ISO-formatted upload timestamp string.
        equipment_tags: Optional list of document-level equipment tags to
                        merge with chunk-level detections.

    Returns:
        Dict with the following keys:

        - ``document_id`` – parent document UUID.
        - ``document_name`` – parent document display name.
        - ``page_number`` – originating page number (int).
        - ``chunk_index`` – sequential chunk index within the document (int).
        - ``document_type`` – document classification string.
        - ``upload_date`` – ISO upload timestamp.
        - ``equipment_tags`` – comma-separated equipment tag string (ChromaDB scalar).
        - ``equipment_tags_list`` – Python list of tags (for in-process filtering).
    """
    # Detect equipment tags mentioned in this specific chunk
    chunk_level_tags: List[str] = detect_equipment_tags(chunk.get("text", ""))

    # Merge document-level and chunk-level tags, deduplicate, preserve order
    combined: List[str] = list(
        dict.fromkeys((equipment_tags or []) + chunk_level_tags)
    )

    return {
        "document_id": chunk["document_id"],
        "document_name": chunk["document_name"],
        "page_number": int(chunk.get("page_number", 1)),
        "chunk_index": int(chunk.get("chunk_index", 0)),
        "document_type": document_type,
        "upload_date": upload_date,
        # ChromaDB-safe scalar – empty string when no tags found
        "equipment_tags": ",".join(combined) if combined else "",
        # Python list retained for in-process use (not sent to ChromaDB directly)
        "equipment_tags_list": combined,
    }
