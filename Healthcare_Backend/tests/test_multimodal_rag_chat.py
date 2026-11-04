"""
tests/test_multimodal_rag_chat.py

Integration and route tests for multimodal chat and RAG document ingestion in Healthcare_Backend.
Tests PDF and image ingestion (using Gemini vision), vector store indexing, and RAG chat routing.
"""
import pytest
import io
from unittest.mock import patch, MagicMock

from app.models.document import Document
from app.core.config import settings


@patch("app.api.routes.chat.get_vector_store")
@patch("app.api.routes.chat.get_embedding_service")
@patch("app.api.routes.chat.extract_text_from_pdf")
def test_upload_pdf_document_for_rag(mock_extract_pdf, mock_get_embed, mock_get_vs, client):
    """Test successful PDF document ingestion for RAG via POST /api/documents."""
    mock_extract_pdf.return_value = "Normal fasting blood sugar levels are generally between 70 and 99 mg/dL."

    mock_embed_svc = MagicMock()
    mock_embed_svc.generate_embeddings.return_value = [[0.1] * 384]
    mock_get_embed.return_value = mock_embed_svc

    mock_vs = MagicMock()
    mock_get_vs.return_value = mock_vs

    file_bytes = io.BytesIO(b"%PDF-1.4 sample PDF binary data")
    response = client.post(
        "/api/documents",
        files={"file": ("lab_report.pdf", file_bytes, "application/pdf")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "indexed"
    assert "document_id" in data
    assert data["original_filename"] == "lab_report.pdf"
    assert data["chunks_count"] >= 1
    mock_vs.add_chunks.assert_called_once()


@patch("app.api.routes.chat.get_vector_store")
@patch("app.api.routes.chat.get_embedding_service")
@patch("app.api.routes.chat.get_gemini_response")
def test_upload_image_document_for_rag(mock_gemini_resp, mock_get_embed, mock_get_vs, client):
    """Test image document ingestion using Gemini image understanding via POST /api/documents."""
    mock_gemini_resp.return_value = (
        "Extracted Image Text: Blood Pressure: 120/80 mmHg. Heart Rate: 72 bpm."
    )

    mock_embed_svc = MagicMock()
    mock_embed_svc.generate_embeddings.return_value = [[0.05] * 384]
    mock_get_embed.return_value = mock_embed_svc

    mock_vs = MagicMock()
    mock_get_vs.return_value = mock_vs

    file_bytes = io.BytesIO(b"\x89PNG\r\n\x1a\n png header data for test")
    response = client.post(
        "/api/documents",
        files={"file": ("vitals_chart.png", file_bytes, "image/png")}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "indexed"
    assert data["original_filename"] == "vitals_chart.png"
    assert data["chunks_count"] >= 1
    mock_gemini_resp.assert_called_once()
    mock_vs.add_chunks.assert_called_once()


def test_upload_document_unsupported_file_type(client):
    """Test uploading unsupported document extension returns 400."""
    file_bytes = io.BytesIO(b"binary data")
    response = client.post(
        "/api/documents",
        files={"file": ("script.exe", file_bytes, "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "supported" in response.json()["detail"].lower()


@patch("app.api.routes.chat.save_upload_file")
@patch("app.api.routes.chat.get_gemini_response")
def test_chat_with_uploaded_file_routes_to_gemini(mock_gemini, mock_save_file, client):
    """Test that uploading a file in /api/chat routes to Gemini multimodal and returns model=gemini."""
    mock_save_file.return_value = "dummy_saved_path.png"
    mock_gemini.return_value = "The image shows a rash that resembles contact dermatitis."

    file_bytes = io.BytesIO(b"\x89PNG dummy")
    response = client.post(
        "/api/chat",
        data={"message": "What is this skin condition?"},
        files={"file": ("rash.png", file_bytes, "image/png")}
    )

    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "contact dermatitis" in data["response"]
    assert data["file_processed"] is True
    assert data["file_type"] == "image"
    assert data["model"] == settings.GEMINI_MODEL
    assert "disclaimer" in data


def test_chat_with_nonexistent_document_id(client):
    """Test that querying with a non-existent document_id returns 404."""
    response = client.post(
        "/api/chat",
        data={"message": "What are my glucose levels?", "document_id": 99999}
    )
    assert response.status_code == 404
    assert "Document 99999 not found" in response.json()["detail"]


def test_chat_with_unindexed_document_id(client, db_session):
    """Test that querying with a document that failed or is still pending returns 400."""
    doc = Document(
        original_filename="pending.pdf",
        stored_filename="pending.pdf",
        file_type="application/pdf",
        file_size=1024,
        processing_status="pending"
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    response = client.post(
        "/api/chat",
        data={"message": "Summarize this document", "document_id": doc.id}
    )
    assert response.status_code == 400
    assert "not ready" in response.json()["detail"]
