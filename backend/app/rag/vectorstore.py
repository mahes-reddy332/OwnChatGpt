import os
from pathlib import Path
from langchain_core.documents import Document
from langchain_chroma import Chroma
from app.rag.embeddings import get_embedding_model


CHROMA_PERSIST_DIR = os.environ.get(
    "CHROMA_PERSIST_DIR",
    str(Path(__file__).resolve().parent.parent.parent / "data" / "chroma"),
)


class VectorStoreManager:
    """Manager for ChromaDB vector store operations."""

    def __init__(self, persist_directory: str = CHROMA_PERSIST_DIR):
        self.persist_directory = persist_directory
        os.makedirs(self.persist_directory, exist_ok=True)
        self._store: Chroma | None = None

    def get_store(self) -> Chroma:
        """Get or initialize the Chroma vectorstore instance."""
        if self._store is None:
            embedding_fn = get_embedding_model()
            self._store = Chroma(
                collection_name="knowledge_base",
                embedding_function=embedding_fn,
                persist_directory=self.persist_directory,
            )
        return self._store

    def add_documents(self, documents: list[Document]) -> list[str]:
        """Add documents to the vector store."""
        store = self.get_store()
        return store.add_documents(documents)

    def similarity_search(self, query: str, k: int = 4) -> list[Document]:
        """Perform similarity search for a query."""
        store = self.get_store()
        return store.similarity_search(query, k=k)

    def count(self) -> int:
        """Return the count of stored vectors."""
        try:
            store = self.get_store()
            return store._collection.count()
        except Exception:
            return 0


# Singleton vector store manager
_vectorstore_manager = VectorStoreManager()


def get_vectorstore_manager() -> VectorStoreManager:
    """Get the global VectorStoreManager singleton."""
    global _vectorstore_manager
    return _vectorstore_manager
