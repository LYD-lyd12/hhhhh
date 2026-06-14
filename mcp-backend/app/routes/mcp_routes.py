from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.database import get_db
from app.services.mcp_service import MCPService
from app.middleware.auth import get_api_key
from app.schemas import (
    MCPServerCreate,
    MCPServerUpdate,
    MCPServerResponse,
    MCPServerListResponse,
    TestConnectionResponse,
    ToolCallRequest,
    ToolCallResponse,
    ErrorResponse,
    ServerStatusEnum
)

router = APIRouter(prefix="/mcp/servers", tags=["MCP Servers"], dependencies=[Depends(get_api_key)])

@router.post(
    "",
    response_model=MCPServerResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse},
        409: {"model": ErrorResponse}
    }
)
async def create_server(
    server: MCPServerCreate,
    db: Session = Depends(get_db)
):
    service = MCPService(db)
    try:
        result = service.create_server(
            name=server.name,
            server_url=str(server.server_url),
            auth_type=server.auth_type.value,
            auth_config=server.auth_config.dict() if server.auth_config else None,
            description=server.description,
            timeout=server.timeout
        )
        return result
    except ValueError as e:
        if "已存在" in str(e):
            raise HTTPException(status_code=409, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.get(
    "",
    response_model=MCPServerListResponse
)
async def list_servers(
    status: Optional[ServerStatusEnum] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    service = MCPService(db)
    servers, total = service.list_servers(
        status=status.value if status else None,
        page=page,
        page_size=page_size
    )
    return {
        "items": servers,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get(
    "/{server_id}",
    response_model=MCPServerResponse,
    responses={
        404: {"model": ErrorResponse}
    }
)
async def get_server(
    server_id: UUID,
    db: Session = Depends(get_db)
):
    service = MCPService(db)
    server = service.get_server(str(server_id))
    if not server:
        raise HTTPException(status_code=404, detail="MCP Server not found")
    return server

@router.put(
    "/{server_id}",
    response_model=MCPServerResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse}
    }
)
async def update_server(
    server_id: UUID,
    server_update: MCPServerUpdate,
    db: Session = Depends(get_db)
):
    service = MCPService(db)
    try:
        update_data = {}
        if server_update.name:
            update_data["name"] = server_update.name
        if server_update.description is not None:
            update_data["description"] = server_update.description
        if server_update.server_url:
            update_data["server_url"] = str(server_update.server_url)
        if server_update.auth_type:
            update_data["auth_type"] = server_update.auth_type.value
        if server_update.auth_config is not None:
            update_data["auth_config"] = server_update.auth_config.dict() if server_update.auth_config else None
        if server_update.status:
            update_data["status"] = server_update.status.value
        if server_update.timeout:
            update_data["timeout"] = server_update.timeout

        result = service.update_server(str(server_id), **update_data)
        return result
    except ValueError as e:
        if "不存在" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        if "已存在" in str(e):
            raise HTTPException(status_code=409, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.delete(
    "/{server_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"model": ErrorResponse}
    }
)
async def delete_server(
    server_id: UUID,
    db: Session = Depends(get_db)
):
    service = MCPService(db)
    try:
        service.delete_server(str(server_id))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post(
    "/{server_id}/test",
    response_model=TestConnectionResponse,
    responses={
        404: {"model": ErrorResponse}
    }
)
async def test_connection(
    server_id: UUID,
    db: Session = Depends(get_db)
):
    service = MCPService(db)
    try:
        return await service.test_connection(str(server_id))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get(
    "/{server_id}/tools",
    responses={
        404: {"model": ErrorResponse}
    }
)
async def get_server_tools(
    server_id: UUID,
    db: Session = Depends(get_db)
):
    service = MCPService(db)
    try:
        tools = await service.fetch_tools(str(server_id))
        return {"tools": tools}
    except ValueError as e:
        if "不存在" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.post(
    "/{server_id}/tools/{tool_name}/call",
    response_model=ToolCallResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse}
    }
)
async def call_tool(
    server_id: UUID,
    tool_name: str,
    request: ToolCallRequest,
    db: Session = Depends(get_db)
):
    service = MCPService(db)
    try:
        return await service.call_tool(
            str(server_id),
            tool_name,
            request.parameters
        )
    except ValueError as e:
        if "不存在" in str(e):
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.get(
    "/{server_id}/health",
    responses={
        404: {"model": ErrorResponse}
    }
)
async def get_health_status(
    server_id: UUID,
    db: Session = Depends(get_db)
):
    service = MCPService(db)
    server = service.get_server(str(server_id))
    if not server:
        raise HTTPException(status_code=404, detail="MCP Server not found")
    
    return {
        "server_id": server.id,
        "name": server.name,
        "health_status": server.health_status,
        "last_health_check": server.last_health_check,
        "status": server.status
    }

@router.get("/all/tools")
async def get_all_tools(
    db: Session = Depends(get_db)
):
    service = MCPService(db)
    tools = service.get_all_tools()
    return {"tools": tools, "total": len(tools)}
