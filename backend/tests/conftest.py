import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client() -> TestClient:
    """
    Fixture that provides a FastAPI TestClient.
    
    Returns:
        TestClient: The FastAPI test client instance.
    """
    return TestClient(app)
