from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
import os

from app.config import get_settings
from app.models.base import init_db
from app.api import documents, chat, equipment, history, analytics, graph, voice, auth

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    logger.info("Starting Industrial Knowledge Copilot API...")
    
    # Initialize database
    await init_db()
    logger.info("Database initialized")
    
    # Pre-seed default admin user if database is empty
    from app.models.base import AsyncSessionLocal
    from app.models.user import User
    from app.api.auth import get_password_hash
    from sqlalchemy import select
    
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User).limit(1))
            if not result.first():
                admin_user = User(
                    username="admin",
                    hashed_password=get_password_hash("admin"),
                    email="admin@example.com",
                    full_name="Administrator",
                    is_active=True
                )
                session.add(admin_user)
                await session.commit()
                logger.info("Database empty. Seeded default 'admin' user.")
    except Exception as e:
        logger.error(f"Failed to seed default admin user: {e}")
    
    # Ensure storage directories exist
    os.makedirs(os.path.abspath(settings.upload_dir), exist_ok=True)
    os.makedirs(os.path.abspath(settings.chroma_persist_dir), exist_ok=True)
    logger.info("Storage directories ready")
    
    yield
    
    logger.info("Shutting down...")


app = FastAPI(
    title="Industrial Knowledge Copilot API",
    description="AI-powered industrial document intelligence platform with RAG",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(equipment.router, prefix="/api/equipment", tags=["Equipment"])
app.include_router(history.router, prefix="/api/history", tags=["History"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(graph.router, prefix="/api/graph", tags=["Knowledge Graph"])
app.include_router(voice.router, prefix="/api/voice", tags=["Voice"])


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "Industrial Knowledge Copilot",
        "version": "1.0.0",
    }


@app.get("/", tags=["System"])
async def root():
    return {"message": "Industrial Knowledge Copilot API", "docs": "/api/docs"}
