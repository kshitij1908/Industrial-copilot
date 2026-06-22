import logging
from typing import Dict, List, Optional

from app.config import get_settings
from app.embeddings.embedder import get_embedder
from app.utils.equipment_detector import detect_equipment_tags
from app.vectorstore.store import ChromaVectorStore

logger = logging.getLogger(__name__)
settings = get_settings()


class RAGRetriever:
    """Embeds a user query and fetches the top-k relevant chunks from ChromaDB.

    Equipment tags detected (or explicitly provided) are used as metadata
    filters to improve precision.  If the filtered result set is too small
    the retriever automatically falls back to an unfiltered search.
    """

    def __init__(self) -> None:
        self._store: Optional[ChromaVectorStore] = None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @property
    def store(self) -> ChromaVectorStore:
        if self._store is None:
            self._store = ChromaVectorStore()
        return self._store

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def retrieve(
        self,
        query: str,
        n_results: Optional[int] = None,
        equipment_tags: Optional[List[str]] = None,
    ) -> List[Dict]:
        """Embed *query* and retrieve the top-k most relevant chunks.

        Args:
            query:          Natural-language question from the user.
            n_results:      Number of chunks to return.  Defaults to
                            ``settings.max_retrieval_chunks``.
            equipment_tags: Optional explicit list of equipment tags to filter
                            by.  When ``None`` the tags are auto-detected from
                            the query text.

        Returns:
            List of result dicts, each with keys:
                ``text``, ``metadata``, ``similarity_score``.
        """
        n_results = n_results or settings.max_retrieval_chunks
        embedder = get_embedder()

        # Auto-detect equipment tags from the query when not supplied
        if equipment_tags is None:
            equipment_tags = detect_equipment_tags(query)
            if equipment_tags:
                logger.debug(f"Auto-detected equipment tags: {equipment_tags}")

        query_embedding = embedder.embed_query(query)

        # --- Filtered search -------------------------------------------
        results = self.store.query(
            query_embedding=query_embedding,
            n_results=n_results,
            filter_tags=equipment_tags if equipment_tags else None,
        )

        # --- Fallback: unfiltered search if filtered results too sparse ---
        if len(results) < 2 and equipment_tags:
            logger.info(
                "Filtered results insufficient (%d), falling back to unfiltered search",
                len(results),
            )
            results = self.store.query(
                query_embedding=query_embedding,
                n_results=n_results,
            )

        logger.debug(
            "retrieve() returning %d chunks for query='%s'", len(results), query[:80]
        )
        return results


# ---------------------------------------------------------------------------
# Singleton accessor
# ---------------------------------------------------------------------------

_retriever: Optional[RAGRetriever] = None


def get_retriever() -> RAGRetriever:
    """Return (or lazily create) the global RAGRetriever singleton."""
    global _retriever
    if _retriever is None:
        _retriever = RAGRetriever()
    return _retriever
