"""
app/services/rag/document_indexer.py

Document indexing service for RAG pipeline.
Handles document processing (PDF parsing / Gemini image understanding),
chunking, embedding via Sentence Transformers, and storage in ChromaDB.
"""

import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.config import settings
from app.services.rag.document_loader import extract_text_from_pdf
from app.services.rag.text_cleaner import clean_text
from app.services.rag.chunker import chunk_text
from app.services.rag.embeddings import get_embedding_service
from app.services.rag.vector_store import get_vector_store
from app.services.gemini_service import get_gemini_response
from app.core.database import SessionLocal
from app.models.document import Document
from app.services.rag.vector_store import VectorStoreService
from app.services.rag.embeddings import EmbeddingService


class DocumentIndexerService:
    """Service for indexing uploaded documents into the RAG pipeline."""

    def __init__(self, db: Session = None):
        self.db = db or SessionLocal()
        self.embedding_service = get_embedding_service()
        self.vector_store = get_vector_store()

    def index_document(self, document_id: int) -> bool:
        """
        Index a document by ID through the complete RAG pipeline.

        Steps:
        1. Load document from database
        2. Extract text from PDF (or image via Gemini vision)
        3. Clean text
        4. Chunk text
        5. Generate embeddings
        6. Store in ChromaDB with metadata
        7. Update document status

        Returns:
            True if successful, False otherwise
        """
        # Get document from database
        document = self.db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise ValueError(f"Document {document_id} not found")

        # Update status to processing
        document.processing_status = "processing"
        self.db.commit()

        try:
            # Step 1: Extract text (PDF parser or Gemini vision for images)
            file_path = os.path.join(settings.UPLOAD_DIR, "chat", document.stored_filename)
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")

            ext = os.path.splitext(document.stored_filename)[1].lower()
            if ext == ".pdf":
                raw_text = extract_text_from_pdf(file_path)
                source_type = "pdf"
            else:
                mime_type = document.file_type or ("image/png" if ext == ".png" else "image/jpeg")
                raw_text = get_gemini_response(
                    "Please accurately transcribe, extract, and describe all readable medical text, lab results, measurements, and clinical findings from this image.",
                    file_path=file_path,
                    mime_type=mime_type
                )
                source_type = "image"

            # Step 2: Clean text
            clean_text_content = clean_text(raw_text)

            # Step 3: Split into chunks
            chunks = chunk_text(clean_text_content, chunk_size=1000, overlap=200)

            if not chunks:
                document.processing_status = "failed"
                document.error_message = "No text chunks extracted from document"
                self.db.commit()
                return False

            # Step 4: Generate embeddings via Sentence Transformers
            embeddings = self.embedding_service.generate_embeddings(chunks)

            # Step 5: Store in ChromaDB
            vector_store = self.vector_store
            metadata = [{
                "document_id": document.id,
                "chunk_index": i,
                "source_type": source_type,
                "original_filename": document.original_filename
            } for i in range(len(chunks))]

            vector_store.add_chunks(
                document_id=document.id,
                chunks=chunks,
                embeddings=embeddings,
                metadata=metadata
            )

            # Step 6: Update document status
            document.processing_status = "indexed"
            self.db.commit()

            return True

        except Exception as e:
            document.processing_status = "failed"
            document.error_message = str(e)
            self.db.commit()
            return False
