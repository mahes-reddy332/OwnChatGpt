import pytest
from fastapi.testclient import TestClient
from app.memory.store import get_memory_manager
from app.memory.extractor import _fallback_memory_extraction


def test_memory_store_lifecycle():
    """Test storing, formatting, and deleting user memories."""
    manager = get_memory_manager()
    user_id = "test_user_42"

    # 1. Put memory
    mem1 = manager.put_memory(user_id=user_id, text="Prefers Python 3.11", category="preference")
    assert mem1.text == "Prefers Python 3.11"
    assert mem1.user_id == user_id

    mem2 = manager.put_memory(user_id=user_id, text="Building a healthcare app", category="project")
    assert mem2.text == "Building a healthcare app"

    # 2. List memories
    all_mems = manager.get_user_memories(user_id)
    assert len(all_mems) >= 2
    texts = [m.text for m in all_mems]
    assert "Prefers Python 3.11" in texts
    assert "Building a healthcare app" in texts

    # 3. Format for prompt
    prompt_str = manager.format_memories_for_prompt(user_id)
    assert "- Prefers Python 3.11" in prompt_str
    assert "- Building a healthcare app" in prompt_str

    # 4. Delete memory
    deleted = manager.delete_memory(user_id, mem1.id)
    assert deleted is True

    # 5. Verify deletion
    remaining = manager.get_user_memories(user_id)
    assert mem1.id not in [m.id for m in remaining]


def test_fallback_memory_extraction():
    """Test heuristic memory extraction when analyzing user statements."""
    existing = ""
    # Name extraction
    d1 = _fallback_memory_extraction("Hi, my name is Bruce Wayne.", existing)
    assert d1.should_write is True
    assert len(d1.memories) == 1
    assert "Bruce wayne" in d1.memories[0].text or "Bruce Wayne" in d1.memories[0].text

    # No facts in greeting
    d2 = _fallback_memory_extraction("What is the capital of France?", existing)
    assert d2.should_write is False
    assert len(d2.memories) == 0


def test_memory_api_endpoints(client: TestClient):
    """Test REST endpoints for listing, creating, and deleting memories."""
    user_id = "api_test_user"

    # 1. Create memory
    create_res = client.post("/api/memory", json={
        "text": "Likes dark theme UI",
        "user_id": user_id,
        "category": "preference",
    })
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["text"] == "Likes dark theme UI"
    mem_id = created["id"]

    # 2. List memories
    list_res = client.get(f"/api/memory?user_id={user_id}")
    assert list_res.status_code == 200
    mems = list_res.json()
    assert any(m["id"] == mem_id for m in mems)

    # 3. Delete memory
    del_res = client.delete(f"/api/memory/{mem_id}?user_id={user_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
