from pydantic import BaseModel, Field, UUID4
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class DocumentStatusEnum(str, Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class KnowledgeBaseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    chunk_size: Optional[int] = Field(512, ge=100, le=2048)
    chunk_overlap: Optional[int] = Field(50, ge=0, le=200)
    embedding_model: Optional[str] = "bge-large-zh"

class KnowledgeBaseUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    chunk_size: Optional[int] = Field(None, ge=100, le=2048)
    chunk_overlap: Optional[int] = Field(None, ge=0, le=200)
    embedding_model: Optional[str] = None

class KnowledgeBaseResponse(BaseModel):
    id: UUID4
    name: str
    description: Optional[str]
    chunk_size: int
    chunk_overlap: int
    embedding_model: str
    created_at: datetime
    document_count: int = 0

class KnowledgeBaseListResponse(BaseModel):
    items: List[KnowledgeBaseResponse]
    total: int
    page: int
    page_size: int

class DocumentResponse(BaseModel):
    id: UUID4
    kb_id: UUID4
    file_name: str
    file_path: str
    chunk_count: int
    status: DocumentStatusEnum
    error_message: Optional[str]
    created_at: datetime

class DocumentListResponse(BaseModel):
    items: List[DocumentResponse]
    total: int
    page: int
    page_size: int

class ChunkResponse(BaseModel):
    id: UUID4
    doc_id: UUID4
    chunk_index: int
    chunk_text: str
    metadata: Optional[Dict[str, Any]]
    created_at: datetime

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    kb_id: UUID4
    top_k: Optional[int] = Field(5, ge=1, le=20)

class SearchResult(BaseModel):
    chunk_id: UUID4
    doc_id: UUID4
    file_name: str
    chunk_index: int
    chunk_text: str
    similarity: float
    metadata: Optional[Dict[str, Any]]

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total_found: int
    took_ms: int

class ErrorResponse(BaseModel):
    code: int
    message: str
    detail: Optional[str]
