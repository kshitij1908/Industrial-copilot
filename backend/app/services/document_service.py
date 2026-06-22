import logging
import os
import uuid
from datetime import datetime
from typing import List, Dict

from app.config import get_settings
from app.models.document import DocumentStatus

logger = logging.getLogger(__name__)
settings = get_settings()


class DocumentService:
    """
    Orchestrates the full document processing pipeline:
    Upload → Parse → Chunk → Embed → Store in ChromaDB → Update DB
    """

    @staticmethod
    async def process_document(doc_id: str, file_path: str, document_type: str) -> None:
        """
        Full async pipeline. Called as a background task after upload.
        Updates document status in DB throughout processing.
        """
        from app.models.base import AsyncSessionLocal
        from app.models.document import Document, DocumentStatus
        from app.utils.document_parser import DocumentParser
        from app.utils.chunker import DocumentChunker
        from app.utils.equipment_detector import detect_equipment_tags
        from app.utils.metadata_extractor import build_chunk_metadata
        from app.embeddings.embedder import get_embedder
        from app.vectorstore.store import ChromaVectorStore
        from sqlalchemy import select

        async with AsyncSessionLocal() as db:
            try:
                # Set status to PROCESSING
                result = await db.execute(select(Document).where(Document.id == doc_id))
                doc = result.scalar_one_or_none()
                if not doc:
                    logger.error(f"Document {doc_id} not found in DB")
                    return

                doc.status = DocumentStatus.PROCESSING
                await db.commit()
                logger.info(f"Processing document: {doc.original_name} ({doc_id})")

                # STEP 1: Parse document
                parser = DocumentParser()
                pages = parser.parse(file_path)
                if not pages:
                    raise ValueError("Document could not be parsed or is empty")
                logger.info(f"Parsed {len(pages)} pages from {doc.original_name}")

                # STEP 2: Detect equipment tags from full text
                full_text = " ".join(p.get("text", "") for p in pages)
                equipment_tags = detect_equipment_tags(full_text)
                logger.info(f"Detected equipment tags: {equipment_tags}")

                # STEP 3: Chunk content
                chunker = DocumentChunker()
                chunks = chunker.chunk_pages(pages, doc_id, doc.original_name)
                logger.info(f"Created {len(chunks)} chunks")

                if not chunks:
                    raise ValueError("No text content could be extracted for chunking")

                # STEP 4: Build metadata for each chunk
                upload_date_str = doc.upload_date.isoformat() if doc.upload_date else datetime.utcnow().isoformat()
                metadatas = []
                for chunk in chunks:
                    meta = build_chunk_metadata(
                        chunk=chunk,
                        document_type=document_type,
                        upload_date=upload_date_str,
                        equipment_tags=equipment_tags,
                    )
                    # ChromaDB metadata must be flat strings/ints/floats
                    flat_meta = {
                        "document_id": meta["document_id"],
                        "document_name": meta["document_name"],
                        "page_number": int(meta["page_number"]),
                        "chunk_index": int(meta["chunk_index"]),
                        "document_type": meta["document_type"],
                        "upload_date": meta["upload_date"],
                        "equipment_tags": meta["equipment_tags"],
                    }
                    metadatas.append(flat_meta)

                # STEP 5: Generate embeddings
                embedder = get_embedder()
                texts = [c["text"] for c in chunks]
                logger.info(f"Generating embeddings for {len(texts)} chunks...")
                embeddings = embedder.embed_texts(texts)
                logger.info("Embeddings generated")

                # STEP 6: Store in ChromaDB
                store = ChromaVectorStore()
                store.add_chunks(chunks, embeddings, metadatas)
                logger.info(f"Stored {len(chunks)} chunks in ChromaDB")

                # STEP 7: Update DB record as READY
                doc.status = DocumentStatus.READY
                doc.page_count = len(pages)
                doc.chunk_count = len(chunks)
                doc.equipment_tags = equipment_tags
                doc.processed_date = datetime.utcnow()
                doc.error_message = None
                await db.commit()

                # STEP 8: Update equipment registry
                await DocumentService._update_equipment_registry(doc_id, equipment_tags, db)

                # STEP 9: Generate suggested questions (non-blocking)
                try:
                    await DocumentService._generate_suggestions(full_text[:2000], doc_id)
                except Exception as e:
                    logger.warning(f"Failed to generate suggestions: {e}")

                logger.info(f"Document {doc.original_name} processed successfully")

            except Exception as e:
                logger.error(f"Processing failed for {doc_id}: {e}", exc_info=True)
                try:
                    result = await db.execute(select(Document).where(Document.id == doc_id))
                    doc = result.scalar_one_or_none()
                    if doc:
                        doc.status = DocumentStatus.FAILED
                        doc.error_message = str(e)[:500]
                        await db.commit()
                except Exception as db_err:
                    logger.error(f"Could not update failure status: {db_err}")

    @staticmethod
    async def _update_equipment_registry(
        doc_id: str, equipment_tags: List[str], db
    ) -> None:
        """Add/update equipment records and link to this document."""
        from app.models.equipment import Equipment
        from app.utils.equipment_detector import get_equipment_type
        from sqlalchemy import select

        for tag in equipment_tags:
            result = await db.execute(select(Equipment).where(Equipment.tag == tag))
            eq = result.scalar_one_or_none()
            if eq:
                ids = eq.related_document_ids or []
                if doc_id not in ids:
                    ids.append(doc_id)
                    eq.related_document_ids = ids
            else:
                eq = Equipment(
                    id=str(uuid.uuid4()),
                    tag=tag,
                    equipment_type=get_equipment_type(tag),
                    related_document_ids=[doc_id],
                    access_count=0,
                    created_at=datetime.utcnow(),
                )
                db.add(eq)
        await db.commit()

    @staticmethod
    async def _generate_suggestions(text_sample: str, doc_id: str) -> None:
        """Generate suggested questions for this document using LLM (fire and forget)."""
        try:
            from app.rag.pipeline import get_pipeline
            pipeline = get_pipeline()
            pipeline.summarize_document(text_sample)
        except Exception as e:
            logger.debug(f"Suggestion generation skipped: {e}")
