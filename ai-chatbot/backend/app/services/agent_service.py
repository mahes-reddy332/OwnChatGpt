"""AI Agent service for intelligent task routing and tool usage."""

import logging
import json
from typing import Optional, Dict, Any, List
from app.services.rag_service import get_rag_service
from app.services.llm_service import llm_router

logger = logging.getLogger(__name__)


class AgentService:
    """AI Agent that can use tools to answer questions."""

    AVAILABLE_TOOLS = {
        "search_documents": {
            "description": "Search uploaded documents for relevant information",
            "requires_context": True,
        },
        "answer_directly": {
            "description": "Answer question directly using general knowledge",
            "requires_context": False,
        },
    }

    def __init__(self):
        """Initialize agent service."""
        self.rag_service = get_rag_service()

    def decide_tool(self, query: str, has_documents: bool) -> str:
        """Decide which tool to use based on query and context."""
        # Simple heuristic for tool selection
        document_keywords = ["document", "file", "uploaded", "paper", "pdf", "article"]
        
        if has_documents and any(kw in query.lower() for kw in document_keywords):
            return "search_documents"
        
        return "answer_directly"

    def run(
        self,
        query: str,
        conversation_history: List[Dict[str, str]],
        has_documents: bool = False,
    ) -> Dict[str, Any]:
        """Run agent to answer user query."""
        try:
            logger.info(f"Agent running for query: {query[:100]}")
            
            # Decide which tool to use
            tool = self.decide_tool(query, has_documents)
            logger.info(f"Selected tool: {tool}")
            
            context_prompt = query
            retrieved_context = []
            
            # Use document search if available
            if tool == "search_documents" and has_documents:
                retrieved_context = self.rag_service.retrieve_context(query, top_k=5)
                context_prompt = self.rag_service.build_prompt_with_context(query, retrieved_context)
                logger.info(f"Retrieved {len(retrieved_context)} document chunks")
            
            # Build messages for LLM
            messages = [
                {"role": "system", "content": self._get_system_prompt()},
                *conversation_history,
                {"role": "user", "content": context_prompt},
            ]
            
            # Get response from LLM
            result = llm_router.chat(
                messages=messages,
                temperature=0.7,
                max_tokens=2048,
            )
            
            return {
                "response": result["response"],
                "tool_used": tool,
                "context_used": len(retrieved_context) > 0,
                "sources": [
                    {
                        "filename": c.get("filename"),
                        "relevance": c.get("relevance"),
                    }
                    for c in retrieved_context
                ],
            }
        except Exception as e:
            logger.error(f"Agent error: {e}")
            raise

    def _get_system_prompt(self) -> str:
        """Get system prompt for agent."""
        return """You are a helpful AI assistant. Your role is to:
1. Answer user questions accurately and concisely
2. Use provided document context when available to give informed answers
3. Clearly cite sources when using document information
4. Admit when you don't know something
5. Ask clarifying questions if needed

Always be professional, helpful, and honest."""


# Singleton instance
_agent_service: Optional[AgentService] = None


def get_agent_service() -> AgentService:
    """Get or create agent service singleton."""
    global _agent_service
    if _agent_service is None:
        _agent_service = AgentService()
    return _agent_service
