"""
tests/test_file_service.py

Unit tests for app.services.file_service.
Validates file extensions, MIME types, file size boundaries, and error conditions.
"""
import os
import io
import pytest
from fastapi import UploadFile, HTTPException

from app.services.file_service import (
    get_extension,
    validate_file,
    save_upload_file,
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
)
from app.core.config import settings


def test_get_extension():
    """Verify file extension extraction."""
    assert get_extension("medical_report.pdf") == ".pdf"
    assert get_extension("scan.PNG") == ".png"
    assert get_extension("photo.JPEG") == ".jpeg"
    assert get_extension("image.jpg") == ".jpg"
    assert get_extension("no_extension") == ""
    assert get_extension("") == ""
    assert get_extension(None) == ""


def test_validate_file_valid():
    """Verify valid files pass validation without exception."""
    pdf_file = UploadFile(
        filename="report.pdf",
        file=io.BytesIO(b"%PDF-1.4 test content"),
        headers={"content-type": "application/pdf"}
    )
    # Should not raise
    validate_file(pdf_file)

    png_file = UploadFile(
        filename="xray.png",
        file=io.BytesIO(b"\x89PNG\r\n\x1a\n test"),
        headers={"content-type": "image/png"}
    )
    validate_file(png_file)

    jpg_file = UploadFile(
        filename="skin.jpg",
        file=io.BytesIO(b"\xff\xd8\xff test"),
        headers={"content-type": "image/jpeg"}
    )
    validate_file(jpg_file)


def test_validate_file_none():
    """Validate None file is safely handled."""
    validate_file(None)


def test_validate_file_empty_filename():
    """Verify empty filename raises 400 Bad Request."""
    empty_name_file = UploadFile(
        filename="",
        file=io.BytesIO(b"content"),
        headers={"content-type": "application/pdf"}
    )
    with pytest.raises(HTTPException) as exc_info:
        validate_file(empty_name_file)
    assert exc_info.value.status_code == 400
    assert "Empty filename" in exc_info.value.detail


def test_validate_file_unsupported_extension():
    """Verify unsupported extension (e.g., .exe, .txt) raises 400."""
    bad_ext_file = UploadFile(
        filename="malicious.exe",
        file=io.BytesIO(b"MZ..."),
        headers={"content-type": "application/pdf"}
    )
    with pytest.raises(HTTPException) as exc_info:
        validate_file(bad_ext_file)
    assert exc_info.value.status_code == 400
    assert "Unsupported file extension" in exc_info.value.detail


def test_validate_file_unsupported_mime_type():
    """Verify unsupported MIME type raises 400."""
    bad_mime_file = UploadFile(
        filename="report.pdf",
        file=io.BytesIO(b"data"),
        headers={"content-type": "text/html"}
    )
    with pytest.raises(HTTPException) as exc_info:
        validate_file(bad_mime_file)
    assert exc_info.value.status_code == 400
    assert "Unsupported MIME type" in exc_info.value.detail


def test_save_upload_file_success(tmp_path):
    """Verify saving a valid file writes to disk and returns valid path."""
    content = b"%PDF-1.4 test document content"
    test_file = UploadFile(
        filename="lab_result.pdf",
        file=io.BytesIO(content),
        headers={"content-type": "application/pdf"}
    )

    saved_path = save_upload_file(test_file)
    try:
        assert os.path.exists(saved_path)
        with open(saved_path, "rb") as f:
            assert f.read() == content
    finally:
        if os.path.exists(saved_path):
            os.remove(saved_path)


def test_save_upload_file_empty_content_raises(tmp_path):
    """Verify saving an empty file (0 bytes) raises 400 and removes the file."""
    empty_file = UploadFile(
        filename="empty.pdf",
        file=io.BytesIO(b""),
        headers={"content-type": "application/pdf"}
    )

    with pytest.raises(HTTPException) as exc_info:
        save_upload_file(empty_file)
    assert exc_info.value.status_code == 400
    assert "empty" in exc_info.value.detail.lower()


def test_save_upload_file_exceeds_max_size(monkeypatch):
    """Verify file exceeding MAX_UPLOAD_SIZE_MB raises 400."""
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE_MB", 1)  # 1MB limit for test
    oversized_content = b"X" * (1 * 1024 * 1024 + 1024)  # > 1MB

    large_file = UploadFile(
        filename="large.pdf",
        file=io.BytesIO(oversized_content),
        headers={"content-type": "application/pdf"}
    )

    with pytest.raises(HTTPException) as exc_info:
        save_upload_file(large_file)
    assert exc_info.value.status_code == 400
    assert "exceeds maximum size" in exc_info.value.detail.lower()

