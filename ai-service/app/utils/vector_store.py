import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any, Optional
import os
from app.utils.logger import logger

class VectorStore:
    def __init__(self, persist_directory: str = "data/chroma_db"):
        """
        Initialize ChromaDB vector store.
        
        Args:
            persist_directory: Directory where ChromaDB data will be persisted.
        """
        self.persist_directory = persist_directory
        # Ensure the directory exists
        os.makedirs(persist_directory, exist_ok=True)
        
        try:
            self.client = chromadb.PersistentClient(path=persist_directory)
            logger.info(f"ChromaDB initialized at {persist_directory}")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {str(e)}")
            raise

    def get_or_create_collection(self, name: str):
        """Get an existing collection or create a new one."""
        try:
            return self.client.get_or_create_collection(name=name)
        except Exception as e:
            logger.error(f"Error getting/creating collection {name}: {str(e)}")
            raise

    def add_documents(
        self, 
        collection_name: str, 
        ids: List[str], 
        embeddings: List[List[float]], 
        metadatas: List[Dict[str, Any]], 
        documents: List[str]
    ):
        """Add documents with their embeddings to a collection."""
        try:
            collection = self.get_or_create_collection(collection_name)
            collection.add(
                ids=ids,
                embeddings=embeddings,
                metadatas=metadatas,
                documents=documents
            )
            logger.info(f"Added {len(ids)} documents to collection {collection_name}")
        except Exception as e:
            logger.error(f"Error adding documents to {collection_name}: {str(e)}")
            raise

    def query(
        self, 
        collection_name: str, 
        query_embeddings: List[List[float]], 
        n_results: int = 5,
        where: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Query the collection for similar documents."""
        try:
            collection = self.get_or_create_collection(collection_name)
            return collection.query(
                query_embeddings=query_embeddings,
                n_results=n_results,
                where=where
            )
        except Exception as e:
            logger.error(f"Error querying collection {collection_name}: {str(e)}")
            raise

_vector_store_instance = None

def get_vector_store() -> VectorStore:
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = VectorStore()
    return _vector_store_instance
