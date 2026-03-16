import logging
from django.conf import settings
from apps.documents.utils.embedder import embed_query, query_collection

logger = logging.getLogger(__name__)

SIMILARITY_THRESHOLD = getattr(settings, "SIMILARITY_THRESHOLD", 0.3)
TOP_K = getattr(settings, "TOP_K_CHUNKS", 5)


def retrieve_chunks(collection_name: str, query: str, top_k: int = TOP_K) -> list[dict]:
    """
    Embed query, search ChromaDB, filter by similarity threshold.
    Returns list of relevant chunks sorted by similarity desc.
    """
    if not collection_name:
        logger.warning("No collection_name provided for retrieval")
        return []

    query_embedding = embed_query(query)
    chunks = query_collection(collection_name, query_embedding, top_k=top_k)

    # Filter by threshold
    filtered = [c for c in chunks if c["similarity"] >= SIMILARITY_THRESHOLD]

    if not filtered:
        logger.info(f"No chunks above threshold {SIMILARITY_THRESHOLD} for query: {query[:50]}")
        # Return top result anyway if nothing passes threshold
        if chunks:
            filtered = chunks[:1]

    logger.debug(f"Retrieved {len(filtered)} chunks (threshold={SIMILARITY_THRESHOLD})")
    return filtered
