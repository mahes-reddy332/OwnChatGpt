from typing import Any
from langchain_core.documents import Document
from app.rag.vectorstore import get_vectorstore_manager


def retrieve_context(
    query: str, k: int = 4
) -> tuple[str, list[dict[str, Any]]]:
    """
    Retrieve top-k relevant documents and format them with source attribution.
    
    Args:
        query (str): The search query.
        k (int): Number of chunks to retrieve.
        
    Returns:
        tuple[str, list[dict]]: (Formatted context string, List of source dictionaries).
    """
    manager = get_vectorstore_manager()
    docs: list[Document] = manager.similarity_search(query, k=k)

    if not docs:
        return "", []

    context_blocks: list[str] = []
    sources: list[dict[str, Any]] = []

    for i, doc in enumerate(docs):
        filename = doc.metadata.get("filename", "Unknown")
        page = doc.metadata.get("page", 1)
        snippet = doc.page_content.strip()

        # Format block for LLM prompt context
        block = f"[Source {i+1}: {filename} (Page {page})]\n{snippet}"
        context_blocks.append(block)

        # Record clean source dictionary for frontend citation
        sources.append({
            "filename": filename,
            "page": page,
            "snippet": snippet[:200] + ("..." if len(snippet) > 200 else ""),
        })

    formatted_context = "\n\n---\n\n".join(context_blocks)
    return formatted_context, sources
