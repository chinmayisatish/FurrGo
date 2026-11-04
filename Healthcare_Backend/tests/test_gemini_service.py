"""
tests/test_gemini_service.py

Unit tests for app.services.gemini_service.
Tests PDF text extraction, Gemini multimodal API integration, image loading, and error handling.
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException

from app.services.gemini_service import (
    extract_text_from_pdf,
    get_gemini_response,
)
from app.core.config import settings


def test_get_gemini_response_missing_api_key(monkeypatch):
    """Verify missing GEMINI_API_KEY raises HTTPException 500."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    with pytest.raises(HTTPException) as exc_info:
        get_gemini_response("What does this report show?")
    assert exc_info.value.status_code == 500
    assert "Gemini API key is missing" in exc_info.value.detail


@patch("app.services.gemini_service.genai.Client")
def test_get_gemini_response_text_only_success(mock_client_cls, monkeypatch):
    """Verify Gemini response generation for text-only prompt."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key-valid")
    
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "This is a summary of general health principles."
    mock_client.models.generate_content.return_value = mock_response
    mock_client_cls.return_value = mock_client

    result = get_gemini_response("What is hypertension?")
    assert result == "This is a summary of general health principles."
    mock_client.models.generate_content.assert_called_once()


@patch("app.services.gemini_service.genai.Client")
@patch("app.services.gemini_service.extract_text_from_pdf")
def test_get_gemini_response_with_pdf(mock_extract_pdf, mock_client_cls, monkeypatch):
    """Verify Gemini multimodal prompt incorporates extracted PDF text."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key-valid")
    mock_extract_pdf.return_value = "Patient CBC: Hemoglobin 14.2 g/dL."
    
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "The report indicates normal hemoglobin levels."
    mock_client.models.generate_content.return_value = mock_response
    mock_client_cls.return_value = mock_client

    result = get_gemini_response(
        message="Explain this CBC report",
        file_path="dummy.pdf",
        mime_type="application/pdf"
    )
    assert "normal hemoglobin" in result
    mock_extract_pdf.assert_called_once_with("dummy.pdf")


@patch("app.services.gemini_service.genai.Client")
@patch("PIL.Image.open")
def test_get_gemini_response_with_image(mock_image_open, mock_client_cls, monkeypatch):
    """Verify Gemini multimodal prompt includes opened image."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key-valid")
    
    mock_img = MagicMock()
    mock_image_open.return_value = mock_img
    
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "The image displays an electrocardiogram with regular rhythm."
    mock_client.models.generate_content.return_value = mock_response
    mock_client_cls.return_value = mock_client

    result = get_gemini_response(
        message="What does this ECG show?",
        file_path="ecg.png",
        mime_type="image/png"
    )
    assert "electrocardiogram" in result


@patch("app.services.gemini_service.genai.Client")
def test_get_gemini_response_empty_text_raises(mock_client_cls, monkeypatch):
    """Verify empty response text raises 502 Bad Gateway."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key-valid")
    
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = ""  # Empty
    mock_client.models.generate_content.return_value = mock_response
    mock_client_cls.return_value = mock_client

    with pytest.raises(HTTPException) as exc_info:
        get_gemini_response("Hello")
    assert exc_info.value.status_code == 502
    assert "External AI provider error" in exc_info.value.detail


@patch("app.services.gemini_service.PdfReader")
def test_extract_text_from_pdf_success(mock_pdf_reader_cls):
    """Verify extracting text from PDF with multiple pages."""
    mock_reader = MagicMock()
    page1 = MagicMock()
    page1.extract_text.return_value = "Page 1 Medical Records"
    page2 = MagicMock()
    page2.extract_text.return_value = "Page 2 Lab Results"
    mock_reader.pages = [page1, page2]
    mock_pdf_reader_cls.return_value = mock_reader

    text = extract_text_from_pdf("sample.pdf")
    assert "Page 1 Medical Records" in text
    assert "Page 2 Lab Results" in text


@patch("app.services.gemini_service.PdfReader")
def test_extract_text_from_pdf_no_pages_raises(mock_pdf_reader_cls):
    """Verify PDF with 0 pages raises HTTPException 400."""
    mock_reader = MagicMock()
    mock_reader.pages = []
    mock_pdf_reader_cls.return_value = mock_reader

    with pytest.raises(HTTPException) as exc_info:
        extract_text_from_pdf("empty.pdf")
    assert exc_info.value.status_code == 400

