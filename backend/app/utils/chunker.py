"""
chunker.py
~~~~~~~~~~
Splits parsed document pages into overlapping text chunks suitable for
embedding into a vector store (ChromaDB).

Uses LangChain's RecursiveCharacterTextSplitter so that chunk boundaries
fall on natural text separators (paragraph breaks, sentence endings, etc.)
before resorting to hard character splits.
"""

from typing import Dict, List

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import get_settings

settings = get_settings()


class DocumentChunker:
    """Converts a list of document pages into embedding-ready chunks."""

    def __init__(self) -> None:
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.chunk_size,
            chunk_overlap=settings.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""],
            length_function=len,
        )

    def chunk_pages(
        self,
        pages: List[Dict],
        document_id: str,
        document_name: str,
    ) -> List[Dict]:
        """Split document pages into overlapping text chunks with metadata.

        Args:
            pages: List of page dicts as produced by :class:`DocumentParser`.
                   Each dict must contain at least ``"text"`` and optionally
                   ``"page_number"``.
            document_id: UUID string of the parent
                         :class:`~app.models.document.Document` row.
            document_name: Human-readable name of the document (used for
                           source attribution in query results).

        Returns:
            List of chunk dicts, each containing:

            - ``chunk_id`` – globally unique identifier for this chunk.
            - ``text`` – the chunk text (≥ 20 characters).
            - ``document_id`` – parent document UUID.
            - ``document_name`` – parent document display name.
            - ``page_number`` – originating page number.
            - ``chunk_index`` – sequential index across the whole document.
        """
        chunks: List[Dict] = []
        chunk_idx: int = 0

        for page in pages:
            page_text: str = page.get("text", "").strip()
            if not page_text:
                continue

            page_number: int = page.get("page_number", 1)
            page_chunks: List[str] = self.splitter.split_text(page_text)

            for chunk_text in page_chunks:
                stripped = chunk_text.strip()
                # Skip trivially short chunks that add noise to the index
                if len(stripped) < 20:
                    continue

                chunks.append(
                    {
                        "chunk_id": f"{document_id}_chunk_{chunk_idx}",
                        "text": stripped,
                        "document_id": document_id,
                        "document_name": document_name,
                        "page_number": page_number,
                        "chunk_index": chunk_idx,
                    }
                )
                chunk_idx += 1

        return chunks
