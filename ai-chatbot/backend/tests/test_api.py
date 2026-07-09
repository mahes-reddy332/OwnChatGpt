"""Backend API tests for core endpoints and upload-to-chat integration."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


def test_root(client: TestClient):
    r = client.get("/")
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "AI Chatbot API"


def test_health(client: TestClient):
    r = client.get("/api/health")
    assert r.status_code == 200
    data = r.json()
    assert "status" in data
    assert "provider" in data
    assert "api_connected" in data
    assert "mongodb_connected" in data


def test_models(client: TestClient):
    r = client.get("/api/models")
    assert r.status_code == 200
    data = r.json()
    assert "models" in data
    assert "current_provider" in data
    assert isinstance(data["models"], list)


def test_status(client: TestClient):
    r = client.get("/api/status")
    assert r.status_code == 200
    data = r.json()
    assert "provider" in data
    assert "uptime_seconds" in data
    assert "total_uploads" in data


def test_settings(client: TestClient):
    r = client.get("/api/settings")
    assert r.status_code == 200
    data = r.json()
    assert "default_model" in data
    assert "mongodb_connected" in data


@pytest.fixture(scope="module")
def upload_data(client: TestClient) -> dict:
    files = {"file": ("notes.txt", b"hello from a test file", "text/plain")}
    r = client.post("/api/upload-file", files=files)
    assert r.status_code == 200
    data = r.json()
    assert data["upload_id"]
    assert data["content"]
    return data


def test_chat_with_file_context(client: TestClient, upload_data: dict):
    token = "DOC_TOKEN_42917"
    payload = {
        "message": "Return exactly the token from the uploaded file and nothing else.",
        "files": [
            {
                "upload_id": upload_data["upload_id"],
                "name": upload_data["name"],
                "type": upload_data["type"],
                "size": upload_data["size"],
                "content": f"Test document context. Critical token: {token}",
            }
        ],
    }
    r = client.post("/api/chat", json=payload)
    if r.status_code == 502:
        pytest.skip(f"Upstream LLM unavailable: {r.json().get('detail', 'provider error')}")

    assert r.status_code == 200
    data = r.json()
    response = (data.get("response") or "").strip()
    assert token in response, "LLM response did not include uploaded file token"


@pytest.fixture(scope="module")
def conv_id(client: TestClient) -> str | None:
    r = client.post(
        "/api/chat",
        json={"message": "What is 2+2? Answer in one word."},
    )
    if r.status_code == 502:
        pytest.skip(f"Upstream LLM unavailable: {r.json().get('detail', 'provider error')}")

    assert r.status_code == 200
    data = r.json()
    return data["conversation_id"]


def test_chat(conv_id: str | None):
    if conv_id is None:
        return None
    assert isinstance(conv_id, str)
    assert len(conv_id) > 0


def test_chat_followup(client: TestClient, conv_id: str | None):
    if conv_id is None:
        return
    r = client.post("/api/chat", json={"message": "Now multiply that by 10", "conversation_id": conv_id})
    assert r.status_code == 200
    data = r.json()
    assert data["conversation_id"] == conv_id
