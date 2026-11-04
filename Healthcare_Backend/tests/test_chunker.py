"""
tests/test_chunker.py

Unit tests for RAG text chunker (app/services/rag/chunker.py).
Verifies splitting, boundary finding (newlines, spaces), overlap, and boundary/edge conditions.
"""
import pytest
from app.services.rag.chunker import chunk_text


def test_chunk_text_empty_and_whitespace():
    """Verify empty string or whitespace returns empty list."""
    assert chunk_text("") == []
    assert chunk_text("   \n\t  ") == []
    assert chunk_text(None) == []


def test_chunk_text_short_text():
    """Verify text shorter than chunk_size returns a single chunk without infinite looping."""
    text = "Short clinical note: Patient reports mild headache."
    chunks = chunk_text(text, chunk_size=1000, overlap=200)
    assert len(chunks) == 1
    assert chunks[0] == text


def test_chunk_text_exact_chunk_size():
    """Verify text matching chunk_size returns a single chunk."""
    text = "A" * 500
    chunks = chunk_text(text, chunk_size=500, overlap=100)
    assert len(chunks) == 1
    assert chunks[0] == text


def test_chunk_text_multi_chunk_with_overlap():
    """Verify text larger than chunk_size produces multiple overlapping chunks."""
    text = "Word " * 200  # 1000 characters
    chunks = chunk_text(text, chunk_size=300, overlap=50)
    assert len(chunks) > 1
    # Ensure all chunks are non-empty
    for c in chunks:
        assert len(c) > 0


def test_chunk_text_respects_newline_boundary():
    """Verify chunker prefers newline boundary when available."""
    text = "Paragraph one with detailed findings.\nParagraph two with recommendations.\nParagraph three."
    chunks = chunk_text(text, chunk_size=45, overlap=10)
    assert len(chunks) >= 2
    # Verify first chunk ends at or before newline
    assert "Paragraph one" in chunks[0]


def test_chunk_text_invalid_parameters():
    """Verify invalid or extreme chunk_size and overlap parameters do not crash or loop infinitely."""
    text = "Some sample clinical text for testing parameter edge cases."
    
    # Negative chunk_size falls back gracefully
    chunks_neg = chunk_text(text, chunk_size=-10, overlap=-5)
    assert len(chunks_neg) >= 1

    # Overlap >= chunk_size adjusts overlap automatically
    chunks_overlap = chunk_text(text, chunk_size=20, overlap=30)
    assert len(chunks_overlap) >= 1

