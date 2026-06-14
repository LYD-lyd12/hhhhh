from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.services.kb_service import KBService
from app.middleware.auth import get_api_key
from app.schemas import (
    KnowledgeBaseCreate,
    KnowledgeBaseUpdate,
    KnowledgeBaseResponse,
    KnowledgeBaseListResponse,
    SearchRequest,
    SearchResponse,
    SearchResult,
    ErrorResponse
)

router = APIRouter(prefix="/api/v1/kbs", tags=["Knowledge Bases"], dependencies=[Depends(get_api_key)])

@router.post(
    "",
    response_model=KnowledgeBaseResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse},
        409: {"model": ErrorResponse}
    }
)
async def create_kb(
    kb: KnowledgeBaseCreate,
    db: Session = Depends(get_db)
):
    service = KBService(db)
    try:
        result = service.create_kb(
            name=kb.name,
            description=kb.description,
            chunk_size=kb.chunk_size,
            chunk_overlap=kb.chunk_overlap,
            embedding_model=kb.embedding_model
        )
        return {
            **result.__dict__,
            "document_count": 0
        }
    except ValueError as e:
        if "已存在" in str(e):
            raise HTTPException(status_code=409, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.get(
    "",
    response_model=KnowledgeBaseListResponse
)
async def list_kbs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    service = KBService(db)
    kbs, total = service.list_kbs(page, page_size)
    
    items = []
    for kb in kbs:
        doc_count = len(kb.documents)
        items.append({
            **kb.__dict__,
            "document_count": doc_count
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get(
    "/{kb_id}",
    response_model=KnowledgeBaseResponse,
    responses={
        404: {"model": ErrorResponse}
    }
)
async def get_kb(
    kb_id: UUID,
    db: Session = Depends(get_db)
):
    service = KBService(db)
    kb = service.get_kb(str(kb_id))
    
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    
    return {
        **kb.__dict__,
        "document_count": len(kb.documents)
    }

@router.put(
    "/{kb_id}",
    response_model=KnowledgeBaseResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse}
    }
)
async def update_kb(
    kb_id: UUID,
    kb_update: KnowledgeBaseUpdate,
    db: Session = Depends(get_db)
):
    service = KBService(db)
    try:
        result = service.update_kb(
            kb_id=str(kb_id),
            name=kb_update.name,
            description=kb_update.description,
            chunk_size=kb_update.chunk_size,
            chunk_overlap=kb_update.chunk_overlap,
            embedding_model=kb_update.embedding_model
        )
        return {
            **result.__dict__,
            "document_count": len(result.documents)
        }
    except ValueError as e:
        if "不存在" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        if "已存在" in str(e):
            raise HTTPException(status_code=409, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.delete(
    "/{kb_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"model": ErrorResponse}
    }
)
async def delete_kb(
    kb_id: UUID,
    db: Session = Depends(get_db)
):
    service = KBService(db)
    try:
        service.delete_kb(str(kb_id))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post(
    "/{kb_id}/search",
    response_model=SearchResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse}
    }
)
async def search_kb(
    kb_id: UUID,
    request: SearchRequest,
    db: Session = Depends(get_db)
):
    import time
    start_time = time.time()
    
    service = KBService(db)
    try:
        results = service.search(
            kb_id=str(kb_id),
            query=request.query,
            top_k=request.top_k
        )
        
        search_results = []
        for r in results:
            search_results.append(SearchResult(**r))
        
        took_ms = int((time.time() - start_time) * 1000)
        
        return {
            "query": request.query,
            "results": search_results,
            "total_found": len(search_results),
            "took_ms": took_ms
        }
    except ValueError as e:
        if "不存在" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.get(
    "/{kb_id}/stats",
    responses={
        404: {"model": ErrorResponse}
    }
)
async def get_kb_stats(
    kb_id: UUID,
    db: Session = Depends(get_db)
):
    service = KBService(db)
    try:
        return service.get_kb_stats(str(kb_id))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
