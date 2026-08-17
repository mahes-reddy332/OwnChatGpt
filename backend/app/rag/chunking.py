from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_documents(
    documents: list[Document],
    chunk_size: int = 1000,
    chunk_overlap: int = 150,
) -> list[Document]:
    """
    Split documents into smaller chunks for embedding and retrieval.
    
    Args:
        documents (list[Document]): The source documents to split.
        chunk_size (int): Max characters per chunk.
        chunk_overlap (int): Overlap characters between chunks.
        
    Returns:
        list[Document]: Chunked documents with preserved metadata.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = splitter.split_documents(documents)
    
    # Assign index to metadata
    for idx, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = idx
        
    return chunks
