"""
SKILL管理路由
包含技能的CRUD操作和代码包上传
"""
import os
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.services import SkillService, SkillCallLogService
from app.schemas import (
    SkillCreate,
    SkillUpdate,
    SkillStatusUpdate,
    SkillResponse,
    SkillListResponse,
    SkillCallRequest,
    SkillCallResponse,
    SkillCallLogResponse,
    SkillCallLogListResponse,
    ErrorResponse
)
from app.main import settings

# 创建路由实例
router = APIRouter(prefix="/api/skills", tags=["Skills"])

# API Key认证
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

def get_api_key(api_key: str = Depends(api_key_header)):
    """验证API Key"""
    if api_key not in settings.API_KEYS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key"
        )
    return api_key

@router.post(
    "",
    response_model=SkillResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        409: {"model": ErrorResponse, "description": "Conflict"}
    }
)
async def create_skill(
    skill: SkillCreate,
    db: Session = Depends(get_db),
    api_key: str = Depends(get_api_key)
):
    """
    创建新技能
    
    - **name**: 技能名称（必填）
    - **description**: 技能描述（可选）
    - **version**: 版本号（默认1.0.0）
    - **params_schema**: 参数JSON Schema定义（可选）
    - **created_by**: 创建者标识（必填）
    
    创建成功后技能状态为草稿（draft），需手动上线才能被调用
    """
    service = SkillService(db)
    try:
        result = service.create_skill(skill)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )

@router.get(
    "",
    response_model=SkillListResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"}
    }
)
async def list_skills(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页大小"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    status: Optional[str] = Query(None, description="状态筛选：draft/online/offline"),
    db: Session = Depends(get_db),
    api_key: str = Depends(get_api_key)
):
    """
    查询技能列表（支持分页、搜索、筛选）
    
    - **page**: 页码（从1开始）
    - **page_size**: 每页大小（1-100）
    - **search**: 搜索关键词（匹配名称或描述）
    - **status**: 状态筛选（draft/online/offline）
    """
    service = SkillService(db)
    skills, total = service.list_skills(page, page_size, search, status)
    
    return {
        "items": skills,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get(
    "/{skill_id}",
    response_model=SkillResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Not Found"}
    }
)
async def get_skill(
    skill_id: UUID,
    db: Session = Depends(get_db),
    api_key: str = Depends(get_api_key)
):
    """
    根据ID获取技能详情
    
    - **skill_id**: 技能唯一标识（UUID）
    """
    service = SkillService(db)
    skill = service.get_skill(str(skill_id))
    
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    return skill

@router.put(
    "/{skill_id}",
    response_model=SkillResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Not Found"},
        409: {"model": ErrorResponse, "description": "Conflict"}
    }
)
async def update_skill(
    skill_id: UUID,
    skill_update: SkillUpdate,
    db: Session = Depends(get_db),
    api_key: str = Depends(get_api_key)
):
    """
    更新技能信息
    
    - **skill_id**: 技能唯一标识（UUID）
    - **name**: 技能名称（可选）
    - **description**: 技能描述（可选）
    - **version**: 版本号（可选）
    - **params_schema**: 参数JSON Schema定义（可选）
    """
    service = SkillService(db)
    try:
        result = service.update_skill(str(skill_id), skill_update)
        return result
    except ValueError as e:
        if "不存在" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )

@router.patch(
    "/{skill_id}/status",
    response_model=SkillResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Not Found"}
    }
)
async def update_skill_status(
    skill_id: UUID,
    status_update: SkillStatusUpdate,
    db: Session = Depends(get_db),
    api_key: str = Depends(get_api_key)
):
    """
    更新技能状态（上下架管理）
    
    - **skill_id**: 技能唯一标识（UUID）
    - **status**: 目标状态（draft/online/offline）
    
    只有状态为online的技能才能被外部调用
    """
    service = SkillService(db)
    try:
        result = service.update_skill_status(str(skill_id), status_update.status.value)
        return result
    except ValueError as e:
        if "不存在" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete(
    "/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Not Found"}
    }
)
async def delete_skill(
    skill_id: UUID,
    db: Session = Depends(get_db),
    api_key: str = Depends(get_api_key)
):
    """
    删除技能
    
    - **skill_id**: 技能唯一标识（UUID）
    
    删除技能会同时删除相关的调用日志
    """
    service = SkillService(db)
    try:
        service.delete_skill(str(skill_id))
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.post(
    "/{skill_id}/upload",
    response_model=SkillResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Not Found"}
    }
)
async def upload_code_package(
    skill_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    api_key: str = Depends(get_api_key)
):
    """
    上传技能代码包
    
    - **skill_id**: 技能唯一标识（UUID）
    - **file**: 代码包文件（支持zip或单个文件）
    
    文件将存储到配置的上传目录
    """
    # 验证文件大小
    file_size = 0
    content = await file.read()
    file_size = len(content)
    
    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed size ({settings.MAX_FILE_SIZE / 1024 / 1024} MB)"
        )
    
    # 确保上传目录存在
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # 生成唯一文件名
    file_extension = os.path.splitext(file.filename)[1] if file.filename else ".zip"
    filename = f"{str(skill_id)}_{uuid.uuid4().hex[:8]}{file_extension}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    # 保存文件
    with open(file_path, "wb") as f:
        f.write(content)
    
    # 更新技能的代码路径
    service = SkillService(db)
    try:
        result = service.upload_code_package(str(skill_id), file_path)
        return result
    except ValueError as e:
        # 如果更新失败，删除已上传的文件
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.post(
    "/{skill_id}/call",
    response_model=SkillCallResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Not Found"},
        403: {"model": ErrorResponse, "description": "Forbidden"}
    }
)
async def call_skill(
    skill_id: UUID,
    request: SkillCallRequest,
    db: Session = Depends(get_db),
    api_key: str = Depends(get_api_key)
):
    """
    调用技能（仅上线状态的技能可调用）
    
    - **skill_id**: 技能唯一标识（UUID）
    - **params**: 调用参数（JSON对象）
    
    调用结果会记录到调用日志中
    """
    skill_service = SkillService(db)
    log_service = SkillCallLogService(db)
    
    # 获取技能
    skill = skill_service.get_skill(str(skill_id))
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    # 检查技能状态
    if skill.status != "online":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Skill is not online"
        )
    
    # 模拟技能调用（实际应执行代码包）
    try:
        # TODO: 实际调用技能代码包
        # 这里模拟返回结果
        result = {
            "message": f"Skill '{skill.name}' called successfully",
            "input_params": request.params,
            "version": skill.version
        }
        
        # 记录调用日志（成功）
        log_service.create_log(
            skill_id=str(skill_id),
            caller=api_key[:20],  # 使用API Key前20位作为调用方标识
            token_used=10.5,
            status="success"
        )
        
        return {
            "success": True,
            "result": result,
            "token_used": 10.5
        }
        
    except Exception as e:
        # 记录调用日志（失败）
        log_service.create_log(
            skill_id=str(skill_id),
            caller=api_key[:20],
            token_used=0,
            status="failed",
            error_msg=str(e)
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Skill execution failed: {str(e)}"
        )
