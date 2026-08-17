from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.auth.models import User, Session
from app.auth.service import auth_service
from app.auth.dependencies import get_current_user, get_current_user_and_session, verify_csrf_token
from app.memory.models import MemoryEntry
from app.memory.store import get_memory_manager
from app.memory.cleaner import reconcile_user_memories

router = APIRouter(prefix="/memory", tags=["memory"])


class MemoryCreatePayload(BaseModel):
    """Payload to create a new user memory."""
    text: str = Field(..., min_length=1, max_length=1000)
    category: str = "fact"


class MemoryUpdateRequest(BaseModel):
    """Request payload to update an existing memory."""
    text: str = Field(..., min_length=1, max_length=1000)
    category: str | None = None


@router.get("", response_model=list[MemoryEntry])
async def list_memories(
    user: User = Depends(get_current_user),
):
    """
    List all stored long-term memories for the authenticated user.
    """
    manager = get_memory_manager()
    return manager.get_user_memories(user.id)


@router.post("", response_model=MemoryEntry)
async def create_memory(
    request: MemoryCreatePayload,
    auth_ctx: tuple[User, Session] = Depends(get_current_user_and_session),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """
    Manually add a long-term memory entry for the authenticated user.
    """
    user, session = auth_ctx
    await auth_service.touch_session(db, session)

    manager = get_memory_manager()
    return manager.put_memory(
        user_id=user.id,
        text=request.text,
        category=request.category,
    )


@router.put("/{memory_id}", response_model=MemoryEntry)
async def update_memory(
    memory_id: str,
    request: MemoryUpdateRequest,
    auth_ctx: tuple[User, Session] = Depends(get_current_user_and_session),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """
    Update an existing long-term memory for the authenticated user.
    """
    user, session = auth_ctx
    await auth_service.touch_session(db, session)

    manager = get_memory_manager()
    updated = manager.update_memory(
        user_id=user.id,
        memory_id=memory_id,
        text=request.text,
        category=request.category,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Memory '{memory_id}' not found.")
    return updated


@router.delete("/clear")
async def clear_all_memories(
    auth_ctx: tuple[User, Session] = Depends(get_current_user_and_session),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """
    Clear all stored long-term memories for the authenticated user.
    """
    user, session = auth_ctx
    await auth_service.touch_session(db, session)

    manager = get_memory_manager()
    count = manager.clear_all_memories(user.id)
    return {"success": True, "cleared_count": count}


@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: str,
    auth_ctx: tuple[User, Session] = Depends(get_current_user_and_session),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """
    Delete a specific long-term memory entry by ID for the authenticated user.
    """
    user, session = auth_ctx
    await auth_service.touch_session(db, session)

    manager = get_memory_manager()
    deleted = manager.delete_memory(user.id, memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Memory '{memory_id}' not found.")
    return {"success": True, "memory_id": memory_id}


@router.post("/cleanup")
async def cleanup_and_reconcile_memories(
    auth_ctx: tuple[User, Session] = Depends(get_current_user_and_session),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """
    Reconcile contradictory memories, eliminate duplicates, and enforce retention limits.
    """
    user, session = auth_ctx
    await auth_service.touch_session(db, session)

    remaining = await reconcile_user_memories(user.id)
    return {"success": True, "clean_memories_count": remaining}
