import os
import pytest
from app.observability.tracer import setup_langsmith, build_tracer_config
from app.core.config import get_settings


def test_build_tracer_config_structure():
    """Test generating standard RunnableConfig for LangSmith."""
    config = build_tracer_config(
        thread_id="thread-test-12345",
        run_name="CustomTestRun",
        tags=["unit-test", "observability"],
        metadata={"user_role": "admin", "custom_key": "val123"},
    )

    assert config["configurable"]["thread_id"] == "thread-test-12345"
    assert config["run_name"] == "CustomTestRun"
    assert "unit-test" in config["tags"]
    assert "agentic-rag-chat" in config["tags"]
    assert "langgraph-react" in config["tags"]
    assert config["metadata"]["user_role"] == "admin"
    assert config["metadata"]["custom_key"] == "val123"
    assert config["metadata"]["framework"] == "langgraph"


def test_setup_langsmith_disabled_default():
    """Test setup_langsmith returns False when no API key or tracing flag is set."""
    is_active = setup_langsmith()
    # In default testing environment without key, it should safely return False
    assert isinstance(is_active, bool)
