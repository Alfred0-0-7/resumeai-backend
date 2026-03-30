"""
PDF text extraction using pdfplumber (primary) with PyPDF2 fallback.
"""
import io
import pdfplumber
import PyPDF2


def extract_text(pdf_bytes: bytes) -> str:
    """
    Extract full text from a PDF byte string.
    Returns cleaned, whitespace-normalised text.
    Raises ValueError if no text can be extracted (e.g. scanned image PDF).
    """
    text = _extract_with_pdfplumber(pdf_bytes)
    if not text or len(text.strip()) < 50:
        text = _extract_with_pypdf2(pdf_bytes)

    if not text or len(text.strip()) < 50:
        raise ValueError(
            "Could not extract text from this PDF. "
            "It may be a scanned image. Please upload a text-based PDF."
        )

    return _clean(text)


def _extract_with_pdfplumber(pdf_bytes: bytes) -> str:
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            pages = []
            for page in pdf.pages:
                t = page.extract_text(x_tolerance=2, y_tolerance=2)
                if t:
                    pages.append(t)
            return "\n\n".join(pages)
    except Exception:
        return ""


def _extract_with_pypdf2(pdf_bytes: bytes) -> str:
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        pages = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                pages.append(t)
        return "\n\n".join(pages)
    except Exception:
        return ""


def _clean(text: str) -> str:
    import re
    # Collapse excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Strip leading/trailing whitespace per line
    lines = [line.strip() for line in text.splitlines()]
    return "\n".join(lines).strip()
