import io
import pytest
from fastapi.testclient import TestClient
from langchain_core.documents import Document
from app.rag.loaders import load_document_from_bytes
from app.rag.chunking import chunk_documents
from app.rag.retriever import retrieve_context
from app.rag.pipeline import search_knowledge_base, get_ingestion_pipeline


def test_load_text_document():
    """Test parsing a text document from bytes."""
    raw_text = "This is a test documentation file about Agentic AI architecture."
    docs = load_document_from_bytes(raw_text.encode("utf-8"), "test.txt")
    assert len(docs) == 1
    assert docs[0].metadata["filename"] == "test.txt"
    assert "Agentic AI" in docs[0].page_content


def test_chunk_documents():
    """Test splitting documents into chunks with overlap."""
    long_text = "Word " * 500  # ~2500 characters
    doc = Document(page_content=long_text, metadata={"filename": "long.txt"})
    chunks = chunk_documents([doc], chunk_size=500, chunk_overlap=50)
    assert len(chunks) > 1
    assert all("chunk_index" in c.metadata for c in chunks)


def test_upload_and_list_document_endpoints(client: TestClient):
    """Test POST /api/documents/upload and GET /api/documents."""
    sample_content = b"# Architecture Overview\nLangGraph orchestrates the ReAct loop."
    file_payload = {"file": ("architecture.md", io.BytesIO(sample_content), "text/markdown")}

    # 1. Upload
    upload_res = client.post("/api/documents/upload", files=file_payload)
    assert upload_res.status_code == 200
    data = upload_res.json()
    assert data["filename"] == "architecture.md"
    assert data["total_chunks"] >= 1

    # 2. List
    list_res = client.get("/api/documents")
    assert list_res.status_code == 200
    docs = list_res.json()
    assert any(d["filename"] == "architecture.md" for d in docs)


def test_search_knowledge_base_tool():
    """Test search_knowledge_base tool returns response string."""
    res = search_knowledge_base.invoke({"query": "LangGraph"})
    assert isinstance(res, str)
