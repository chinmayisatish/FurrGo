"""
app/api/routes/chat.py

Health chat endpoint supporting text-only, RAG queries, and multimodal inputs.
"""
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import Optional, Union
import uuid
import os
import shutil
import tempfile

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm.nvidia_service import get_nvidia_service
from app.services.safety.health_safety import get_safety_validator
from app.services.rag.vector_store import get_vector_store
from app.services.rag.embeddings import get_embedding_service
from app.services.rag.document_loader import extract_text_from_pdf
from app.services.rag.text_cleaner import clean_text
from app.services.rag.chunker import chunk_text
from app.services.file_service import save_upload_file, get_extension
from app.services.gemini_service import get_gemini_response
from app.core.database import get_db
from app.core.config import settings
from app.models.document import Document
from app.services.langchain import create_text_only_chain, create_rag_chain

router = APIRouter(tags=["Chat"])

# Maximum message length
MAX_MESSAGE_LENGTH = 2000


async def get_chat_data(
    message: Optional[str] = Form(default=None),
    document_id: Optional[int] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
    request: Request = None
) -> dict:
    """Dependency to handle both JSON and form data"""
    data = {"message": message, "document_id": document_id, "file": file}
    
    # If message is None, try to parse JSON body
    if message is None and request:
        try:
            body = await request.body()
            if body:
                import json
                json_data = json.loads(body)
                data["message"] = json_data.get("message")
                data["document_id"] = json_data.get("document_id")
        except Exception:
            pass
    
    return data


@router.post(
    "/api/documents",
    response_model=dict,
    summary="Upload and index a document for RAG",
    description="Upload a PDF document or medical image, extract text, chunk, generate embeddings, and store in ChromaDB for RAG queries.",
)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> dict:
    """
    POST /api/documents

    RAG document ingestion:
    - PDF / Image → extract text (PDF parser or Gemini vision) → chunk → embeddings → ChromaDB
    - Returns unique document_id for subsequent RAG queries
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is required."
        )
    
    ext = os.path.splitext(file.filename)[1].lower()
    allowed_exts = {".pdf", ".png", ".jpg", ".jpeg"}
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and image files (PNG, JPG, JPEG) are supported for RAG document ingestion."
        )

    # Save uploaded file temporarily using direct stream copy
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name
    
    file_size = os.path.getsize(tmp_path)
    
    try:
        # Extract text: PDF via text parser, images via Gemini multimodal understanding
        if ext == ".pdf":
            raw_text = extract_text_from_pdf(tmp_path)
            source_type = "pdf"
            file_type = "application/pdf"
        else:
            mime_type = file.content_type or ("image/png" if ext == ".png" else "image/jpeg")
            raw_text = get_gemini_response(
                "Please accurately transcribe, extract, and describe all readable medical text, lab results, measurements, and clinical findings from this image.",
                file_path=tmp_path,
                mime_type=mime_type
            )
            source_type = "image"
            file_type = mime_type

        clean_text_content = clean_text(raw_text)
        chunks = chunk_text(clean_text_content, chunk_size=1000, overlap=200)
        
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No text chunks extracted from document."
            )

        # Create document record in database
        document = Document(
            original_filename=file.filename,
            stored_filename=file.filename,
            file_type=file_type,
            file_size=file_size,
            processing_status="processing"
        )
        db.add(document)
        db.commit()
        db.refresh(document)

        try:
            # Generate embeddings ONCE using Sentence Transformers
            embedding_service = get_embedding_service()
            embeddings = embedding_service.generate_embeddings(chunks)
            
            # Store in ChromaDB
            vector_store = get_vector_store()
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
            
            # Update document status
            document.processing_status = "indexed"
            db.commit()
            
            return {
                "document_id": document.id,
                "original_filename": document.original_filename,
                "chunks_count": len(chunks),
                "status": "indexed"
            }
            
        except Exception as e:
            document.processing_status = "failed"
            document.error_message = str(e)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to index document: {str(e)}"
            )
    finally:
        if os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


@router.post(
    "/api/chat",
    response_model=ChatResponse,
    summary="Chat with Health Assistant",
    description="Send a text message with optional document_id for RAG queries, or upload image/PDF for multimodal processing via Gemini.",
)
async def chat_endpoint(
    chat_data: dict = Depends(get_chat_data),
    db: Session = Depends(get_db)
) -> ChatResponse:
    """
    POST /api/chat

    Multimodal health chat:
    - Text only -> NVIDIA Nemotron (via LangChain TextOnlyChain)
    - Text + document_id -> RAG retrieval + Nemotron (via LangChain RAGChain)
    - Image/PDF file upload -> Gemini multimodal processing
    """
    message = chat_data.get("message")
    document_id = chat_data.get("document_id")
    file = chat_data.get("file")

    # Input validation
    message = message.strip() if message else ""

    if not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty."
        )

    if len(message) > MAX_MESSAGE_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Message exceeds maximum length of {MAX_MESSAGE_LENGTH} characters."
        )

    # Get services
    safety_validator = get_safety_validator()

    try:
        sources = []
        file_path = None

        has_file = (
            file is not None 
            and hasattr(file, 'filename') 
            and bool(file.filename and file.filename.strip())
        )

        if has_file:
            # Multimodal: Image / PDF upload processed with Gemini
            file_path = save_upload_file(file)
            try:
                raw_response = get_gemini_response(
                    message=message,
                    file_path=file_path,
                    mime_type=file.content_type
                )
                final_response = safety_validator.process_response(message, raw_response)
                ext = get_extension(file.filename)
                file_type_str = "pdf" if ext == ".pdf" else "image"
                return ChatResponse(
                    response=final_response,
                    disclaimer="This information is general health information and is not a diagnosis or a substitute for professional medical advice.",
                    model=settings.GEMINI_MODEL,
                    sources=[],
                    file_processed=True,
                    file_type=file_type_str
                )
            finally:
                if file_path and os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                    except Exception:
                        pass

        # Handle RAG query with document_id
        if document_id:
            # Verify document exists and is indexed
            document = db.query(Document).filter(Document.id == document_id).first()
            if not document:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Document {document_id} not found."
                )
            if document.processing_status != "indexed":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Document {document_id} is not ready for queries (status: {document.processing_status})."
                )

            # RAG flow: use LangChain RAGChain with Nemotron
            rag_chain = create_rag_chain(document_ids=[document_id], k=5)
            result = rag_chain.invoke({"message": message})
            
            final_response = result.get("response", "")
            
            # Retrieve source metadata
            query_embedding = get_embedding_service().generate_embedding(message)
            vector_store = get_vector_store()
            results = vector_store.similarity_search(
                query_embedding=query_embedding,
                k=5,
                document_ids=[document_id]
            )
            
            if results:
                for res in results:
                    metadata = res.get("metadata", {})
                    sources.append({
                        "document_id": metadata.get("document_id"),
                        "page_number": metadata.get("page_number", 1),
                        "chunk_index": metadata.get("chunk_index", 0)
                    })
        else:
            # Text only -> Nemotron via LangChain TextOnlyChain
            text_chain = create_text_only_chain()
            result = text_chain.invoke({"message": message})
            final_response = result.get("response", "")

        return ChatResponse(
            response=final_response,
            disclaimer="This information is general health information and is not a diagnosis or a substitute for professional medical advice.",
            model=settings.NVIDIA_MODEL,
            sources=sources
        )

    except HTTPException:
        raise
    except ValueError as e:
        # Missing API key
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured. Please contact administrator."
        )
    except RuntimeError as e:
        # API errors, timeouts, etc.
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e)
        )
    except Exception as e:
        # Unexpected errors - don't expose internals
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again later."
        )
