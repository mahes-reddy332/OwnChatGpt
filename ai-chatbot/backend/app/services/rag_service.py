"""RAG (Retrieval Augmented Generation) service for document-based QA."""

import logging
from typing import List, Optional, Dict, Any
from app.services.file_service import extract_content
from app.services.embedding_service import get_embedding_service
from app.services.vector_store import get_vector_store

logger = logging.getLogger(__name__)


class RAGService:
    """Service for Retrieval Augmented Generation pipeline."""

    def __init__(self):
        """Initialize RAG service."""
        self.embedding_service = get_embedding_service()
        self.vector_store = get_vector_store()
        self.chunk_size = 512
        self.chunk_overlap = 100

    def chunk_text(self, text: str, chunk_size: int = 512, overlap: int = 100) -> List[str]:
        """Split text into overlapping chunks."""
        chunks = []
        start = 0
        
        while start < len(text):
            end = min(start + chunk_size, len(text))
            chunk = text[start:end].strip()
            
            if chunk:
                chunks.append(chunk)
            
            start += chunk_size - overlap
        
        return chunks

    def process_document(
        self,
        document_id: str,
        filename: str,
        content_type: str,
        file_data: bytes,
    ) -> Dict[str, Any]:
        """Process a document and add to vector store."""
        try:
            logger.info(f"Processing document: {filename}")
            
            # Extract text from document
            extracted = extract_content(filename, content_type, file_data)
            text = extracted["content"]
            
            # Split into chunks
            chunks = self.chunk_text(text, self.chunk_size, self.chunk_overlap)
            logger.info(f"Document split into {len(chunks)} chunks")
            
            # Generate embeddings
            embeddings = self.embedding_service.embed_texts(chunks)
            
            # Store in vector database
            metadata = [
                {
                    "source": document_id,
                    "filename": filename,
                    "chunk_index": i,
                }
                for i in range(len(chunks))
            ]
            
            self.vector_store.add_documents(
                document_id=document_id,
                chunks=chunks,
                embeddings=embeddings,
                metadata=metadata,
            )
            
            logger.info(f"Document {document_id} processed and stored")
            
            return {
                "document_id": document_id,
                "filename": filename,
                "chunks": len(chunks),
                "status": "success",
            }
        except Exception as e:
            logger.error(f"Failed to process document: {e}")
            raise

    def retrieve_context(
        self,
        query: str,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant document chunks for a query."""
        try:
            # Generate query embedding
            query_embedding = self.embedding_service.embed_text(query)
            
            # Search vector store
            results = self.vector_store.search(
                query_embedding=query_embedding.tolist(),
                top_k=top_k,
            )
            
            # Format results
            context = []
            if results and results["documents"]:
                for doc, metadata, distance in zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0],
                ):
                    context.append({
                        "content": doc,
                        "source": metadata.get("source"),
                        "filename": metadata.get("filename"),
                        "relevance": 1 - distance,  # Convert distance to similarity
                    })
            
            logger.info(f"Retrieved {len(context)} relevant chunks for query")
            return context
        except Exception as e:
            logger.error(f"Failed to retrieve context: {e}")
            return []

    def build_prompt_with_context(
        self,
        query: str,
        context: List[Dict[str, Any]],
    ) -> str:
        """Build a prompt with retrieved context."""
        if not context:
            return query
        
        context_text = "\n\n".join([
            f"Source: {c.get('filename', 'Unknown')}\n{c['content']}"
            for c in context
        ])
        
        prompt = f"""Based on the following documents, answer the question:

Documents:
{context_text}

Question: {query}

Provide a clear and concise answer based on the documents. If the document doesn't contain relevant information, say so."""
        
        return prompt

    def delete_document(self, document_id: str) -> None:
        """Delete a document from the RAG system."""
        try:
            self.vector_store.delete_document(document_id)
            logger.info(f"Document {document_id} deleted from RAG system")
        except Exception as e:
            logger.error(f"Failed to delete document: {e}")
            raise


# Singleton instance
_rag_service: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    """Get or create RAG service singleton."""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
