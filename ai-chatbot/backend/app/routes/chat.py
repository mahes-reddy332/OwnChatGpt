"""Chat API routes with RAG, Agent, and streaming support."""

import logging
import time
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest, ChatResponse, ErrorResponse
from app.services.conversation import conversation_manager
from app.services.conversation_memory import get_conversation_memory
from app.services.file_service import link_uploads_to_conversation
from app.services.llm_service import llm_router
from app.services.settings_service import get_settings
from app.services.agent_service import get_agent_service
from app.services.rag_service import get_rag_service
from app.utils.logging import PerformanceMonitor
from app.config import Database

logger = logging.getLogger(__name__)
router = APIRouter()


async def generate_streaming_response(
    messages: list,
    model: str,
    temperature: float,
    max_tokens: int,
) -> AsyncGenerator[str, None]:
    """Stream response chunks from LLM in real-time."""
    try:
        for chunk in llm_router.stream_chat(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        ):
            if chunk:
                yield f"data: {chunk}\n\n"
    except Exception as e:
        logger.exception("Streaming error")
        yield f"data: ERROR: {str(e)}\n\n"


@router.post("/chat", response_model=ChatResponse, responses={500: {"model": ErrorResponse}})
@router.post("/api/chat", response_model=ChatResponse, responses={500: {"model": ErrorResponse}}, include_in_schema=False)
async def chat(request: ChatRequest):
    """Send a message and get an AI response with RAG, Agent, and streaming support."""
    try:
        start_time = time.time()
        
        app_settings = get_settings()
        available_models = llm_router.list_models()
        available_model_ids = {item["id"] for item in available_models}
        fallback_model = available_models[0]["id"] if available_models else app_settings["default_model"]
        requested_model = request.model or app_settings["default_model"]
        model = requested_model if requested_model in available_model_ids else fallback_model

        file_context = ""
        upload_ids: list[str] = []
        has_documents = False
        
        if request.files:
            upload_ids = [attached.upload_id for attached in request.files if attached.upload_id]
            file_context = "\n\n--- Uploaded Files ---\n" + "\n\n".join(
                f"File: {attached.name}\n{attached.content}" for attached in request.files
            )
            has_documents = len(upload_ids) > 0

        conv_id = conversation_manager.get_or_create(
            request.conversation_id,
            model=model,
            provider=llm_router.provider_name,
        )

        if upload_ids:
            link_uploads_to_conversation(upload_ids, conv_id)

        conversation_manager.add_message(
            conv_id,
            "user",
            request.message,
            files=[file.model_dump() for file in request.files] if request.files else [],
        )

        # Get conversation memory service
        db = Database.get_db()
        conv_memory = get_conversation_memory(db)
        
        # Add to conversation memory
        conv_memory.add_message(
            conv_id,
            "user",
            request.message,
            sources=upload_ids if has_documents else None,
        )

        conversation_messages = conversation_manager.get_messages(conv_id)
        
        # Format message history for agent
        history_for_agent = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in conversation_messages[:-1]  # Exclude current message
        ]

        logger.info(
            "Chat request prepared | conversation_id=%s model=%s files=%s context_chars=%s",
            conv_id,
            model,
            len(request.files) if request.files else 0,
            len(file_context),
        )

        # Use agent to handle the request
        agent_service = get_agent_service()
        agent_result = agent_service.run(
            query=request.message,
            conversation_history=history_for_agent,
            has_documents=has_documents,
        )

        response_text = agent_result["response"]
        
        # Add assistant response to conversation memory
        conv_memory.add_message(
            conv_id,
            "assistant",
            response_text,
            tool_used=agent_result.get("tool_used"),
            sources=agent_result.get("sources"),
        )

        # Log performance metrics
        elapsed = time.time() - start_time
        logger.info(
            "Chat completed | conversation_id=%s tool=%s duration=%.2fs tokens_used=%d",
            conv_id,
            agent_result.get("tool_used"),
            elapsed,
            agent_result.get("usage", {}).get("total_tokens", 0),
        )

        conversation_manager.add_message(conv_id, "assistant", response_text)

        return ChatResponse(
            response=response_text,
            conversation_id=conv_id,
            model=model,
            provider=llm_router.provider_name,
            usage={
                "tool_used": agent_result.get("tool_used"),
                "context_used": agent_result.get("context_used"),
                "sources": agent_result.get("sources", []),
            },
        )

    except RuntimeError as e:
        logger.exception("Chat provider error")
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.exception("Chat endpoint error")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream-chat")
@router.post("/api/stream-chat", include_in_schema=False)
async def stream_chat(request: ChatRequest):
    """Stream chat response in real-time using Server-Sent Events."""
    try:
        start_time = time.time()
        
        app_settings = get_settings()
        available_models = llm_router.list_models()
        fallback_model = available_models[0]["id"] if available_models else app_settings["default_model"]
        requested_model = request.model or app_settings["default_model"]
        model = requested_model

        conv_id = conversation_manager.get_or_create(
            request.conversation_id,
            model=model,
            provider=llm_router.provider_name,
        )

        conversation_manager.add_message(conv_id, "user", request.message)

        conversation_messages = conversation_manager.get_messages(conv_id)
        
        return StreamingResponse(
            generate_streaming_response(
                [{"role": msg["role"], "content": msg["content"]} for msg in conversation_messages],
                model,
                request.temperature or 0.7,
                request.max_tokens or 4096,
            ),
            media_type="text/event-stream",
        )

    except Exception as e:
        logger.exception("Stream chat error")
        raise HTTPException(status_code=500, detail=str(e))
