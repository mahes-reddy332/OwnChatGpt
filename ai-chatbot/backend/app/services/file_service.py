"""File extraction and metadata persistence services."""

from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

from bson import ObjectId
from docx import Document
from pypdf import PdfReader

from app.database import get_db

TEXT_EXTENSIONS = {".txt", ".md", ".py", ".json", ".csv", ".log", ".yml", ".yaml"}
DOCUMENT_EXTENSIONS = {".doc", ".docx"}
ALLOWED_EXTENSIONS = {".pdf", *TEXT_EXTENSIONS, *DOCUMENT_EXTENSIONS}
MAX_EXTRACTED_CHARS = 50000


def _extract_pdf(data: bytes) -> str:
    reader = PdfReader(BytesIO(data))
    return "\n".join((page.extract_text() or "") for page in reader.pages).strip()


def _extract_docx(data: bytes) -> str:
    document = Document(BytesIO(data))
    return "\n".join(paragraph.text for paragraph in document.paragraphs if paragraph.text).strip()


def _extract_legacy_doc(data: bytes) -> str:
    for encoding in ("utf-8", "latin-1"):
        try:
            decoded = data.decode(encoding)
            printable_ratio = sum(char.isprintable() or char in "\n\r\t" for char in decoded) / max(len(decoded), 1)
            if printable_ratio > 0.85:
                return decoded.strip()
        except UnicodeDecodeError:
            continue
    raise ValueError("Legacy .doc files could not be parsed. Convert the file to .docx and try again.")


def extract_content(filename: str, content_type: str, data: bytes) -> dict:
    extension = Path(filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported file type. Use PDF, TXT, DOC, or DOCX files.")

    if extension == ".pdf":
        text = _extract_pdf(data)
    elif extension == ".docx":
        text = _extract_docx(data)
    elif extension == ".doc":
        text = _extract_legacy_doc(data)
    else:
        text = data.decode("utf-8", errors="ignore").strip()

    truncated = len(text) > MAX_EXTRACTED_CHARS
    content = f"{text[:MAX_EXTRACTED_CHARS]}\n...[truncated]" if truncated else text

    return {
        "name": filename,
        "type": content_type or "application/octet-stream",
        "content": content,
        "truncated": truncated,
        "extracted_chars": len(content),
    }


def store_upload_metadata(filename: str, content_type: str, size: int, extracted_chars: int, conversation_id: str | None = None) -> str:
    document = {
        "name": filename,
        "type": content_type or "application/octet-stream",
        "size": size,
        "extracted_chars": extracted_chars,
        "conversation_id": conversation_id,
        "created_at": datetime.now(timezone.utc),
    }
    result = get_db()["uploads"].insert_one(document)
    return str(result.inserted_id)


def link_uploads_to_conversation(upload_ids: list[str], conversation_id: str):
    object_ids = []
    for upload_id in upload_ids:
        if not upload_id:
            continue
        try:
            object_ids.append(ObjectId(upload_id))
        except Exception:
            continue

    if not object_ids:
        return

    get_db()["uploads"].update_many(
        {"_id": {"$in": object_ids}},
        {"$set": {"conversation_id": conversation_id, "linked_at": datetime.now(timezone.utc)}},
    )
