import logging
from django.conf import settings
from groq import Groq

logger = logging.getLogger(__name__)

_client = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = getattr(settings, "GROQ_API_KEY", "")
        if not api_key:
            raise ValueError("GROQ_API_KEY is not configured")
        _client = Groq(api_key=api_key)
    return _client


def chat_completion(messages: list[dict]) -> dict:
    """
    Call Groq API and return {content, tokens_used}.
    """
    client = _get_client()
    model = getattr(settings, "GROQ_MODEL", "llama3-8b-8192")
    max_tokens = getattr(settings, "GROQ_MAX_TOKENS", 1024)
    temperature = getattr(settings, "GROQ_TEMPERATURE", 0.2)

    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        content = response.choices[0].message.content or ""
        tokens_used = response.usage.total_tokens if response.usage else 0

        logger.info(f"Groq response: {tokens_used} tokens used")
        return {"content": content, "tokens_used": tokens_used}

    except Exception as e:
        logger.error(f"Groq API error: {e}", exc_info=True)
        raise RuntimeError(f"LLM request failed: {e}") from e
