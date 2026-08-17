import logging
import time
from typing import Any, AsyncGenerator
from langgraph.graph.state import CompiledStateGraph
from app.streaming.events import (
    StreamStartEvent,
    TokenEvent,
    ToolCallStartEvent,
    ToolCallEndEvent,
    RagSourcesEvent,
    RagSourceItem,
    StreamEndEvent,
    HitlInterruptEvent,
    ErrorEvent,
    format_sse,
)
from app.rag.pipeline import get_last_retrieved_sources
from app.tools.executor import classify_tool
from app.tools.registry import get_tool_registry

logger = logging.getLogger("app.streaming")


async def stream_graph_events(
    graph: CompiledStateGraph,
    input_state: Any,
    config: dict[str, Any],
    thread_id: str,
) -> AsyncGenerator[str, None]:
    """
    Execute the LangGraph agent (or resume command) and transform events into SSE formatted strings.
    
    Args:
        graph (CompiledStateGraph): The compiled LangGraph instance.
        input_state (Any): The initial graph state or Command(resume=...).
        config (dict): The invocation config containing thread_id.
        thread_id (str): The conversation thread ID.
        
    Yields:
        str: Server-Sent Event formatted strings.
    """
    accumulated_content = ""
    retrieved_sources: list[dict[str, Any]] = []
    tool_start_times: dict[str, float] = {}
    tool_types: dict[str, str] = {}
    
    # 1. Send stream_start event
    yield format_sse("stream_start", StreamStartEvent(thread_id=thread_id))
    
    registry = get_tool_registry()

    try:
        # 2. Iterate over LangGraph v2 events
        async for event in graph.astream_events(input_state, config=config, version="v2"):
            event_type = event.get("event")
            
            # Catch token chunks from the chat model ONLY when produced by the chat_node
            if event_type == "on_chat_model_stream":
                metadata = event.get("metadata", {})
                node_name = metadata.get("langgraph_node", "")
                
                # Ignore streaming tokens from background nodes (remember, summarize, etc.)
                if node_name and node_name not in ("chat", "chat_node"):
                    continue

                chunk = event.get("data", {}).get("chunk")
                if chunk is not None:
                    content = getattr(chunk, "content", "")
                    
                    if isinstance(content, str) and content:
                        accumulated_content += content
                        yield format_sse("token", TokenEvent(content=content))
                    elif isinstance(content, list):
                        for part in content:
                            if isinstance(part, str) and part:
                                accumulated_content += part
                                yield format_sse("token", TokenEvent(content=part))
                            elif isinstance(part, dict) and part.get("type") == "text":
                                text = part.get("text", "")
                                if text:
                                    accumulated_content += text
                                    yield format_sse("token", TokenEvent(content=text))

            # Catch tool start events
            elif event_type == "on_tool_start":
                tool_name = event.get("name", "tool")
                tool_input = event.get("data", {}).get("input", {})
                run_id = event.get("run_id", "")
                
                tool_obj = registry.get_tool(tool_name)
                t_type = classify_tool(tool_name, tool_obj)
                
                tool_start_times[run_id] = time.perf_counter()
                tool_types[run_id] = t_type

                yield format_sse(
                    "tool_call_start",
                    ToolCallStartEvent(
                        tool_id=run_id,
                        tool_name=tool_name,
                        tool_type=t_type,
                        args=tool_input if isinstance(tool_input, dict) else {"input": str(tool_input)},
                    ),
                )

            # Catch tool end events
            elif event_type == "on_tool_end":
                run_id = event.get("run_id", "")
                tool_name = event.get("name", "tool")
                output = str(event.get("data", {}).get("output", ""))
                
                start_t = tool_start_times.get(run_id, 0.0)
                duration_ms = round((time.perf_counter() - start_t) * 1000, 2) if start_t > 0 else 0.0
                t_type = tool_types.get(run_id, "builtin")

                yield format_sse(
                    "tool_call_end",
                    ToolCallEndEvent(
                        tool_id=run_id,
                        tool_name=tool_name,
                        tool_type=t_type,
                        execution_time_ms=duration_ms,
                        result=output[:500],
                    ),
                )

        # 3. Check for HITL interrupts in the graph state
        try:
            state_snapshot = graph.get_state(config)
            if state_snapshot and state_snapshot.tasks:
                for task in state_snapshot.tasks:
                    if hasattr(task, "interrupts") and task.interrupts:
                        for intr in task.interrupts:
                            val = intr.value
                            if isinstance(val, dict):
                                yield format_sse(
                                    "hitl_interrupt",
                                    HitlInterruptEvent(
                                        interrupt_id=val.get("interrupt_id", "default"),
                                        tool_name=val.get("tool_name", "sensitive_tool"),
                                        action=val.get("action", "Action Approval Required"),
                                        description=val.get("description", ""),
                                        args=val.get("args", {}),
                                        thread_id=thread_id,
                                    ),
                                )
                                return
        except Exception as e:
            logger.debug(f"State inspection for interrupts notice: {e}")

        # Check if RAG sources were retrieved during this run
        sources_data = get_last_retrieved_sources()
        if sources_data:
            retrieved_sources = sources_data
            source_items = [
                RagSourceItem(
                    filename=s.get("filename", "Unknown"),
                    page=s.get("page", 1),
                    snippet=s.get("snippet", ""),
                )
                for s in retrieved_sources
            ]
            yield format_sse("rag_sources", RagSourcesEvent(sources=source_items))

        # 4. Send stream_end event with full content and attached sources
        end_sources = [
            RagSourceItem(
                filename=s.get("filename", "Unknown"),
                page=s.get("page", 1),
                snippet=s.get("snippet", ""),
            )
            for s in retrieved_sources
        ]
        yield format_sse(
            "stream_end",
            StreamEndEvent(
                thread_id=thread_id,
                content=accumulated_content,
                sources=end_sources,
            ),
        )

    except Exception as e:
        logger.error(f"Error during graph event streaming: {e}", exc_info=True)
        yield format_sse(
            "error",
            ErrorEvent(detail=str(e), code="STREAM_EXECUTION_ERROR"),
        )
