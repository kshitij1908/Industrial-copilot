import logging
import os

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_client = None


def get_chroma_client():
    """Return (or lazily create) the global ChromaDB PersistentClient singleton."""
    global _client
    if _client is None:
        persist_dir = os.path.abspath(settings.chroma_persist_dir)
        os.makedirs(persist_dir, exist_ok=True)
        logger.info(f"Initializing ChromaDB at: {persist_dir}")
        _client = chromadb.PersistentClient(
            path=persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        logger.info("ChromaDB initialized")
    return _client
