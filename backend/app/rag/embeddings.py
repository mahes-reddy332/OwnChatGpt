from functools import lru_cache
from langchain_core.embeddings import Embeddings
from langchain_openai import OpenAIEmbeddings
from langchain_core.embeddings.fake import FakeEmbeddings
from app.core.config import get_settings


@lru_cache()
def get_embedding_model() -> Embeddings:
    """
    Get or create the cached embeddings model instance.
    Uses OpenAIEmbeddings if an API key is configured; otherwise falls back to FakeEmbeddings for testing/offline mode.
    
    Returns:
        Embeddings: LangChain Embeddings instance.
    """
    settings = get_settings()
    if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.startswith("sk-"):
        return OpenAIEmbeddings(
            model=settings.OPENAI_EMBEDDING_MODEL,
            api_key=settings.OPENAI_API_KEY,
        )
    # Testing / Offline fallback
    return FakeEmbeddings(size=1536)
