"""
业务服务层
包含SKILL管理和调用日志的核心业务逻辑
"""
import os
import uuid
import json
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from sqlalchemy.exc import IntegrityError

from app.database import Skill, SkillCallLog, SkillStatus
from app.schemas import SkillCreate, SkillUpdate, SkillStatusEnum

class SkillService:
    """
    SKILL服务类
    处理SKILL的CRUD操作
    """

    def __init__(self, db: Session):
        self.db = db

    def create_skill(self, data: SkillCreate) -> Skill:
        """
        创建新技能
        :param data: 技能创建数据
        :return: 创建的技能对象
        """
        # 检查同名技能是否存在
        existing_skill = self.db.query(Skill).filter(
            Skill.name == data.name
        ).first()
        
        if existing_skill:
            raise ValueError(f"技能名称 '{data.name}' 已存在")

        # 生成UUID
        skill_id = str(uuid.uuid4())
        
        # 创建技能对象
        skill = Skill(
            id=skill_id,
            name=data.name,
            description=data.description,
            version=data.version,
            status=SkillStatus.DRAFT,  # 默认草稿状态
            params_schema=data.params_schema,
            created_by=data.created_by,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        # 保存到数据库
        try:
            self.db.add(skill)
            self.db.commit()
            self.db.refresh(skill)
            return skill
        except IntegrityError as e:
            self.db.rollback()
            raise ValueError(f"创建技能失败: {str(e)}")

    def get_skill(self, skill_id: str) -> Optional[Skill]:
        """
        根据ID获取技能
        :param skill_id: 技能ID
        :return: 技能对象或None
        """
        return self.db.query(Skill).filter(Skill.id == skill_id).first()

    def get_skill_by_name(self, name: str) -> Optional[Skill]:
        """
        根据名称获取技能
        :param name: 技能名称
        :return: 技能对象或None
        """
        return self.db.query(Skill).filter(Skill.name == name).first()

    def list_skills(
        self,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[List[Skill], int]:
        """
        查询技能列表（支持分页、搜索、筛选）
        :param page: 页码（从1开始）
        :param page_size: 每页大小
        :param search: 搜索关键词（匹配名称或描述）
        :param status: 状态筛选（draft/online/offline）
        :return: (技能列表, 总记录数)
        """
        query = self.db.query(Skill)

        # 状态筛选
        if status:
            query = query.filter(Skill.status == status)

        # 搜索过滤
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Skill.name.like(search_pattern),
                    Skill.description.like(search_pattern)
                )
            )

        # 计算总数
        total = query.count()

        # 分页
        offset = (page - 1) * page_size
        skills = query.order_by(Skill.created_at.desc()).offset(offset).limit(page_size).all()

        return skills, total

    def update_skill(self, skill_id: str, data: SkillUpdate) -> Skill:
        """
        更新技能信息
        :param skill_id: 技能ID
        :param data: 更新数据
        :return: 更新后的技能对象
        """
        skill = self.get_skill(skill_id)
        if not skill:
            raise ValueError("技能不存在")

        # 更新字段（仅更新非None的字段）
        if data.name is not None:
            # 检查新名称是否与其他技能重复
            existing = self.db.query(Skill).filter(
                Skill.name == data.name,
                Skill.id != skill_id
            ).first()
            if existing:
                raise ValueError(f"技能名称 '{data.name}' 已存在")
            skill.name = data.name
        
        if data.description is not None:
            skill.description = data.description
        
        if data.version is not None:
            skill.version = data.version
        
        if data.params_schema is not None:
            skill.params_schema = data.params_schema

        skill.updated_at = datetime.now()

        try:
            self.db.commit()
            self.db.refresh(skill)
            return skill
        except IntegrityError as e:
            self.db.rollback()
            raise ValueError(f"更新技能失败: {str(e)}")

    def update_skill_status(self, skill_id: str, status: str) -> Skill:
        """
        更新技能状态（上下架管理）
        :param skill_id: 技能ID
        :param status: 目标状态
        :return: 更新后的技能对象
        """
        skill = self.get_skill(skill_id)
        if not skill:
            raise ValueError("技能不存在")

        # 验证状态值，并转换为枚举对象，与创建时保持一致
        valid_values = [s.value for s in SkillStatus]
        if status not in valid_values:
            raise ValueError(f"无效状态值: {status}")

        # 统一使用枚举对象赋值，避免字符串/枚举混用导致的类型不一致
        skill.status = SkillStatus(status)
        skill.updated_at = datetime.now()

        try:
            self.db.commit()
            self.db.refresh(skill)
            return skill
        except IntegrityError as e:
            self.db.rollback()
            raise ValueError(f"更新状态失败: {str(e)}")

    def delete_skill(self, skill_id: str) -> bool:
        """
        删除技能（软删除或物理删除，这里使用物理删除）
        :param skill_id: 技能ID
        :return: 是否删除成功
        """
        skill = self.get_skill(skill_id)
        if not skill:
            raise ValueError("技能不存在")

        try:
            self.db.delete(skill)
            self.db.commit()
            return True
        except IntegrityError as e:
            self.db.rollback()
            raise ValueError(f"删除技能失败: {str(e)}")

    def upload_code_package(self, skill_id: str, file_path: str) -> Skill:
        """
        上传代码包并更新技能的代码路径
        :param skill_id: 技能ID
        :param file_path: 代码包存储路径
        :return: 更新后的技能对象
        """
        skill = self.get_skill(skill_id)
        if not skill:
            raise ValueError("技能不存在")

        skill.code_path = file_path
        skill.updated_at = datetime.now()

        try:
            self.db.commit()
            self.db.refresh(skill)
            return skill
        except IntegrityError as e:
            self.db.rollback()
            raise ValueError(f"上传代码包失败: {str(e)}")


class SkillCallLogService:
    """
    SKILL调用日志服务类
    处理调用日志的记录和查询
    """

    def __init__(self, db: Session):
        self.db = db

    def create_log(
        self,
        skill_id: str,
        caller: str,
        token_used: float = 0,
        status: str = "success",
        error_msg: Optional[str] = None
    ) -> SkillCallLog:
        """
        创建调用日志
        :param skill_id: 技能ID
        :param caller: 调用方标识
        :param token_used: 消耗的Token数量
        :param status: 调用状态（success/failed）
        :param error_msg: 错误信息
        :return: 创建的日志对象
        """
        log_id = str(uuid.uuid4())

        log_entry = SkillCallLog(
            id=log_id,
            skill_id=skill_id,
            caller=caller,
            call_time=datetime.now(),
            token_used=token_used,
            status=status,
            error_msg=error_msg
        )

        try:
            self.db.add(log_entry)
            self.db.commit()
            self.db.refresh(log_entry)
            return log_entry
        except IntegrityError as e:
            self.db.rollback()
            raise ValueError(f"创建日志失败: {str(e)}")

    def get_log(self, log_id: str) -> Optional[SkillCallLog]:
        """
        根据ID获取日志
        :param log_id: 日志ID
        :return: 日志对象或None
        """
        return self.db.query(SkillCallLog).filter(SkillCallLog.id == log_id).first()

    def list_logs(
        self,
        skill_id: Optional[str] = None,
        caller: Optional[str] = None,
        page: int = 1,
        page_size: int = 10
    ) -> Tuple[List[SkillCallLog], int]:
        """
        查询调用日志列表（支持分页和筛选）
        :param skill_id: 技能ID筛选
        :param caller: 调用方筛选
        :param page: 页码
        :param page_size: 每页大小
        :return: (日志列表, 总记录数)
        """
        query = self.db.query(SkillCallLog)

        # 技能ID筛选
        if skill_id:
            query = query.filter(SkillCallLog.skill_id == skill_id)

        # 调用方筛选
        if caller:
            query = query.filter(SkillCallLog.caller == caller)

        # 计算总数
        total = query.count()

        # 分页
        offset = (page - 1) * page_size
        logs = query.order_by(SkillCallLog.call_time.desc()).offset(offset).limit(page_size).all()

        return logs, total

    def get_skill_call_stats(self, skill_id: str) -> Dict[str, Any]:
        """
        获取技能调用统计
        :param skill_id: 技能ID
        :return: 统计信息
        """
        logs = self.db.query(SkillCallLog).filter(SkillCallLog.skill_id == skill_id).all()
        
        total_calls = len(logs)
        success_calls = len([log for log in logs if log.status == "success"])
        failed_calls = total_calls - success_calls
        total_tokens = sum([log.token_used for log in logs])
        avg_tokens = total_tokens / total_calls if total_calls > 0 else 0

        return {
            "skill_id": skill_id,
            "total_calls": total_calls,
            "success_calls": success_calls,
            "failed_calls": failed_calls,
            "success_rate": (success_calls / total_calls * 100) if total_calls > 0 else 0,
            "total_tokens": total_tokens,
            "avg_tokens_per_call": avg_tokens
        }
