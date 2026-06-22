from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    llm_temperature: float = 0.1

    # Database
    database_url: str = "sqlite+aiosqlite:///./factorymind.db"

    # Storage
    chroma_persist_dir: str = "../storage/chromadb"
    upload_dir: str = "../storage/uploads"

    # Embeddings
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    fallback_embedding_model: str = "all-MiniLM-L6-v2"

    # RAG
    max_retrieval_chunks: int = 5
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    # App
    app_env: str = "development"
    secret_key: str = "change_me_in_production"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
