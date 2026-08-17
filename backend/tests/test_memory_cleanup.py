import pytest
from fastapi.testclient import TestClient
from app.memory.store import get_memory_manager
from app.memory.cleaner import reconcile_user_memories


def test_update_memory():
    """Test editing an existing memory entry."""
    manager = get_memory_manager()
    user_id = "test_update_user"

    mem = manager.put_memory(user_id=user_id, text="Lives in Seattle", category="profile")
    assert mem.text == "Lives in Seattle"

    updated = manager.update_memory(user_id=user_id, memory_id=mem.id, text="Moved to Austin", category="profile")
    assert updated is not None
    assert updated.text == "Moved to Austin"

    # Verify retrieval
    mems = manager.get_user_memories(user_id)
    assert any(m.text == "Moved to Austin" for m in mems)
    assert not any(m.text == "Lives in Seattle" for m in mems)


def test_clear_all_memories():
    """Test purging all memories for a user."""
    manager = get_memory_manager()
    user_id = "test_clear_user"

    manager.put_memory(user_id=user_id, text="Fact 1")
    manager.put_memory(user_id=user_id, text="Fact 2")
    assert len(manager.get_user_memories(user_id)) >= 2

    cleared = manager.clear_all_memories(user_id)
    assert cleared >= 2
    assert len(manager.get_user_memories(user_id)) == 0


def test_prune_excess_memories_retention_bound():
    """Test memory pruning when exceeding max retention entries."""
    manager = get_memory_manager()
    user_id = "test_retention_user"
    manager.clear_all_memories(user_id)

    # Insert 15 items
    for i in range(15):
        manager.put_memory(user_id=user_id, text=f"Item {i}")

    assert len(manager.get_user_memories(user_id)) == 15

    # Enforce limit of 10
    pruned = manager.prune_excess_memories(user_id, max_entries=10)
    assert pruned == 5
    assert len(manager.get_user_memories(user_id)) == 10


@pytest.mark.asyncio
async def test_reconcile_user_memories():
    """Test conflict reconciliation and duplicate consolidation."""
    manager = get_memory_manager()
    user_id = "test_reconcile_user"
    manager.clear_all_memories(user_id)

    manager.put_memory(user_id=user_id, text="Prefers Python")
    manager.put_memory(user_id=user_id, text="Prefers Python")  # duplicate

    remaining = await reconcile_user_memories(user_id)
    assert remaining == 1
    mems = manager.get_user_memories(user_id)
    assert len(mems) == 1
    assert mems[0].text == "Prefers Python"


def test_memory_cleanup_api_endpoints(client: TestClient):
    """Test REST endpoints for update, clear all, and cleanup."""
    user_id = "api_cleanup_user"
    client.delete(f"/api/memory/clear?user_id={user_id}")

    # 1. Create
    res = client.post("/api/memory", json={"text": "Original text", "user_id": user_id})
    mem_id = res.json()["id"]

    # 2. Update
    put_res = client.put(f"/api/memory/{mem_id}?user_id={user_id}", json={"text": "Updated text"})
    assert put_res.status_code == 200
    assert put_res.json()["text"] == "Updated text"

    # 3. Cleanup endpoint
    clean_res = client.post(f"/api/memory/cleanup?user_id={user_id}")
    assert clean_res.status_code == 200
    assert clean_res.json()["success"] is True

    # 4. Clear all endpoint
    clear_res = client.delete(f"/api/memory/clear?user_id={user_id}")
    assert clear_res.status_code == 200
    assert clear_res.json()["success"] is True
    assert clear_res.json()["cleared_count"] >= 1
