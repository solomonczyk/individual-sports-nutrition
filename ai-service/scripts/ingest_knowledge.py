import sys
import os
from typing import List, Dict, Any

# Add the parent directory to sys.path to allow importing from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.embedding_service import get_embedding_service
from app.utils.vector_store import get_vector_store
from app.utils.logger import logger

def ingest_initial_data():
    embedding_service = get_embedding_service()
    vector_store = get_vector_store()
    collection_name = "nutritional_knowledge"
    
    # Sample knowledge data
    knowledge_base = [
        {
            "id": "kb_001",
            "content": "Whey protein is rapidly absorbed and is ideal for post-workout recovery to stimulate muscle protein synthesis.",
            "metadata": {"category": "supplements", "type": "protein", "brand_neutral": True}
        },
        {
            "id": "kb_002",
            "content": "Creatine monohydrate is a highly researched supplement that helps increase strength, power, and muscle mass via ATP regeneration.",
            "metadata": {"category": "supplements", "type": "creatine", "brand_neutral": True}
        },
        {
            "id": "kb_003",
            "content": "People with lactose intolerance should avoid whey concentrate and opt for whey isolate or plant-based proteins (soy, pea, rice).",
            "metadata": {"category": "health", "target": "lactose_intolerance"}
        },
        {
            "id": "kb_004",
            "content": "Caffeine can improve endurance performance and focus, but should be avoided close to bedtime to prevent sleep disturbances.",
            "metadata": {"category": "supplements", "type": "pre_workout"}
        },
        {
            "id": "kb_005",
            "content": "Beta-alanine is known to cause a harmless tingling sensation (paresthesia) and helps buffer lactic acid during high-intensity exercise.",
            "metadata": {"category": "supplements", "type": "pre_workout"}
        },
        {
            "id": "kb_006",
            "content": "Omega-3 fatty acids from fish oil support cardiovascular health and can help reduce exercise-induced inflammation.",
            "metadata": {"category": "supplements", "type": "health"}
        },
        {
            "id": "kb_007",
            "content": "Casein protein is slowly digested and is often recommended before sleep to provide a steady supply of amino acids throughout the night.",
            "metadata": {"category": "supplements", "type": "protein"}
        },
        {
            "id": "kb_008",
            "content": "For muscle hypertrophy, a protein intake of 1.6 to 2.2 grams per kilogram of body weight is generally recommended.",
            "metadata": {"category": "nutrition", "goal": "mass"}
        },
        {
            "id": "kb_009",
            "content": "Electrolyte replacement (sodium, potassium, magnesium) is crucial durante prolonged endurance exercise, especially in hot conditions.",
            "metadata": {"category": "nutrition", "goal": "endurance"}
        },
        {
            "id": "kb_010",
            "content": "Ashwagandha has been shown in studies to help reduce cortisol levels and improve recovery from resistance training.",
            "metadata": {"category": "supplements", "type": "recovery"}
        },
        {
            "id": "kb_011",
            "content": "L-Glutamine may support intestinal health and immune system function, particularly during periods of extreme metabolic stress.",
            "metadata": {"category": "supplements", "type": "health"}
        },
        {
            "id": "kb_012",
            "content": "Vitamin D balance is essential for bone health and immune function; athletes are often deficient during winter months.",
            "metadata": {"category": "supplements", "type": "health"}
        },
        {
            "id": "kb_013",
            "content": "Pre-workout nutrition should ideally include complex carbohydrates 2-3 hours before exercise for sustained energy.",
            "metadata": {"category": "nutrition", "timing": "pre_workout"}
        },
        {
            "id": "kb_014",
            "content": "Citrulline Malate can enhance nitric oxide production, improving blood flow and reducing muscle soreness post-exercise.",
            "metadata": {"category": "supplements", "type": "pre_workout"}
        }
    ]
    
    logger.info(f"Starting ingestion of {len(knowledge_base)} items into {collection_name}")
    
    ids = [item["id"] for item in knowledge_base]
    documents = [item["content"] for item in knowledge_base]
    metadatas = [item["metadata"] for item in knowledge_base]
    
    # Generate embeddings
    embeddings = embedding_service.generate_embeddings(documents)
    
    # Add to vector store
    vector_store.add_documents(
        collection_name=collection_name,
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas,
        documents=documents
    )
    
    logger.info("Ingestion completed successfully")

if __name__ == "__main__":
    ingest_initial_data()
