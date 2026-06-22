import os
import shutil
import uuid
import logging
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel

from app.models.base import get_db
from app.models.document import Document, DocumentStatus
from app.services.document_service import DocumentService
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter()

ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.xlsx', '.txt', '.png', '.jpg', '.jpeg'}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB


class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_name: str
    file_type: str
    file_size: int
    document_type: str
    status: str
    page_count: int
    equipment_tags: list
    upload_date: str
    chunk_count: int
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


@router.post("/upload")
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    document_type: str = "Other",
    db: AsyncSession = Depends(get_db),
):
    """Upload one or more documents. Processing starts automatically."""
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    upload_dir = os.path.abspath(settings.upload_dir)
    os.makedirs(upload_dir, exist_ok=True)
    uploaded = []

    for file in files:
        # Validate extension
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type '{ext}' not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Read content
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"File {file.filename} exceeds 100MB limit")

        # Save file
        doc_id = str(uuid.uuid4())
        safe_name = f"{doc_id}{ext}"
        file_path = os.path.join(upload_dir, safe_name)
        with open(file_path, "wb") as f:
            f.write(content)

        # Create DB record
        doc = Document(
            id=doc_id,
            filename=safe_name,
            original_name=file.filename or safe_name,
            file_type=ext.lstrip(".").upper(),
            file_size=len(content),
            document_type=document_type,
            status=DocumentStatus.PENDING,
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)

        # Queue processing as background task
        background_tasks.add_task(
            DocumentService.process_document,
            doc_id=doc_id,
            file_path=file_path,
            document_type=document_type,
        )

        uploaded.append({
            "id": doc_id,
            "original_name": file.filename,
            "file_size": len(content),
            "status": "pending",
            "message": "Upload successful. Processing started.",
        })
        logger.info(f"Uploaded document: {file.filename} -> {doc_id}")

    return {"uploaded": uploaded, "count": len(uploaded)}


@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List all documents with pagination."""
    result = await db.execute(
        select(Document).order_by(Document.upload_date.desc()).offset(skip).limit(limit)
    )
    docs = result.scalars().all()
    return [
        DocumentResponse(
            id=d.id,
            filename=d.filename,
            original_name=d.original_name,
            file_type=d.file_type,
            file_size=d.file_size or 0,
            document_type=d.document_type or "Other",
            status=d.status.value if d.status else "pending",
            page_count=d.page_count or 0,
            equipment_tags=d.equipment_tags or [],
            upload_date=d.upload_date.isoformat() if d.upload_date else "",
            chunk_count=d.chunk_count or 0,
            error_message=d.error_message,
        )
        for d in docs
    ]


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    """Get single document status."""
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        original_name=doc.original_name,
        file_type=doc.file_type,
        file_size=doc.file_size or 0,
        document_type=doc.document_type or "Other",
        status=doc.status.value if doc.status else "pending",
        page_count=doc.page_count or 0,
        equipment_tags=doc.equipment_tags or [],
        upload_date=doc.upload_date.isoformat() if doc.upload_date else "",
        chunk_count=doc.chunk_count or 0,
        error_message=doc.error_message,
    )


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a document and its vectors."""
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove from ChromaDB
    try:
        from app.vectorstore.store import ChromaVectorStore
        store = ChromaVectorStore()
        store.delete_document(doc_id)
    except Exception as e:
        logger.warning(f"Could not delete vectors for {doc_id}: {e}")

    # Remove file
    upload_dir = os.path.abspath(settings.upload_dir)
    file_path = os.path.join(upload_dir, doc.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    await db.execute(delete(Document).where(Document.id == doc_id))
    await db.commit()
    return {"message": f"Document {doc_id} deleted successfully"}


@router.get("/{doc_id}/download")
async def download_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    """Download original document file."""
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    upload_dir = os.path.abspath(settings.upload_dir)
    file_path = os.path.join(upload_dir, doc.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=file_path,
        filename=doc.original_name,
        media_type="application/octet-stream",
    )
