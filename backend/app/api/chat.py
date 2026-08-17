import uuid
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage
from langgraph.types import Command
from app.agent.graph import get_agent_graph
from app.core.logging import setup_logging
from app.core.config import get_settings
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
async def chat_endpoint(request: ChatRequest):
    """
    Process a user message through the LangGraph agent and return the full response.
    """
    thread_id = request.thread_id or str(uuid.uuid4())
    await get_thread_store().touch_thread(thread_id, auto_title_candidate=request.message)
    graph = get_agent_graph()
    
    try:
        user_msg = HumanMessage(content=request.message)
        input_state = {"messages": [user_msg]}
        config = build_tracer_config(
            thread_id=thread_id,
            run_name="ChatEndpoint-Sync",
            tags=["sync-api"],
            metadata={"user_message_length": len(request.message)},
        )
        config.setdefault("configurable", {})["disabled_tools"] = request.disabled_tools
        
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
async def chat_stream_endpoint(request: ChatRequest):
    """
    Stream the agent's response to a user message using Server-Sent Events (SSE).
    """
    thread_id = request.thread_id or str(uuid.uuid4())
    await get_thread_store().touch_thread(thread_id, auto_title_candidate=request.message)
    graph = get_agent_graph()
    
    user_msg = HumanMessage(content=request.message)
    input_state = {"messages": [user_msg]}
    config = build_tracer_config(
        thread_id=thread_id,
        run_name="ChatStreamEndpoint-SSE",
        tags=["stream-sse"],
        metadata={"user_message_length": len(request.message)},
    )
    config.setdefault("configurable", {})["disabled_tools"] = request.disabled_tools
    
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
async def chat_resume_endpoint(request: HitlResumeRequest):
    """
    Resume an interrupted LangGraph execution synchronously with the human's decision.
    """
    graph = get_agent_graph()
    config = build_tracer_config(
        thread_id=request.thread_id,
        run_name="ChatResume-Sync",
        tags=["hitl-resume"],
        metadata={"decision": request.decision},
    )

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
async def chat_resume_stream_endpoint(request: HitlResumeRequest):
    """
    Resume an interrupted LangGraph execution and stream the continuation using SSE.
    """
    graph = get_agent_graph()
    config = build_tracer_config(
        thread_id=request.thread_id,
        run_name="ChatResume-SSE",
        tags=["hitl-resume-sse"],
        metadata={"decision": request.decision},
    )

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
