from typing import List, Dict, Any, Optional
from app.services.embedding_service import EmbeddingService, get_embedding_service
from app.utils.vector_store import VectorStore, get_vector_store
from app.utils.logger import logger
from app.config import get_settings
from openai import OpenAI

class RagService:
    def __init__(
        self, 
        embedding_service: EmbeddingService, 
        vector_store: VectorStore
    ):
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        self.collection_name = "nutritional_knowledge"
        self.settings = get_settings()
        
        # Initialize OpenAI client if key is provided
        self.openai_client = None
        if self.settings.openai_api_key:
            try:
                self.openai_client = OpenAI(api_key=self.settings.openai_api_key)
                logger.info("OpenAI client initialized for RAG")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {str(e)}")

    async def get_relevant_context(self, query: str, n_results: int = 3) -> List[str]:
        """
        Retrieve relevant knowledge context for a given query.
        """
        try:
            query_embedding = self.embedding_service.generate_embeddings(query)
            results = self.vector_store.query(
                collection_name=self.collection_name,
                query_embeddings=[query_embedding],
                n_results=n_results
            )
            
            documents = results.get("documents", [[]])[0]
            return documents
        except Exception as e:
            logger.error(f"Error retrieving context for query '{query}': {str(e)}")
            return []

    async def generate_personalized_advice(
        self, 
        user_profile: Dict[str, Any], 
        query: str
    ) -> Dict[str, Any]:
        """
        Generate personalized advice based on user profile and retrieved knowledge using LLM.
        """
        context = await self.get_relevant_context(query)
        context_str = "\n".join([f"- {doc}" for doc in context])
        
        # Construct the internal prompt
        system_prompt = """
        You are a professional sports nutritionist and supplement expert. 
        Your goal is to provide evidence-based, personalized advice to users.
        Always consider the user's profile (goal, activity level, etc.) and the provided scientific context.
        Be concise, encouraging, and clear. 
        If you don't have enough information, advise the user to consult a healthcare professional.
        Important: Your response should be in the user's preferred language (default to Serbian/English if not specified).
        """
        
        user_context_prompt = f"""
        User Profile:
        - Goal: {user_profile.get('goal')}
        - Activity Level: {user_profile.get('activity_level')}
        - Age/Gender: {user_profile.get('age')}/{user_profile.get('gender')}
        
        Relevant Knowledge Context:
        {context_str if context else "No specific research context found for this query."}
        
        User Question: {query}
        
        Provide your personalized advice:
        """

        if self.openai_client:
            try:
                response = self.openai_client.chat.completions.create(
                    model=self.settings.openai_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_context_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=500
                )
                advice = response.choices[0].message.content
                status = "success"
            except Exception as e:
                logger.error(f"OpenAI API error: {str(e)}")
                advice = self._generate_placeholder_advice(context)
                status = "error_fallback"
        else:
            advice = self._generate_placeholder_advice(context)
            status = "no_llm_key_fallback"

        return {
            "advice": advice,
            "sources": context,
            "status": status
        }

    def _generate_placeholder_advice(self, context: List[str]) -> str:
        """Fallback advice generation when LLM is unavailable."""
        advice = "Currently, I'm analyzing your profile and the latest nutritional data. "
        if context:
            advice += f"Based on our knowledge base: {context[0][:200]}... "
            advice += "\n\n(Note: Connect OpenAI API key to get full personalized responses)"
        else:
            advice += "I'll be able to provide more detailed advice once the knowledge base is fully populated and the LLM is connected."
        return advice

def get_rag_service() -> RagService:
    return RagService(
        embedding_service=get_embedding_service(),
        vector_store=get_vector_store()
    )

def get_rag_service() -> RagService:
    return RagService(
        embedding_service=get_embedding_service(),
        vector_store=get_vector_store()
    )
