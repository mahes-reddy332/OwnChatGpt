import io
from langchain_core.documents import Document
from pypdf import PdfReader


def load_document_from_bytes(file_bytes: bytes, filename: str) -> list[Document]:
    """
    Parse uploaded file bytes into a list of LangChain Document objects.
    
    Args:
        file_bytes (bytes): The raw file bytes.
        filename (str): The name of the file (including extension).
        
    Returns:
        list[Document]: Extracted documents with metadata.
    """
    extension = filename.lower().split(".")[-1] if "." in filename else ""
    documents: list[Document] = []

    if extension == "pdf":
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    documents.append(
                        Document(
                            page_content=text,
                            metadata={
                                "source": filename,
                                "filename": filename,
                                "page": page_num + 1,
                                "total_pages": len(reader.pages),
                            },
                        )
                    )
        except Exception as e:
            raise ValueError(f"Failed to parse PDF {filename}: {e}")

    else:
        # Text, Markdown, CSV, or code files
        try:
            text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = file_bytes.decode("latin-1", errors="replace")

        if text.strip():
            documents.append(
                Document(
                    page_content=text,
                    metadata={
                        "source": filename,
                        "filename": filename,
                        "page": 1,
                    },
                )
            )

    return documents
