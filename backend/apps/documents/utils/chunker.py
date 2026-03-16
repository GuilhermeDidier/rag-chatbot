import logging
from django.conf import settings

logger = logging.getLogger(__name__)

CHUNK_SIZE = getattr(settings, "CHUNK_SIZE", 512)
CHUNK_OVERLAP = getattr(settings, "CHUNK_OVERLAP", 64)

# Separators tried in order (hierarchical)
SEPARATORS = ["\n\n", "\n", ". ", "! ", "? ", " ", ""]


def _split_text(text: str, separator: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    """Split text by separator and merge into chunks respecting size limits."""
    parts = text.split(separator)
    chunks = []
    current = ""

    for part in parts:
        part = part.strip()
        if not part:
            continue
        candidate = (current + separator + part).strip() if current else part
        if len(candidate) <= chunk_size:
            current = candidate
        else:
            if current:
                chunks.append(current)
            # Handle parts longer than chunk_size — force split
            if len(part) > chunk_size:
                for i in range(0, len(part), chunk_size - chunk_overlap):
                    sub = part[i : i + chunk_size]
                    if sub:
                        chunks.append(sub)
                current = ""
            else:
                current = part

    if current:
        chunks.append(current)

    return chunks


def chunk_pages(pages: list[dict]) -> list[dict]:
    """
    Given a list of page dicts [{page_number, text}], produce chunks.
    Returns: [{chunk_index, page_number, text}, ...]
    """
    all_chunks = []
    chunk_index = 0

    for page in pages:
        page_num = page["page_number"]
        text = page["text"]

        # Try separators in order
        chunks = [text]
        for sep in SEPARATORS:
            if all(len(c) <= CHUNK_SIZE for c in chunks):
                break
            new_chunks = []
            for c in chunks:
                if len(c) <= CHUNK_SIZE:
                    new_chunks.append(c)
                else:
                    new_chunks.extend(_split_text(c, sep, CHUNK_SIZE, CHUNK_OVERLAP))
            chunks = new_chunks

        # Add overlap between consecutive chunks on the same page
        overlapped = []
        for i, chunk in enumerate(chunks):
            if i > 0 and CHUNK_OVERLAP > 0:
                prev_words = chunks[i - 1].split()[-CHUNK_OVERLAP // 5 :]
                overlap_text = " ".join(prev_words)
                chunk = (overlap_text + " " + chunk).strip()
                if len(chunk) > CHUNK_SIZE:
                    chunk = chunk[-CHUNK_SIZE:]
            overlapped.append(chunk)

        for chunk_text in overlapped:
            if chunk_text.strip():
                all_chunks.append(
                    {
                        "chunk_index": chunk_index,
                        "page_number": page_num,
                        "text": chunk_text.strip(),
                    }
                )
                chunk_index += 1

    logger.info(f"Created {len(all_chunks)} chunks from {len(pages)} pages")
    return all_chunks
