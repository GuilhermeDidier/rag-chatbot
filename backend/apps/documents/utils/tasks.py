import logging
from apps.documents.models import Document
from apps.documents.utils.pdf_processor import extract_text_from_pdf
from apps.documents.utils.chunker import chunk_pages
from apps.documents.utils.embedder import embed_and_store

logger = logging.getLogger(__name__)


def process_document(document_id: int) -> None:
    """
    Full pipeline: PDF → extract → chunk → embed → store in ChromaDB.
    Updates Document status along the way.
    """
    try:
        doc = Document.objects.get(id=document_id)
    except Document.DoesNotExist:
        logger.error(f"Document {document_id} not found")
        return

    doc.status = Document.Status.PROCESSING
    doc.save(update_fields=["status", "updated_at"])

    try:
        file_path = doc.file.path

        # Step 1: Extract text per page
        logger.info(f"[Doc {document_id}] Extracting text from PDF")
        pages = extract_text_from_pdf(file_path)

        if not pages:
            raise ValueError("No extractable text found in PDF")

        doc.page_count = len(pages)
        doc.save(update_fields=["page_count", "updated_at"])

        # Step 2: Chunk
        logger.info(f"[Doc {document_id}] Chunking {len(pages)} pages")
        chunks = chunk_pages(pages)

        if not chunks:
            raise ValueError("No chunks produced from PDF")

        # Step 3: Embed + store in ChromaDB
        collection_name = f"doc_{document_id}"
        logger.info(f"[Doc {document_id}] Embedding {len(chunks)} chunks")
        stored = embed_and_store(collection_name, chunks)

        # Step 4: Update document as completed
        doc.chunk_count = stored
        doc.collection_name = collection_name
        doc.status = Document.Status.COMPLETED
        doc.save(update_fields=["chunk_count", "collection_name", "status", "updated_at"])

        logger.info(f"[Doc {document_id}] Processing complete: {stored} chunks stored")

    except Exception as e:
        logger.error(f"[Doc {document_id}] Processing failed: {e}", exc_info=True)
        doc.status = Document.Status.FAILED
        doc.error_message = str(e)
        doc.save(update_fields=["status", "error_message", "updated_at"])
