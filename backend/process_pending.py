import asyncio
import os
import sys
from sqlalchemy import select

from app.models.base import AsyncSessionLocal
from app.models.document import Document, DocumentStatus
from app.services.document_service import DocumentService


async def main():
    # Setup logging to stdout
    import logging
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s", stream=sys.stdout)

    print("Fetching pending documents from database...")
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Document).where(Document.status == DocumentStatus.PENDING))
        docs = result.scalars().all()
        print(f"Found {len(docs)} pending documents.")

        for doc in docs:
            # Check file paths
            uploads_dir = os.path.abspath("../storage/uploads")
            file_path = os.path.join(uploads_dir, doc.filename)
            print(f"\nTriggering processing for: {doc.original_name} (ID: {doc.id})")
            print(f"File path: {file_path}")
            
            if not os.path.exists(file_path):
                print(f"Error: File not found at {file_path}")
                continue

            try:
                await DocumentService.process_document(
                    doc_id=doc.id,
                    file_path=file_path,
                    document_type=doc.document_type or "Other"
                )
                print(f"Finished processing job for {doc.original_name}!")
            except Exception as e:
                print(f"Exception during processing: {e}")


if __name__ == "__main__":
    asyncio.run(main())
