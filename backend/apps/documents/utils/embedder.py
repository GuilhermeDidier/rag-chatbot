import logging
import os
import threading
from typing import Optional
from django.conf import settings
import chromadb
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Disable ChromaDB telemetry
os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")

_lock = threading.Lock()
_model: Optional[SentenceTransformer] = None
_chroma_client: Optional[chromadb.PersistentClient] = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                model_name = getattr(settings, "EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
                logger.info(f"Loading embedding model: {model_name}")
                _model = SentenceTransformer(model_name)
    return _model


def _get_chroma_client() -> chromadb.PersistentClient:
    global _chroma_client
    if _chroma_client is None:
        with _lock:
            if _chroma_client is None:
                path = getattr(settings, "VECTOR_STORE_PATH", "./chroma_db")
                logger.info(f"Initializing ChromaDB at: {path}")
                _chroma_client = chromadb.PersistentClient(path=path)
    return _chroma_client


def embed_and_store(collection_name: str, chunks: list[dict]) -> int:
    """
    Embed chunks and store in ChromaDB collection.
    Returns number of chunks stored.
    """
    model = _get_model()
    client = _get_chroma_client()

    # Delete collection if it already exists (re-process)
    try:
        client.delete_collection(collection_name)
    except Exception:
        pass

    collection = client.create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )

    texts = [c["text"] for c in chunks]
    logger.info(f"Embedding {len(texts)} chunks...")
    embeddings = model.encode(texts, show_progress_bar=False).tolist()

    ids = [f"chunk_{c['chunk_index']}" for c in chunks]
    metadatas = [
        {"page_number": c["page_number"], "chunk_index": c["chunk_index"]}
        for c in chunks
    ]

    # ChromaDB has a batch limit — insert in batches of 500
    batch_size = 500
    for i in range(0, len(chunks), batch_size):
        collection.add(
            ids=ids[i : i + batch_size],
            embeddings=embeddings[i : i + batch_size],
            documents=texts[i : i + batch_size],
            metadatas=metadatas[i : i + batch_size],
        )

    logger.info(f"Stored {len(chunks)} chunks in collection '{collection_name}'")
    return len(chunks)


def embed_query(query: str) -> list[float]:
    """Embed a single query string."""
    model = _get_model()
    return model.encode([query], show_progress_bar=False)[0].tolist()


def query_collection(collection_name: str, query_embedding: list[float], top_k: int = 5) -> list[dict]:
    """
    Query ChromaDB for similar chunks.
    Returns list of {text, page_number, chunk_index, distance}.
    """
    client = _get_chroma_client()
    try:
        collection = client.get_collection(collection_name)
    except Exception as e:
        logger.error(f"Collection '{collection_name}' not found: {e}")
        return []

    count = collection.count()
    if count == 0:
        return []

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, count),
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    if results and results["documents"]:
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            # ChromaDB cosine distance: 0=identical, 2=opposite
            # Convert to similarity score (0-1)
            similarity = 1 - (dist / 2)
            chunks.append(
                {
                    "text": doc,
                    "page_number": meta.get("page_number", 0),
                    "chunk_index": meta.get("chunk_index", 0),
                    "similarity": round(similarity, 4),
                }
            )

    return chunks


def delete_collection(collection_name: str) -> None:
    """Delete a ChromaDB collection."""
    client = _get_chroma_client()
    try:
        client.delete_collection(collection_name)
        logger.info(f"Deleted collection '{collection_name}'")
    except Exception as e:
        logger.warning(f"Could not delete collection '{collection_name}': {e}")
