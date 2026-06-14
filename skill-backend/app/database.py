"""
数据库模型定义
包含SKILL表和SKILL调用日志表
"""
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, ForeignKey, Enum, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum

# 创建数据库基类
Base = declarative_base()

# SKILL状态枚举
class SkillStatus(str, enum.Enum):
    DRAFT = "draft"      # 草稿状态，不可调用
    ONLINE = "online"    # 上线状态，可调用
    OFFLINE = "offline"  # 下线状态，不可调用

# SKILL模型
class Skill(Base):
    """
    SKILL技能表
    存储技能的基本信息和代码路径
    """
    __tablename__ = "skills"
    
    id = Column(String(36), primary_key=True, comment="技能唯一标识（UUID）")
    name = Column(String(100), nullable=False, index=True, comment="技能名称")
    description = Column(Text, comment="技能描述")
    version = Column(String(20), nullable=False, default="1.0.0", comment="版本号（语义化版本）")
    status = Column(Enum(SkillStatus), nullable=False, default=SkillStatus.DRAFT, comment="状态")
    params_schema = Column(JSON, comment="参数JSON Schema定义")
    code_path = Column(String(255), comment="代码包存储路径")
    created_by = Column(String(100), nullable=False, comment="创建者标识")
    created_at = Column(DateTime, nullable=False, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now, comment="更新时间")
    
    # 关联调用日志
    logs = relationship("SkillCallLog", back_populates="skill", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Skill(id={self.id}, name={self.name}, version={self.version}, status={self.status})>"

# SKILL调用日志模型
class SkillCallLog(Base):
    """
    SKILL调用日志表
    记录每次技能调用的详细信息
    """
    __tablename__ = "skill_call_logs"
    
    id = Column(String(36), primary_key=True, comment="日志唯一标识（UUID）")
    skill_id = Column(String(36), ForeignKey("skills.id"), nullable=False, index=True, comment="关联技能ID")
    caller = Column(String(100), nullable=False, comment="调用方标识（用户ID或API Key标识）")
    call_time = Column(DateTime, nullable=False, default=datetime.now, comment="调用时间")
    token_used = Column(Float, default=0, comment="消耗的Token数量")
    status = Column(String(20), nullable=False, comment="调用状态（success/failed）")
    error_msg = Column(Text, comment="错误信息（失败时记录）")
    
    # 关联技能
    skill = relationship("Skill", back_populates="logs")

    def __repr__(self):
        return f"<SkillCallLog(id={self.id}, skill_id={self.skill_id}, caller={self.caller}, status={self.status})>"

# 数据库连接配置
def get_engine(database_url: str):
    """创建数据库引擎"""
    return create_engine(database_url, connect_args={"check_same_thread": False})

def get_session_local(engine):
    """创建数据库会话"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal

# 依赖函数：获取数据库会话
def get_db():
    """FastAPI依赖函数，用于获取数据库会话"""
    from app.main import settings
    engine = get_engine(settings.DATABASE_URL)
    db = get_session_local(engine)()
    try:
        yield db
    finally:
        db.close()

# 初始化数据库表
def init_db(database_url: str):
    """初始化数据库表结构"""
    engine = get_engine(database_url)
    Base.metadata.create_all(bind=engine)
    print("[OK] 数据库表初始化完成")
