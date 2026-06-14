"""
SKILL调用日志路由
包含调用日志的查询和统计功能
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db, Skill
from app.services import SkillCallLogService
from app.schemas import (
    SkillCallLogResponse,
    SkillCallLogListResponse,
    ErrorResponse
)
from app.main import settings

# 创建路由实例
router = APIRouter(prefix="/api/logs", tags=["Logs"])

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

@router.get(
    "",
    response_model=SkillCallLogListResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"}
    }
)
async def list_logs(
    skill_id: Optional[UUID] = Query(None, description="技能ID筛选"),
    caller: Optional[str] = Query(None, description="调用方筛选"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页大小"),
    db: Session = Depends(get_db),
    api_key: str = Depends(get_api_key)
):
    """
    查询调用日志列表（支持分页和筛选）
    
    - **skill_id**: 技能ID筛选（可选）
    - **caller**: 调用方标识筛选（可选）
    - **page**: 页码（从1开始）
    - **page_size**: 每页大小（1-100）
    """
    service = SkillCallLogService(db)
    logs, total = service.list_logs(
        str(skill_id) if skill_id else None,
        caller,
        page,
        page_size
    )
    
    # 获取技能名称用于响应
    skill_name_map = {}
    if logs:
        skill_ids = set(log.skill_id for log in logs)
        skills = db.query(Skill).filter(Skill.id.in_(skill_ids)).all()
        skill_name_map = {skill.id: skill.name for skill in skills}
    
    # 构建响应数据
    items = []
    for log in logs:
        items.append({
            "id": log.id,
            "skill_id": log.skill_id,
            "skill_name": skill_name_map.get(log.skill_id),
            "caller": log.caller,
            "call_time": log.call_time,
            "token_used": log.token_used,
            "status": log.status,
            "error_msg": log.error_msg
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.get(
    "/{log_id}",
    response_model=SkillCallLogResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Not Found"}
    }
)
async def get_log(
    log_id: UUID,
    db: Session = Depends(get_db),
    api_key: str = Depends(get_api_key)
):
    """
    根据ID获取调用日志详情
    
    - **log_id**: 日志唯一标识（UUID）
    """
    service = SkillCallLogService(db)
    log = service.get_log(str(log_id))
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Log not found"
        )
    
    # 获取技能名称
    skill = db.query(Skill).filter(Skill.id == log.skill_id).first()
    
    return {
        "id": log.id,
        "skill_id": log.skill_id,
        "skill_name": skill.name if skill else None,
        "caller": log.caller,
        "call_time": log.call_time,
        "token_used": log.token_used,
        "status": log.status,
        "error_msg": log.error_msg
    }

@router.get(
    "/stats/{skill_id}",
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Not Found"}
    }
)
async def get_skill_call_stats(
    skill_id: UUID,
    db: Session = Depends(get_db),
    api_key: str = Depends(get_api_key)
):
    """
    获取技能调用统计信息
    
    - **skill_id**: 技能唯一标识（UUID）
    
    返回统计信息：调用次数、成功率、Token消耗等
    """
    # 验证技能存在
    skill = db.query(Skill).filter(Skill.id == str(skill_id)).first()
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found"
        )
    
    service = SkillCallLogService(db)
    stats = service.get_skill_call_stats(str(skill_id))
    
    # 添加技能名称
    stats["skill_name"] = skill.name
    
    return stats
