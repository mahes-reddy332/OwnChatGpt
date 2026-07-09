"""File upload API routes with RAG integration."""

import logging
import time

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.schemas import UploadFileResponse
from app.services.file_service import extract_content, store_upload_metadata
from app.services.rag_service import get_rag_service
from app.utils.logging import PerformanceMonitor

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload-file", response_model=UploadFileResponse)
@router.post("/api/upload-file", response_model=UploadFileResponse, include_in_schema=False)
async def upload_file(file: UploadFile = File(...)):
    try:
        start_time = time.time()
        data = await file.read()
        logger.info("Upload received | name=%s type=%s size=%s", file.filename, file.content_type, len(data))
        if not data:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        if len(data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max size is 10MB")

        extracted = extract_content(file.filename or "upload.txt", file.content_type or "application/octet-stream", data)
        upload_id = store_upload_metadata(
            filename=extracted["name"],
            content_type=extracted["type"],
            size=len(data),
            extracted_chars=extracted["extracted_chars"],
        )
        logger.info(
            "Upload parsed | upload_id=%s name=%s chars=%s truncated=%s",
            upload_id,
            extracted["name"],
            extracted["extracted_chars"],
            extracted["truncated"],
        )

        # Process document for RAG
        try:
            rag_service = get_rag_service()
            rag_result = rag_service.process_document(
                document_id=upload_id,
                filename=extracted["name"],
                content_type=extracted["type"],
                file_data=data,
            )
            logger.info("Document added to RAG system | chunks=%s", rag_result.get("chunks"))
            
            # Log performance metrics
            elapsed = time.time() - start_time
            PerformanceMonitor.log_document_processing(
                filename=extracted["name"],
                chunks=rag_result.get("chunks", 0),
                duration=elapsed,
            )
        except Exception as e:
            logger.warning("Failed to process document for RAG: %s", str(e))
            # Don't fail the upload if RAG processing fails

        return UploadFileResponse(
            upload_id=upload_id,
            name=extracted["name"],
            type=extracted["type"],
            size=len(data),
            content=extracted["content"],
            truncated=extracted["truncated"],
        )
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Upload file endpoint failed")
        raise HTTPException(status_code=500, detail="Failed to process uploaded file") from exc
