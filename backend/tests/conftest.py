import uuid
import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import init_db


@pytest.fixture(scope="session", autouse=True)
def initialize_database():
    """Ensure DB tables exist before running any test."""
    asyncio.run(init_db())


@pytest.fixture
def client() -> TestClient:
    """
    Fixture that provides an authenticated FastAPI TestClient by default.
    Registers a fresh test user and injects session cookies + CSRF header.
    """
    test_client = TestClient(app)
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    
    signup_res = test_client.post(
        "/api/auth/signup",
        json={
            "email": unique_email,
            "password": "TestPassword123!",
            "display_name": "Test User",
        },
    )
    if signup_res.status_code == 201:
        csrf = signup_res.cookies.get("nexus_csrf")
        if csrf:
            test_client.headers.update({"x-csrf-token": csrf})
    
    return test_client


@pytest.fixture
def unauthenticated_client() -> TestClient:
    """Fixture that provides an unauthenticated FastAPI TestClient."""
    return TestClient(app)
