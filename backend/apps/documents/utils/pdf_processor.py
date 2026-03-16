import logging
import pdfplumber

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> list[dict]:
    """
    Extract text from each page of a PDF.
    Returns a list of dicts: [{page_number, text}, ...]
    """
    pages = []
    try:
        with pdfplumber.open(file_path) as pdf:
            for i, page in enumerate(pdf.pages, start=1):
                text = page.extract_text() or ""
                text = text.strip()
                if text:
                    pages.append({"page_number": i, "text": text})
                    logger.debug(f"Page {i}: {len(text)} chars extracted")
    except Exception as e:
        logger.error(f"Failed to extract PDF: {e}")
        raise RuntimeError(f"PDF extraction failed: {e}") from e

    logger.info(f"Extracted {len(pages)} pages with text")
    return pages
