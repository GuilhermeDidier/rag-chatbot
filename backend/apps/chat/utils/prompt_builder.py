SYSTEM_PROMPT = """You are a helpful assistant that answers questions based on provided document excerpts.

Guidelines:
- Answer ONLY based on the provided context. Do not use external knowledge.
- If the context doesn't contain enough information to answer, say so clearly.
- When referencing information, mention the page number (e.g., "According to page 3...").
- Be concise and accurate.
- If asked something not covered by the document, politely say the document doesn't cover that topic."""


def build_messages(
    query: str,
    chunks: list[dict],
    conversation_history: list[dict] | None = None,
) -> list[dict]:
    """
    Build the messages list for the Groq API.

    Args:
        query: User's question
        chunks: Retrieved context chunks [{text, page_number, similarity}]
        conversation_history: Previous messages [{role, content}]

    Returns:
        List of messages for the chat completion API
    """
    # Build context block
    if chunks:
        context_parts = []
        for i, chunk in enumerate(chunks, start=1):
            page = chunk.get("page_number", "?")
            text = chunk.get("text", "")
            context_parts.append(f"[Excerpt {i} — Page {page}]\n{text}")
        context = "\n\n".join(context_parts)
    else:
        context = "No relevant excerpts found in the document."

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add conversation history (last 6 turns to keep context window manageable)
    if conversation_history:
        history = conversation_history[-6:]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})

    # User message with context + question
    user_content = f"""Document Context:
{context}

---

Question: {query}"""

    messages.append({"role": "user", "content": user_content})
    return messages
