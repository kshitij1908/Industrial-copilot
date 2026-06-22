"""
Startup seeder — called automatically by main.py when ChromaDB has vectors
but the SQLite documents table is empty (happens after backend restarts with
a fresh database but persistent ChromaDB storage).
"""
import asyncio
import logging
import os
import shutil
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)


async def seed_from_docs() -> None:
    """
    Walk the project-root docs/ directory and register any PDFs that exist
    in ChromaDB's collection but are missing from the SQLite documents table.
    Then trigger chunking/embedding so the metadata is fully in sync.
    """
    from app.config import get_settings
    from app.models.base import AsyncSessionLocal
    from app.models.document import Document, DocumentStatus
    from sqlalchemy import select

    settings = get_settings()

    # Locate docs/ directory (two levels up from backend/app/)
    backend_dir = Path(__file__).parent.parent  # backend/
    docs_dir = backend_dir.parent / "docs"       # project-root/docs/
    upload_dir = Path(settings.upload_dir).resolve()
    upload_dir.mkdir(parents=True, exist_ok=True)

    if not docs_dir.exists():
        logger.info("startup_seeder: No docs/ directory found — skipping.")
        return

    pdf_files = list(docs_dir.glob("*.pdf"))
    if not pdf_files:
        logger.info("startup_seeder: No PDFs in docs/ — skipping.")
        return

    logger.info(f"startup_seeder: Found {len(pdf_files)} PDFs in docs/: {[f.name for f in pdf_files]}")

    for pdf_path in pdf_files:
        dest_path = upload_dir / pdf_path.name
        try:
            # Copy file to uploads if not already there
            if not dest_path.exists():
                shutil.copy2(str(pdf_path), str(dest_path))
                logger.info(f"startup_seeder: Copied {pdf_path.name} → {dest_path}")

            # Check if already in SQLite
            async with AsyncSessionLocal() as session:
                existing = await session.execute(
                    select(Document).where(Document.original_name == pdf_path.name)
                )
                doc = existing.scalar_one_or_none()

                if doc is None:
                    # Register it in SQLite
                    doc = Document(
                        filename=pdf_path.name,
                        original_name=pdf_path.name,
                        file_type="PDF",
                        file_size=dest_path.stat().st_size,
                        document_type="SOP" if "SOP" in pdf_path.name.upper() else
                                       "Maintenance Record" if "RCA" in pdf_path.name.upper() else
                                       "Manual",
                        status=DocumentStatus.READY,  # Already in ChromaDB
                        upload_date=datetime.utcnow(),
                    )
                    session.add(doc)
                    await session.commit()
                    await session.refresh(doc)
                    logger.info(f"startup_seeder: Registered {pdf_path.name} in SQLite (id={doc.id})")
                elif doc.status != DocumentStatus.READY:
                    doc.status = DocumentStatus.READY
                    await session.commit()
                    logger.info(f"startup_seeder: Updated {pdf_path.name} status → READY")
                else:
                    logger.info(f"startup_seeder: {pdf_path.name} already registered (id={doc.id})")

        except Exception as e:
            logger.error(f"startup_seeder: Failed to seed {pdf_path.name}: {e}")

    logger.info("startup_seeder: Sync complete.")
