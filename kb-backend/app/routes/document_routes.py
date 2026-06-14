from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.services.kb_service import KBService
from app.middleware.auth import get_api_key
from app.schemas import (
    DocumentResponse,
    DocumentListResponse,
    ErrorResponse
)

router = APIRouter(prefix="/api/v1/documents", tags=["Documents"], dependencies=[Depends(get_api_key)])

@router.post(
    "/kb/{kb_id}",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse}
    }
)
async def upload_document(
    kb_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    service = KBService(db)
    try:
        result = service.add_document(kb_id=str(kb_id), file=file)
        return result
    except ValueError as e:
        if "不存在" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.get(
    "/kb/{kb_id}",
    response_model=DocumentListResponse,
    responses={
        404: {"model": ErrorResponse}
    }
)
async def list_documents(
    kb_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    service = KBService(db)
    
    kb = service.get_kb(str(kb_id))
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    docs, total = service.list_documents(str(kb_id), page, page_size)
    
    return {
        "items": docs,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get(
    "/{doc_id}",
    response_model=DocumentResponse,
    responses={
        404: {"model": ErrorResponse}
    }
)
async def get_document(
    doc_id: UUID,
    db: Session = Depends(get_db)
):
    service = KBService(db)
    doc = service.get_document(str(doc_id))
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return doc

@router.delete(
    "/{doc_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"model": ErrorResponse}
    }
)
async def delete_document(
    doc_id: UUID,
    db: Session = Depends(get_db)
):
    service = KBService(db)
    try:
        service.delete_document(str(doc_id))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
