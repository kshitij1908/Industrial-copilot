import logging
from typing import List
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class EmbeddingService:
    """Manages sentence-transformer embeddings with fallback."""

    def __init__(self) -> None:
        self._model = None
        self._model_name: str | None = None

    def _load_model(self) -> None:
        if self._model is not None:
            return
        from sentence_transformers import SentenceTransformer

        try:
            logger.info(f"Loading embedding model: {settings.embedding_model}")
            self._model = SentenceTransformer(settings.embedding_model)
            self._model_name = settings.embedding_model
            logger.info("Primary embedding model loaded successfully")
        except Exception as e:
            logger.warning(f"Primary model failed: {e}. Loading fallback...")
            try:
                self._model = SentenceTransformer(settings.fallback_embedding_model)
                self._model_name = settings.fallback_embedding_model
                logger.info("Fallback embedding model loaded")
            except Exception as e2:
                logger.error(f"Both embedding models failed: {e2}")
                raise RuntimeError("Could not load any embedding model") from e2

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Encode a list of texts into normalized embedding vectors."""
        self._load_model()
        embeddings = self._model.encode(
            texts,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        return embeddings.tolist()

    def embed_query(self, query: str) -> List[float]:
        """Encode a single query string into an embedding vector."""
        return self.embed_texts([query])[0]

    @property
    def model_name(self) -> str:
        return self._model_name or settings.embedding_model

    @property
    def embedding_dimension(self) -> int:
        self._load_model()
        return self._model.get_sentence_embedding_dimension()


# ---------------------------------------------------------------------------
# Singleton accessor
# ---------------------------------------------------------------------------

_embedder: EmbeddingService | None = None


def get_embedder() -> EmbeddingService:
    """Return (or lazily create) the global EmbeddingService singleton."""
    global _embedder
    if _embedder is None:
        _embedder = EmbeddingService()
    return _embedder
