from fastapi import APIRouter, HTTPException
from app.persistence.models import (
    ThreadCreateRequest,
    ThreadUpdateRequest,
    ThreadResponse,
    ThreadDetailResponse,
)
from app.persistence.thread_store import get_thread_store

router = APIRouter(prefix="/threads", tags=["threads"])


@router.get("", response_model=list[ThreadResponse])
async def list_threads():
    """List all conversation threads ordered by most recent."""
    store = get_thread_store()
    threads = await store.list_threads()
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
async def create_thread(request: ThreadCreateRequest = ThreadCreateRequest()):
    """Create a new conversation thread."""
    store = get_thread_store()
    thread = await store.create_thread(title=request.title)
    return ThreadResponse(
        id=thread.id,
        title=thread.title,
        created_at=thread.created_at.isoformat(),
        updated_at=thread.updated_at.isoformat(),
        metadata=thread.metadata.model_dump(),
    )


@router.get("/{thread_id}", response_model=ThreadDetailResponse)
async def get_thread(thread_id: str):
    """Retrieve a conversation thread along with its message history."""
    store = get_thread_store()
    thread = await store.get_thread(thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

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
async def update_thread(thread_id: str, request: ThreadUpdateRequest):
    """Update a conversation thread's title."""
    store = get_thread_store()
    thread = await store.update_thread(thread_id, title=request.title)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    return ThreadResponse(
        id=thread.id,
        title=thread.title,
        created_at=thread.created_at.isoformat(),
        updated_at=thread.updated_at.isoformat(),
        metadata=thread.metadata.model_dump(),
    )


@router.delete("/{thread_id}")
async def delete_thread(thread_id: str):
    """Delete a conversation thread."""
    store = get_thread_store()
    deleted = await store.delete_thread(thread_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Thread not found")

    return {"success": True, "thread_id": thread_id}
