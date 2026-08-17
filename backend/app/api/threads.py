from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.auth.models import User, Session
from app.auth.service import auth_service
from app.auth.dependencies import get_current_user, get_current_user_and_session, verify_csrf_token
from app.persistence.models import (
    ThreadCreateRequest,
    ThreadUpdateRequest,
    ThreadResponse,
    ThreadDetailResponse,
)
from app.persistence.thread_store import get_thread_store

router = APIRouter(prefix="/threads", tags=["threads"])


@router.get("", response_model=list[ThreadResponse])
async def list_threads(
    user: User = Depends(get_current_user),
):
    """List all conversation threads belonging to the authenticated user."""
    store = get_thread_store()
    threads = await store.list_threads(user_id=user.id)
    return [
        ThreadResponse(
            id=t.id,
            title=t.title,
            created_at=t.created_at.isoformat(),
            updated_at=t.updated_at.isoformat(),
            metadata=t.metadata.model_dump(),
        )
        for t in threads
    ]


@router.post("", response_model=ThreadResponse)
async def create_thread(
    request: ThreadCreateRequest = ThreadCreateRequest(),
    auth_ctx: tuple[User, Session] = Depends(get_current_user_and_session),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """Create a new conversation thread for the authenticated user."""
    user, session = auth_ctx
    await auth_service.touch_session(db, session)

    store = get_thread_store()
    thread = await store.create_thread(title=request.title, user_id=user.id)
    return ThreadResponse(
        id=thread.id,
        title=thread.title,
        created_at=thread.created_at.isoformat(),
        updated_at=thread.updated_at.isoformat(),
        metadata=thread.metadata.model_dump(),
    )


@router.get("/{thread_id}", response_model=ThreadDetailResponse)
async def get_thread(
    thread_id: str,
    user: User = Depends(get_current_user),
):
    """Retrieve a conversation thread along with its message history for the owner."""
    store = get_thread_store()
    thread = await store.get_thread(thread_id, user_id=user.id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found or access denied.")

    messages = await store.get_thread_messages(thread_id)
    return ThreadDetailResponse(
        id=thread.id,
        title=thread.title,
        created_at=thread.created_at.isoformat(),
        updated_at=thread.updated_at.isoformat(),
        messages=messages,
        metadata=thread.metadata.model_dump(),
    )


@router.patch("/{thread_id}", response_model=ThreadResponse)
async def update_thread(
    thread_id: str,
    request: ThreadUpdateRequest,
    auth_ctx: tuple[User, Session] = Depends(get_current_user_and_session),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """Update a conversation thread's title."""
    user, session = auth_ctx
    await auth_service.touch_session(db, session)

    store = get_thread_store()
    thread = await store.update_thread(thread_id, title=request.title, user_id=user.id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found or access denied.")

    return ThreadResponse(
        id=thread.id,
        title=thread.title,
        created_at=thread.created_at.isoformat(),
        updated_at=thread.updated_at.isoformat(),
        metadata=thread.metadata.model_dump(),
    )


@router.delete("/{thread_id}")
async def delete_thread(
    thread_id: str,
    auth_ctx: tuple[User, Session] = Depends(get_current_user_and_session),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """Delete a conversation thread."""
    user, session = auth_ctx
    await auth_service.touch_session(db, session)

    store = get_thread_store()
    deleted = await store.delete_thread(thread_id, user_id=user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Thread not found or access denied.")

    return {"success": True, "thread_id": thread_id}
