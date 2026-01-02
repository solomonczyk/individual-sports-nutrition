from typing import List, Union
import numpy as np
from sentence_transformers import SentenceTransformer
from app.utils.logger import logger
from functools import lru_cache

class EmbeddingService:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the embedding service with a pre-trained model.
        
        Args:
            model_name: Name of the sentence-transformers model to use.
                        "all-MiniLM-L6-v2" is fast and relatively accurate.
        """
        try:
            logger.info(f"Loading embedding model: {model_name}")
            self.model = SentenceTransformer(model_name)
            logger.info("Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {str(e)}")
            raise

    def generate_embeddings(self, texts: Union[str, List[str]]) -> Union[List[float], List[List[float]]]:
        """
        Generate embeddings for the given text or list of texts.
        
        Args:
            texts: A single string or a list of strings to embed.
            
        Returns:
            A single embedding (list of floats) or a list of embeddings.
        """
        try:
            embeddings = self.model.encode(texts)
            if isinstance(texts, str):
                return embeddings.tolist()
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            raise

@lru_cache()
def get_embedding_service() -> EmbeddingService:
    return EmbeddingService()
