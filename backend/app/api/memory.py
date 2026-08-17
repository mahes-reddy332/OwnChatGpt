from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query
from app.memory.models import MemoryEntry, MemoryCreateRequest
from app.memory.store import get_memory_manager
from app.memory.cleaner import reconcile_user_memories

router = APIRouter(prefix="/memory", tags=["memory"])


class MemoryUpdateRequest(BaseModel):
    """Request payload to update an existing memory."""
    text: str
    category: str | None = None


@router.get("", response_model=list[MemoryEntry])
async def list_memories(user_id: str = Query("default_user")):
    """
    List all stored long-term memories for a given user.
    """
    manager = get_memory_manager()
    return manager.get_user_memories(user_id)


@router.post("", response_model=MemoryEntry)
async def create_memory(request: MemoryCreateRequest):
    """
    Manually add a long-term memory entry for a user.
    """
    manager = get_memory_manager()
    return manager.put_memory(
        user_id=request.user_id,
        text=request.text,
        category=request.category,
    )


@router.put("/{memory_id}", response_model=MemoryEntry)
async def update_memory(
    memory_id: str,
    request: MemoryUpdateRequest,
    user_id: str = Query("default_user"),
):
    """
    Update an existing long-term memory's text or category.
    """
    manager = get_memory_manager()
    updated = manager.update_memory(
        user_id=user_id,
        memory_id=memory_id,
        text=request.text,
        category=request.category,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Memory '{memory_id}' not found.")
    return updated


@router.delete("/clear")
async def clear_all_memories(user_id: str = Query("default_user")):
    """
    Clear all stored long-term memories for a user.
    """
    manager = get_memory_manager()
    count = manager.clear_all_memories(user_id)
    return {"success": True, "cleared_count": count}


@router.delete("/{memory_id}")
async def delete_memory(memory_id: str, user_id: str = Query("default_user")):
    """
    Delete a specific long-term memory entry by ID.
    """
    manager = get_memory_manager()
    deleted = manager.delete_memory(user_id, memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Memory '{memory_id}' not found.")
    return {"success": True, "memory_id": memory_id}


@router.post("/cleanup")
async def cleanup_and_reconcile_memories(user_id: str = Query("default_user")):
    """
    Reconcile contradictory memories, eliminate duplicates, and enforce retention limits.
    """
    remaining = await reconcile_user_memories(user_id)
    return {"success": True, "clean_memories_count": remaining}
