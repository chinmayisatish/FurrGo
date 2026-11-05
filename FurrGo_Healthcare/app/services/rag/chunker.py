"""
app/services/rag/chunker.py
"""
def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    """
    Splits text into chunks of `chunk_size` characters with an `overlap`.
    A more advanced chunker would use tokens, but character chunking is robust for plain text.
    """
    if not text or not text.strip():
        return []
        
    text = text.strip()
    text_length = len(text)
    
    if chunk_size <= 0:
        chunk_size = 1000
    if overlap < 0 or overlap >= chunk_size:
        overlap = max(0, min(200, chunk_size // 2))

    chunks = []
    start = 0
    
    while start < text_length:
        end = min(start + chunk_size, text_length)
        
        # Try to find a good boundary (like a newline or space) if we are not at the end
        if end < text_length:
            # Look back up to 100 chars for a newline
            newline_pos = text.rfind('\n', start, end)
            if newline_pos != -1 and (end - newline_pos) < 100:
                end = newline_pos + 1
            else:
                # Look back for a space
                space_pos = text.rfind(' ', start, end)
                if space_pos != -1 and (end - space_pos) < 50:
                    end = space_pos + 1
                    
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        if end >= text_length:
            break

        # Advance start, accounting for overlap
        new_start = end - overlap
        if new_start <= start:
            new_start = start + 1
        start = new_start
            
    return chunks
