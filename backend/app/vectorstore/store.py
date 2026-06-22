import logging
from typing import Dict, List, Optional

from app.vectorstore.chroma_client import get_chroma_client

logger = logging.getLogger(__name__)

COLLECTION_NAME = "industrial_docs"


class ChromaVectorStore:
    """High-level wrapper around a ChromaDB collection for industrial documents."""

    def __init__(self, collection_name: str = COLLECTION_NAME) -> None:
        self._collection_name = collection_name
        client = get_chroma_client()
        self._collection = client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(
            f"ChromaVectorStore ready — collection '{collection_name}' "
            f"({self._collection.count()} existing chunks)"
        )

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    def add_chunks(
        self,
        chunks: List[Dict],
        embeddings: List[List[float]],
        metadatas: List[Dict],
    ) -> None:
        """Upsert a batch of document chunks into the collection.

        Args:
            chunks:     List of chunk dicts; each must have 'chunk_id' and 'text'.
            embeddings: Pre-computed embedding vectors (same length as chunks).
            metadatas:  Metadata dicts (same length as chunks).
        """
        if not chunks:
            logger.warning("add_chunks called with empty chunk list — nothing to do")
            return

        ids = [chunk["chunk_id"] for chunk in chunks]
        documents = [chunk["text"] for chunk in chunks]

        self._collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )
        logger.info(f"Upserted {len(ids)} chunks into collection '{self._collection_name}'")

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    def query(
        self,
        query_embedding: List[float],
        n_results: int = 5,
        filter_tags: Optional[List[str]] = None,
    ) -> List[Dict]:
        """Perform a cosine-similarity search against the collection.

        Args:
            query_embedding: Embedding vector of the user query.
            n_results:       Maximum number of results to return.
            filter_tags:     Optional list of equipment tags to filter by.
                             When a single tag is provided the ChromaDB
                             ``$contains`` operator is used; multiple tags are
                             combined with ``$or``.

        Returns:
            List of result dicts, each containing:
                - text            (str)
                - metadata        (dict)
                - distance        (float, cosine distance)
                - similarity_score (float, 1 − distance)
        """
        where_filter: Optional[Dict] = None
        if filter_tags:
            if len(filter_tags) == 1:
                where_filter = {"equipment_tags": {"$contains": filter_tags[0]}}
            else:
                where_filter = {
                    "$or": [
                        {"equipment_tags": {"$contains": tag}} for tag in filter_tags
                    ]
                }

        total_in_collection = self._collection.count()
        if total_in_collection == 0:
            logger.warning("Collection is empty — returning no results")
            return []

        # ChromaDB raises if n_results > number of items in the collection
        safe_n = min(n_results, total_in_collection)

        try:
            query_kwargs: Dict = {
                "query_embeddings": [query_embedding],
                "n_results": safe_n,
                "include": ["documents", "metadatas", "distances"],
            }
            if where_filter:
                query_kwargs["where"] = where_filter

            raw = self._collection.query(**query_kwargs)
        except Exception as exc:
            logger.error(f"ChromaDB query failed: {exc}", exc_info=True)
            return []

        results: List[Dict] = []
        documents = raw.get("documents", [[]])[0]
        metadatas = raw.get("metadatas", [[]])[0]
        distances = raw.get("distances", [[]])[0]

        for doc, meta, dist in zip(documents, metadatas, distances):
            # Cosine distance returned by ChromaDB is in [0, 2]; clamp to [0, 1]
            dist_clamped = float(max(0.0, min(1.0, dist)))
            results.append(
                {
                    "text": doc,
                    "metadata": meta or {},
                    "distance": dist_clamped,
                    "similarity_score": round(1.0 - dist_clamped, 6),
                }
            )

        logger.debug(f"Query returned {len(results)} results (filter_tags={filter_tags})")
        return results

    # ------------------------------------------------------------------
    # Delete operations
    # ------------------------------------------------------------------

    def delete_document(self, document_id: str) -> None:
        """Delete all chunks that belong to the given document_id.

        The document_id is stored in each chunk's metadata under the key
        ``document_id``.
        """
        try:
            existing = self._collection.get(
                where={"document_id": {"$eq": document_id}},
                include=[],  # only need IDs
            )
            ids_to_delete = existing.get("ids", [])
            if not ids_to_delete:
                logger.info(f"No chunks found for document_id='{document_id}'")
                return
            self._collection.delete(ids=ids_to_delete)
            logger.info(
                f"Deleted {len(ids_to_delete)} chunks for document_id='{document_id}'"
            )
        except Exception as exc:
            logger.error(
                f"Failed to delete document_id='{document_id}': {exc}", exc_info=True
            )
            raise

    # ------------------------------------------------------------------
    # Utility / stats
    # ------------------------------------------------------------------

    def get_collection_stats(self) -> Dict:
        """Return basic statistics about the collection."""
        return {
            "total_chunks": self._collection.count(),
            "collection_name": self._collection_name,
        }

    def document_exists(self, document_id: str) -> bool:
        """Return True if at least one chunk for the given document_id exists."""
        try:
            existing = self._collection.get(
                where={"document_id": {"$eq": document_id}},
                include=[],
                limit=1,
            )
            return len(existing.get("ids", [])) > 0
        except Exception as exc:
            logger.error(
                f"document_exists check failed for '{document_id}': {exc}",
                exc_info=True,
            )
            return False
