"""Embedding service for generating and storing vector embeddings."""

import logging
from typing import List, Optional
import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating embeddings using Sentence Transformers."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """Initialize embedding service with a model."""
        try:
            logger.info(f"Loading embedding model: {model_name}")
            self.model = SentenceTransformer(model_name)
            self.dimension = self.model.get_sentence_embedding_dimension()
            logger.info(f"Embedding model loaded. Dimension: {self.dimension}")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise

    def embed_text(self, text: str) -> np.ndarray:
        """Generate embedding for a single text."""
        try:
            embedding = self.model.encode(text, convert_to_numpy=True)
            return embedding
        except Exception as e:
            logger.error(f"Failed to embed text: {e}")
            raise

    def embed_texts(self, texts: List[str]) -> List[np.ndarray]:
        """Generate embeddings for multiple texts."""
        try:
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Failed to embed texts: {e}")
            raise

    def similarity_search(
        self, query: str, vectors: List[np.ndarray], top_k: int = 5
    ) -> List[int]:
        """Find top-k most similar vectors to query."""
        try:
            query_embedding = self.embed_text(query)
            
            # Calculate cosine similarity
            similarities = []
            for vec in vectors:
                # Cosine similarity
                sim = np.dot(query_embedding, vec) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(vec) + 1e-8
                )
                similarities.append(sim)
            
            # Get top-k indices
            top_indices = np.argsort(similarities)[-top_k:][::-1]
            return top_indices.tolist()
        except Exception as e:
            logger.error(f"Failed to perform similarity search: {e}")
            raise


# Singleton instance
_embedding_service: Optional[EmbeddingService] = None


def get_embedding_service() -> EmbeddingService:
    """Get or create embedding service singleton."""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
