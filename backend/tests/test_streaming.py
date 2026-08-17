import json
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient
from langchain_core.messages import AIMessageChunk
from app.streaming.events import (
    StreamStartEvent,
    TokenEvent,
    StreamEndEvent,
    ErrorEvent,
    format_sse,
)


def test_format_sse():
    """Test format_sse generates correct SSE string format."""
    event = "token"
    data = TokenEvent(content="Hello")
    output = format_sse(event, data)
    assert output == 'event: token\ndata: {"content":"Hello"}\n\n'

    start_event = format_sse("stream_start", {"thread_id": "123"})
    assert start_event == 'event: stream_start\ndata: {"thread_id": "123"}\n\n'


def test_chat_stream_endpoint_success(client: TestClient):
    """Test POST /api/chat/stream streams expected SSE events."""
    
    async def mock_astream_events(*args, **kwargs):
        yield {
            "event": "on_chat_model_stream",
            "data": {"chunk": AIMessageChunk(content="Hello")},
        }
        yield {
            "event": "on_chat_model_stream",
            "data": {"chunk": AIMessageChunk(content=" world!")},
        }

    with patch("app.api.chat.get_agent_graph") as mock_get_graph:
        mock_graph = AsyncMock()
        mock_graph.astream_events = mock_astream_events
        mock_get_graph.return_value = mock_graph

        response = client.post(
            "/api/chat/stream",
            json={"message": "Hi", "thread_id": "test-thread-1"},
        )
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        
        content = response.text
        assert "event: stream_start" in content
        assert "test-thread-1" in content
        assert "event: token" in content
        assert "Hello" in content
        assert "world!" in content
        assert "event: stream_end" in content
        assert "Hello world!" in content


def test_chat_stream_endpoint_error(client: TestClient):
    """Test error handling in streaming endpoint."""
    
    async def mock_astream_events_error(*args, **kwargs):
        raise RuntimeError("LLM Service Unavailable")
        yield  # make it a generator

    with patch("app.api.chat.get_agent_graph") as mock_get_graph:
        mock_graph = AsyncMock()
        mock_graph.astream_events = mock_astream_events_error
        mock_get_graph.return_value = mock_graph

        response = client.post(
            "/api/chat/stream",
            json={"message": "Hi", "thread_id": "err-thread"},
        )
        assert response.status_code == 200
        content = response.text
        assert "event: error" in content
        assert "LLM Service Unavailable" in content
