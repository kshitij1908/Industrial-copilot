# pyrefly: ignore [missing-import]
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models.base import init_db


@pytest_asyncio.fixture(autouse=True, scope="session")
async def setup_test_db():
    """Initialize database tables for testing."""
    await init_db()


@pytest.mark.asyncio
async def test_health():
    """Test the health check endpoint."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_documents_list_empty():
    """Test documents endpoint returns empty list initially."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/documents/")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_chat_empty_question():
    """Test chat endpoint rejects empty questions."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/chat/query", json={"question": ""})
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_equipment_list_empty():
    """Test equipment list returns empty initially."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/equipment/")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_analytics_dashboard():
    """Test analytics dashboard returns expected structure."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "total_documents" in data
    assert "total_queries" in data
    assert "total_equipment_tags" in data


@pytest.mark.asyncio
async def test_auth_flow():
    """Test user registration, login, and me endpoints."""
    import uuid
    username = f"testuser_{uuid.uuid4().hex[:8]}"
    password = "testpassword123"
    
    # 1. Register user
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/auth/register",
            json={
                "username": username,
                "password": password,
                "email": "test@example.com",
                "full_name": "Test User",
            }
        )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == username
    assert data["email"] == "test@example.com"
    assert "id" in data
    
    # 2. Login user
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/auth/login",
            json={
                "username": username,
                "password": password,
            }
        )
    assert response.status_code == 200
    login_data = response.json()
    assert "access_token" in login_data
    assert login_data["username"] == username
    token = login_data["access_token"]
    
    # 3. Fetch me profile
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
    assert response.status_code == 200
    me_data = response.json()
    assert me_data["username"] == username
    assert me_data["full_name"] == "Test User"

