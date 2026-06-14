from pydantic import BaseModel, Field, UUID4, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class AuthTypeEnum(str, Enum):
    NONE = "none"
    BEARER = "bearer"
    API_KEY = "api_key"

class ServerStatusEnum(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class HealthStatusEnum(str, Enum):
    HEALTHY = "healthy"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"

class AuthConfig(BaseModel):
    api_key: Optional[str] = None
    bearer_token: Optional[str] = None
    header_name: Optional[str] = "Authorization"

class ToolSchema(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]
    return_type: Optional[str]

class MCPServerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    server_url: HttpUrl
    auth_type: AuthTypeEnum = AuthTypeEnum.NONE
    auth_config: Optional[AuthConfig] = None
    timeout: Optional[int] = Field(30000, ge=1000, le=120000)

class MCPServerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    server_url: Optional[HttpUrl] = None
    auth_type: Optional[AuthTypeEnum] = None
    auth_config: Optional[AuthConfig] = None
    status: Optional[ServerStatusEnum] = None
    timeout: Optional[int] = Field(None, ge=1000, le=120000)

class MCPServerResponse(BaseModel):
    id: UUID4
    name: str
    description: Optional[str]
    server_url: str
    auth_type: AuthTypeEnum
    tools: List[Dict[str, Any]]
    status: ServerStatusEnum
    api_version: str
    timeout: int
    health_status: HealthStatusEnum
    last_health_check: Optional[datetime]
    created_at: datetime
    updated_at: datetime

class MCPServerListResponse(BaseModel):
    items: List[MCPServerResponse]
    total: int
    page: int
    page_size: int

class TestConnectionResponse(BaseModel):
    success: bool
    message: str
    response_time_ms: Optional[int]
    api_version: Optional[str]

class ToolCallRequest(BaseModel):
    tool_name: str
    parameters: Dict[str, Any]

class ToolCallResponse(BaseModel):
    success: bool
    result: Optional[Any]
    error: Optional[str]
    response_time_ms: int

class ErrorResponse(BaseModel):
    code: int
    message: str
    detail: Optional[str]
