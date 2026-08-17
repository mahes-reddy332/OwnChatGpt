import pytest
from fastapi.testclient import TestClient


def test_create_and_list_threads(client: TestClient):
    """Test creating a thread and listing threads."""
    # 1. Create thread
    res = client.post("/api/threads", json={"title": "Custom Thread Title"})
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "Custom Thread Title"
    thread_id = data["id"]

    # 2. List threads
    list_res = client.get("/api/threads")
    assert list_res.status_code == 200
    threads = list_res.json()
    assert any(t["id"] == thread_id for t in threads)


def test_get_thread_detail(client: TestClient):
    """Test retrieving thread details and message history."""
    # Create thread
    res = client.post("/api/threads", json={"title": "Detail Test"})
    thread_id = res.json()["id"]

    # Get details
    detail_res = client.get(f"/api/threads/{thread_id}")
    assert detail_res.status_code == 200
    data = detail_res.json()
    assert data["id"] == thread_id
    assert data["title"] == "Detail Test"
    assert "messages" in data
    assert isinstance(data["messages"], list)


def test_update_thread_title(client: TestClient):
    """Test updating a thread's title."""
    res = client.post("/api/threads", json={"title": "Initial Title"})
    thread_id = res.json()["id"]

    # Update title
    patch_res = client.patch(
        f"/api/threads/{thread_id}", json={"title": "Updated Title"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Updated Title"

    # Verify updated
    get_res = client.get(f"/api/threads/{thread_id}")
    assert get_res.json()["title"] == "Updated Title"


def test_delete_thread(client: TestClient):
    """Test deleting a thread."""
    res = client.post("/api/threads", json={"title": "To Delete"})
    thread_id = res.json()["id"]

    # Delete
    del_res = client.delete(f"/api/threads/{thread_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # Verify 404
    get_res = client.get(f"/api/threads/{thread_id}")
    assert get_res.status_code == 404
