"""Vector store service for managing document embeddings and retrieval."""

import logging
import os
from typing import List, Optional, Dict, Any
from pathlib import Path
import chromadb
from chromadb.config import Settings

logger = logging.getLogger(__name__)


class VectorStore:
    """Vector database service using Chroma."""

    def __init__(self, persist_dir: str = "./data/vectors"):
        """Initialize vector store."""
        self.persist_dir = persist_dir
        Path(persist_dir).mkdir(parents=True, exist_ok=True)
        
        try:
            logger.info(f"Initializing Chroma with persist_dir: {persist_dir}")
            settings = Settings(
                chroma_db_impl="duckdb+parquet",
                persist_directory=persist_dir,
                anonymized_telemetry=False,
            )
            self.client = chromadb.Client(settings)
            
            # Get or create default collection
            self.collection = self.client.get_or_create_collection(
                name="documents",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("Vector store initialized")
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {e}")
            raise

    def add_documents(
        self,
        document_id: str,
        chunks: List[str],
        embeddings: List[List[float]],
        metadata: Optional[List[Dict[str, Any]]] = None,
    ) -> None:
        """Add document chunks with embeddings to vector store."""
        try:
            if metadata is None:
                metadata = [{"source": document_id} for _ in chunks]
            
            # Create IDs for chunks
            ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
            
            self.collection.add(
                ids=ids,
                documents=chunks,
                embeddings=embeddings,
                metadatas=metadata,
            )
            logger.info(f"Added {len(chunks)} chunks for document {document_id}")
        except Exception as e:
            logger.error(f"Failed to add documents to vector store: {e}")
            raise

    def search(
        self, query_embedding: List[float], top_k: int = 5
    ) -> Dict[str, Any]:
        """Search for similar documents."""
        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
            )
            return results
        except Exception as e:
            logger.error(f"Failed to search vector store: {e}")
            raise

    def delete_document(self, document_id: str) -> None:
        """Delete all chunks for a document."""
        try:
            # Get all IDs for this document
            results = self.collection.get(
                where={"source": {"$eq": document_id}}
            )
            if results["ids"]:
                self.collection.delete(ids=results["ids"])
                logger.info(f"Deleted {len(results['ids'])} chunks for document {document_id}")
        except Exception as e:
            logger.error(f"Failed to delete document from vector store: {e}")
            raise

    def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics."""
        try:
            count = self.collection.count()
            return {
                "total_chunks": count,
                "collection_name": self.collection.name,
            }
        except Exception as e:
            logger.error(f"Failed to get vector store stats: {e}")
            return {"error": str(e)}


# Singleton instance
_vector_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    """Get or create vector store singleton."""
    global _vector_store
    if _vector_store is None:
        persist_dir = os.getenv("VECTOR_DB_PATH", "./data/vectors")
        _vector_store = VectorStore(persist_dir=persist_dir)
    return _vector_store
