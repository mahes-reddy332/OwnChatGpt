from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
from app.rag.pipeline import get_ingestion_pipeline

router = APIRouter(prefix="/documents", tags=["documents"])


class DocumentInfoResponse(BaseModel):
    """Metadata response for an ingested document."""
    filename: str
    total_chunks: int
    total_pages: int
    uploaded_at: str
    size_bytes: int


@router.post("/upload", response_model=DocumentInfoResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload and ingest a document (.pdf, .txt, .md) into the RAG vector store.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")

    allowed_exts = {"pdf", "txt", "md", "markdown", "csv", "json", "py", "ts", "js"}
    ext = file.filename.lower().split(".")[-1] if "." in file.filename else ""
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Supported: {', '.join(allowed_exts)}",
        )

    try:
        content = await file.read()
        pipeline = get_ingestion_pipeline()
        info = pipeline.ingest_document(content, file.filename)
        return DocumentInfoResponse(**info)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to ingest document: {e}")


@router.get("", response_model=list[DocumentInfoResponse])
async def list_documents():
    """
    List all documents currently ingested in the knowledge base.
    """
    pipeline = get_ingestion_pipeline()
    docs = pipeline.list_documents()
    return [DocumentInfoResponse(**d) for d in docs]
