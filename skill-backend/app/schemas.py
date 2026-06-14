"""
Pydantic模型定义
用于API请求和响应的数据验证
"""
from pydantic import BaseModel, Field, UUID4
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# SKILL状态枚举（与数据库模型对应）
class SkillStatusEnum(str, Enum):
    DRAFT = "draft"
    ONLINE = "online"
    OFFLINE = "offline"

# SKILL创建请求模型
class SkillCreate(BaseModel):
    """
    创建SKILL请求模型
    验证用户提交的技能信息
    """
    name: str = Field(..., min_length=1, max_length=100, description="技能名称")
    description: Optional[str] = Field(None, description="技能描述")
    version: str = Field("1.0.0", pattern=r"^\d+\.\d+\.\d+$", description="版本号（语义化版本格式）")
    params_schema: Optional[Dict[str, Any]] = Field(None, description="参数JSON Schema定义")
    created_by: str = Field(..., min_length=1, max_length=100, description="创建者标识")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "天气查询",
                "description": "根据城市名称查询天气信息",
                "version": "1.0.0",
                "params_schema": {
                    "type": "object",
                    "properties": {
                        "city": {"type": "string", "description": "城市名称"}
                    },
                    "required": ["city"]
                },
                "created_by": "user_001"
            }
        }

# SKILL更新请求模型
class SkillUpdate(BaseModel):
    """
    更新SKILL请求模型
    允许部分字段更新
    """
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="技能名称")
    description: Optional[str] = Field(None, description="技能描述")
    version: Optional[str] = Field(None, pattern=r"^\d+\.\d+\.\d+$", description="版本号")
    params_schema: Optional[Dict[str, Any]] = Field(None, description="参数JSON Schema定义")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "天气查询V2",
                "version": "2.0.0"
            }
        }

# SKILL状态更新请求模型
class SkillStatusUpdate(BaseModel):
    """
    更新SKILL状态请求模型
    用于上下架操作
    """
    status: SkillStatusEnum = Field(..., description="目标状态")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "online"
            }
        }

# SKILL响应模型
class SkillResponse(BaseModel):
    """
    SKILL响应模型
    返回技能的详细信息
    """
    id: UUID4 = Field(..., description="技能唯一标识")
    name: str = Field(..., description="技能名称")
    description: Optional[str] = Field(None, description="技能描述")
    version: str = Field(..., description="版本号")
    status: SkillStatusEnum = Field(..., description="状态")
    params_schema: Optional[Dict[str, Any]] = Field(None, description="参数JSON Schema定义")
    code_path: Optional[str] = Field(None, description="代码包路径")
    created_by: str = Field(..., description="创建者")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")

    class Config:
        from_attributes = True

# SKILL列表响应模型
class SkillListResponse(BaseModel):
    """
    SKILL列表响应模型
    包含分页信息
    """
    items: List[SkillResponse] = Field(..., description="技能列表")
    total: int = Field(..., description="总记录数")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页大小")

# SKILL调用请求模型
class SkillCallRequest(BaseModel):
    """
    SKILL调用请求模型
    用于调用技能时传递参数
    """
    params: Dict[str, Any] = Field(..., description="调用参数")

    class Config:
        json_schema_extra = {
            "example": {
                "params": {
                    "city": "北京"
                }
            }
        }

# SKILL调用响应模型
class SkillCallResponse(BaseModel):
    """
    SKILL调用响应模型
    返回调用结果
    """
    success: bool = Field(..., description="调用是否成功")
    result: Optional[Any] = Field(None, description="调用结果")
    error: Optional[str] = Field(None, description="错误信息")
    token_used: float = Field(0, description="消耗的Token数量")

# SKILL调用日志响应模型
class SkillCallLogResponse(BaseModel):
    """
    SKILL调用日志响应模型
    返回调用日志详情
    """
    id: UUID4 = Field(..., description="日志唯一标识")
    skill_id: UUID4 = Field(..., description="关联技能ID")
    skill_name: Optional[str] = Field(None, description="技能名称")
    caller: str = Field(..., description="调用方标识")
    call_time: datetime = Field(..., description="调用时间")
    token_used: float = Field(..., description="消耗的Token数量")
    status: str = Field(..., description="调用状态")
    error_msg: Optional[str] = Field(None, description="错误信息")

    class Config:
        from_attributes = True

# SKILL调用日志列表响应模型
class SkillCallLogListResponse(BaseModel):
    """
    SKILL调用日志列表响应模型
    包含分页信息
    """
    items: List[SkillCallLogResponse] = Field(..., description="日志列表")
    total: int = Field(..., description="总记录数")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页大小")

# 错误响应模型
class ErrorResponse(BaseModel):
    """
    错误响应模型
    统一错误返回格式
    """
    code: int = Field(..., description="错误码")
    message: str = Field(..., description="错误信息")
    detail: Optional[str] = Field(None, description="详细信息")

    class Config:
        json_schema_extra = {
            "example": {
                "code": 404,
                "message": "Skill not found",
                "detail": "技能不存在"
            }
        }
