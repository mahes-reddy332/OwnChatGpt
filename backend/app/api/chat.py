import uuid
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_core.messages import HumanMessage
from langgraph.types import Command
from app.agent.graph import get_agent_graph
from app.core.logging import setup_logging
from app.core.config import get_settings
from app.database.session import get_db
from app.auth.models import User, Session
from app.auth.service import auth_service
from app.auth.dependencies import get_current_user_and_session, verify_csrf_token
from app.streaming.adapter import stream_graph_events
from app.persistence.thread_store import get_thread_store
from app.observability.tracer import build_tracer_config
from app.hitl.policies import HitlResumeRequest
import app.hitl.tools  # registers sensitive tools

router = APIRouter()
settings = get_settings()
logger = setup_logging(settings.LOG_LEVEL)


class ChatRequest(BaseModel):
    """Request model for the chat endpoint."""
    message: str = Field(..., min_length=1, max_length=10000, description="The user's message")
    thread_id: str | None = Field(None, description="Optional thread ID to continue a conversation")
    disabled_tools: list[str] = Field(default_factory=list, description="List of tool names disabled by user")


class ChatResponse(BaseModel):
    """Response model for the chat endpoint."""
    message: str
    thread_id: str
    role: str = "assistant"


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    auth_ctx: tuple[User, Session] = Depends(get_current_user_and_session),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """
    Process a user message through the LangGraph agent and return the full response.
    """
    user, session = auth_ctx
    # Meaningful activity touch
    await auth_service.touch_session(db, session)

    thread_id = request.thread_id or str(uuid.uuid4())
    await get_thread_store().touch_thread(
        thread_id,
        auto_title_candidate=request.message,
        user_id=user.id,
    )
    graph = get_agent_graph()
    
    try:
        user_msg = HumanMessage(content=request.message)
        input_state = {"messages": [user_msg]}
        config = build_tracer_config(
            thread_id=thread_id,
            run_name="ChatEndpoint-Sync",
            tags=["sync-api"],
            metadata={"user_message_length": len(request.message), "user_id": user.id},
        )
        cfg_dict = config.setdefault("configurable", {})
        cfg_dict["disabled_tools"] = request.disabled_tools
        cfg_dict["user_id"] = user.id
        
        result = await graph.ainvoke(input_state, config=config)
        
        messages = result.get("messages", [])
        if not messages:
            raise HTTPException(status_code=500, detail="No response generated from the agent.")
            
        last_message = messages[-1]
        
        return ChatResponse(
            message=str(last_message.content),
            thread_id=thread_id,
            role="assistant"
        )
    except Exception as e:
        logger.error(f"Error processing chat request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
async def chat_stream_endpoint(
    request: ChatRequest,
    auth_ctx: tuple[User, Session] = Depends(get_current_user_and_session),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """
    Stream the agent's response to a user message using Server-Sent Events (SSE).
    """
    user, session = auth_ctx
    # Meaningful activity touch
    await auth_service.touch_session(db, session)

    thread_id = request.thread_id or str(uuid.uuid4())
    await get_thread_store().touch_thread(
        thread_id,
        auto_title_candidate=request.message,
        user_id=user.id,
    )
    graph = get_agent_graph()
    
    user_msg = HumanMessage(content=request.message)
    input_state = {"messages": [user_msg]}
    config = build_tracer_config(
        thread_id=thread_id,
        run_name="ChatStreamEndpoint-SSE",
        tags=["stream-sse"],
        metadata={"user_message_length": len(request.message), "user_id": user.id},
    )
    cfg_dict = config.setdefault("configurable", {})
    cfg_dict["disabled_tools"] = request.disabled_tools
    cfg_dict["user_id"] = user.id
    
    return StreamingResponse(
        stream_graph_events(graph, input_state, config, thread_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/chat/resume", response_model=ChatResponse)
async def chat_resume_endpoint(
    request: HitlResumeRequest,
    auth_ctx: tuple[User, Session] = Depends(get_current_user_and_session),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """
    Resume an interrupted LangGraph execution synchronously with the human's decision.
    """
    user, session = auth_ctx
    await auth_service.touch_session(db, session)

    graph = get_agent_graph()
    config = build_tracer_config(
        thread_id=request.thread_id,
        run_name="ChatResume-Sync",
        tags=["hitl-resume"],
        metadata={"decision": request.decision, "user_id": user.id},
    )
    cfg_dict = config.setdefault("configurable", {})
    cfg_dict["user_id"] = user.id

    try:
        command = Command(resume={"decision": request.decision, "modified_args": request.modified_args})
        result = await graph.ainvoke(command, config=config)

        messages = result.get("messages", [])
        if not messages:
            raise HTTPException(status_code=500, detail="No response generated after resume.")
            
        last_message = messages[-1]
        return ChatResponse(
            message=str(last_message.content),
            thread_id=request.thread_id,
            role="assistant",
        )
    except Exception as e:
        logger.error(f"Error resuming graph execution: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/resume/stream")
async def chat_resume_stream_endpoint(
    request: HitlResumeRequest,
    auth_ctx: tuple[User, Session] = Depends(get_current_user_and_session),
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_csrf_token),
):
    """
    Resume an interrupted LangGraph execution and stream the continuation using SSE.
    """
    user, session = auth_ctx
    await auth_service.touch_session(db, session)

    graph = get_agent_graph()
    config = build_tracer_config(
        thread_id=request.thread_id,
        run_name="ChatResume-SSE",
        tags=["hitl-resume-sse"],
        metadata={"decision": request.decision, "user_id": user.id},
    )
    cfg_dict = config.setdefault("configurable", {})
    cfg_dict["user_id"] = user.id

    command = Command(resume={"decision": request.decision, "modified_args": request.modified_args})
    
    return StreamingResponse(
        stream_graph_events(graph, command, config, request.thread_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
