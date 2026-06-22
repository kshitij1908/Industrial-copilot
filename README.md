#  Industrial Knowledge Copilot

> **AI-Powered Asset & Operations Brain** — Production-grade RAG platform for industrial document intelligence

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-orange)](https://deepmind.google/technologies/gemini)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-0.5-purple)](https://www.trychroma.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-MultiAgent-red)](https://langchain-ai.github.io/langgraph/)
[![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-blue)](https://web.dev/progressive-web-apps/)

---

## Overview

The Industrial Knowledge Copilot enables engineers, operators, and field technicians to query enterprise industrial documents using natural language. Built on a **Multi-Agent Retrieval-Augmented Generation (RAG)** architecture with **Google Gemini 2.5 Flash** and **LangGraph orchestration**.

**Ask questions like:**
- _"What is the startup procedure for Pump P-101?"_
- _"When was Compressor C-201 last inspected?"_
- _"What are OEM lubrication interval recommendations?"_
- _"P-101 का स्टार्टअप प्रक्रिया क्या है?"_ *(Hindi — auto-translated)*

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **Multi-Agent LangGraph** | 4-agent pipeline: Retrieval → Maintenance → Compliance → Summarization |
| 📄 **Interactive PDF Viewer** | Click sources to open PDFs in a drawer, jumping to the exact cited page |
| 🔍 **Root Cause Analysis (RCA)** | AI-powered failure analysis per equipment tag from maintenance records |
| 🌐 **Multi-Language Support** | Auto-detects Hindi/Marathi, translates to English for RAG, back to original |
| 📱 **PWA / Offline Mode** | Service worker caches app shell; queries cached in `localStorage` |
| 🔐 **JWT Authentication** | Signed tokens, protected API routes, pre-seeded `admin / admin` |
| 🗺️ **Knowledge Graph** | ReactFlow visualization of equipment-document relationships |
| 🎙️ **Voice Input** | Web Speech API for hands-free queries |
| 📊 **Analytics Dashboard** | Query stats, confidence distribution, document metrics |

---

## Architecture

```
┌─────────────────────────────────────────┐
│   React 19 + Vite Frontend (PWA)        │
│   • Chat UI  • PDF Viewer  • KG Graph   │
└─────────────────┬───────────────────────┘
                  │ REST/JSON  (JWT)
┌─────────────────▼───────────────────────┐
│   FastAPI Backend (Python 3.12)         │
│   /api/chat, /api/documents, /api/auth  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│   LangGraph Multi-Agent Pipeline        │
│   RetrievalAgent → MaintenanceAgent     │
│   → ComplianceAgent → SummarizationAgent│
└──────┬──────────────────────┬───────────┘
       │                      │
┌──────▼──────┐      ┌────────▼────────┐
│  ChromaDB   │      │  Gemini 2.5     │
│  (Vectors)  │      │  Flash  (LLM)   │
└─────────────┘      └─────────────────┘
       │
┌──────▼──────────────────────────────┐
│  BAAI/bge-small-en-v1.5 Embeddings  │
└─────────────────────────────────────┘
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | ≥ 3.12 | https://python.org/downloads |
| Node.js | ≥ 18.x | https://nodejs.org |
| pip | latest | included with Python |
| Git | any | https://git-scm.com |

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/kshitij1908/Industrial-copilot.git
cd Industrial-copilot
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env and set your GEMINI_API_KEY

# Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Available at:
- **API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/api/docs
- **Health Check**: http://localhost:8000/health

### 3. Seed Sample Documents *(optional)*

```bash
# From the backend/ directory (with venv active)
python reseed_documents.py
```

This copies the sample PDFs from `docs/` into `storage/uploads/`, chunks and embeds them into ChromaDB.

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Available at: **http://localhost:5173**

### 5. Login

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin` |

---

## Folder Structure

```
industrial-copilot/
├── frontend/
│   ├── public/
│   │   ├── manifest.json      # PWA web app manifest
│   │   └── sw.js              # Service worker (offline caching)
│   └── src/
│       ├── pages/             # LoginPage, DashboardPage, ChatPage, EquipmentPage, etc.
│       ├── components/        # Chat (DocumentViewer, MessageList), Documents, Layout
│       ├── hooks/             # useChat, useDocuments, useEquipment, useVoice
│       ├── services/          # Axios API service layer
│       ├── stores/            # Zustand (authStore, themeStore)
│       └── types/             # TypeScript interfaces
│
├── backend/
│   ├── app/
│   │   ├── api/               # FastAPI routers: auth, chat, documents, equipment, graph
│   │   ├── rag/               # LangGraph agents, RAG pipeline, retriever, translation
│   │   ├── services/          # Document processing service
│   │   ├── embeddings/        # BAAI/bge-small-en-v1.5 embedder
│   │   ├── vectorstore/       # ChromaDB client and store wrapper
│   │   ├── models/            # SQLAlchemy ORM models (Document, User, Equipment)
│   │   └── utils/             # Parser, chunker, equipment detector, metadata extractor
│   ├── requirements.txt
│   └── .env.example
│
├── docs/                      # Sample industrial PDFs for demo
├── storage/
│   ├── uploads/               # Uploaded document files (gitignored)
│   └── chromadb/              # Persistent vector embeddings (gitignored)
├── docker-compose.yml
└── start-backend.ps1          # Windows one-click launcher
```

---

## Configuration

Create `backend/.env` from `backend/.env.example`:

```env
# REQUIRED
GEMINI_API_KEY=your_gemini_api_key_here

# Database
DATABASE_URL=sqlite+aiosqlite:///./industrial_copilot.db

# Storage
CHROMA_PERSIST_DIR=../storage/chromadb
UPLOAD_DIR=../storage/uploads

# Embedding model
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5

# LLM
GEMINI_MODEL=gemini-2.5-flash
LLM_TEMPERATURE=0.1

# RAG
MAX_RETRIEVAL_CHUNKS=5
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Get your free API key at: https://aistudio.google.com/app/apikey

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/login` | JWT login |
| POST | `/api/documents/upload` | Upload documents |
| GET | `/api/documents/` | List all documents |
| GET | `/api/documents/{id}/download` | Download original file |
| DELETE | `/api/documents/{id}` | Delete document |
| POST | `/api/chat/query` | Multi-agent RAG query |
| POST | `/api/chat/root-cause` | Equipment RCA |
| GET | `/api/chat/suggestions` | Suggested questions |
| GET | `/api/equipment/` | List equipment |
| GET | `/api/equipment/{tag}` | Equipment detail |
| GET | `/api/history/` | Query history |
| GET | `/api/analytics/dashboard` | Dashboard stats |
| GET | `/api/graph/{tag}` | Knowledge graph data |

Full interactive docs: http://localhost:8000/api/docs

---

## Tech Stack

**Frontend**: React 19, Vite, TypeScript, Framer Motion, ReactFlow, Recharts, React Query, Zustand, react-pdf

**Backend**: Python 3.12, FastAPI, Uvicorn, LangChain 0.3, LangGraph, SQLAlchemy (async), aiosqlite

**AI**: Google Gemini 2.5 Flash, BAAI/bge-small-en-v1.5 embeddings, ChromaDB, EasyOCR

**Parsing**: pdfplumber, python-docx, pandas/openpyxl, Pillow

---

## Production Deployment

- Replace SQLite with PostgreSQL: `DATABASE_URL=postgresql+asyncpg://...`
- Replace local file storage with AWS S3 or GCS
- Deploy backend with Gunicorn + Nginx or as a Docker container
- Use Redis + Celery for robust background processing
- Set a strong `SECRET_KEY` in `.env` for JWT signing

---

## License

MIT License — Built as an Industrial AI Platform Demo
