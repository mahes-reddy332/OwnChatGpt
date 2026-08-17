from datetime import datetime, timezone
from typing import Any
from langchain_core.tools import tool
from app.rag.loaders import load_document_from_bytes
from app.rag.chunking import chunk_documents
from app.rag.vectorstore import get_vectorstore_manager
from app.rag.retriever import retrieve_context


class IngestionPipeline:
    """Orchestrates document ingestion, indexing, and catalog management."""

    def __init__(self):
        self._document_catalog: dict[str, dict[str, Any]] = {}

    def ingest_document(self, file_bytes: bytes, filename: str) -> dict[str, Any]:
        """
        Ingest a document: parse -> chunk -> embed & store.
        
        Args:
            file_bytes (bytes): The raw file bytes.
            filename (str): The filename.
            
        Returns:
            dict: Summary of ingested document.
        """
        # 1. Load document
        raw_docs = load_document_from_bytes(file_bytes, filename)
        if not raw_docs:
            raise ValueError(f"No extractable text found in {filename}")

        # 2. Chunk document
        chunks = chunk_documents(raw_docs)

        # 3. Add to vector store
        manager = get_vectorstore_manager()
        manager.add_documents(chunks)

        # 4. Record in catalog
        info = {
            "filename": filename,
            "total_chunks": len(chunks),
            "total_pages": raw_docs[-1].metadata.get("total_pages", len(raw_docs)),
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "size_bytes": len(file_bytes),
        }
        self._document_catalog[filename] = info
        return info

    def list_documents(self) -> list[dict[str, Any]]:
        """Return catalog of all ingested documents."""
        return list(self._document_catalog.values())


# Singleton pipeline instance
_ingestion_pipeline = IngestionPipeline()


def get_ingestion_pipeline() -> IngestionPipeline:
    """Get the global IngestionPipeline singleton."""
    global _ingestion_pipeline
    return _ingestion_pipeline


# Context holder for latest retrieved sources during a run
_last_retrieved_sources: list[dict[str, Any]] = []


def get_last_retrieved_sources() -> list[dict[str, Any]]:
    """Retrieve and clear sources retrieved in the current run."""
    global _last_retrieved_sources
    sources = list(_last_retrieved_sources)
    _last_retrieved_sources = []
    return sources


@tool
def search_knowledge_base(query: str) -> str:
    """Search uploaded documents and knowledge base for relevant facts, context, citations, and specific answers."""
    global _last_retrieved_sources
    context, sources = retrieve_context(query)
    _last_retrieved_sources = sources

    if not context:
        return "No relevant information found in the uploaded knowledge base."

    return (
        f"Relevant Context from Knowledge Base:\n\n{context}\n\n"
        "Please use the above context to answer the user accurately. "
        "Cite the relevant source document name in your answer where appropriate."
    )
