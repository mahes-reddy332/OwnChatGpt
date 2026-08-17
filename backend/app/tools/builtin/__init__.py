from app.tools.registry import get_tool_registry
from app.tools.builtin.code_runner import code_evaluator
from app.tools.builtin.shell_tool import command_runner
from app.tools.builtin.filesystem_tool import filesystem_inspector
from app.tools.builtin.web_tool import web_search, fetch_web_page
from app.tools.builtin.sql_tool import sql_inspector
from app.tools.builtin.docs_tool import tech_docs_search
from app.rag.pipeline import search_knowledge_base


def register_builtin_tools():
    """Register all built-in normal tools and RAG tools into the global registry."""
    registry = get_tool_registry()

    # 1. Developer & Coding Tools
    registry.register(code_evaluator)
    registry.register(command_runner)
    registry.register(filesystem_inspector)

    # 2. Web & Research Tools
    registry.register(web_search)
    registry.register(fetch_web_page)
    registry.register(tech_docs_search)

    # 3. Database & Knowledge Base
    registry.register(sql_inspector)
    registry.register(search_knowledge_base)


# Automatically initialize on import
register_builtin_tools()
