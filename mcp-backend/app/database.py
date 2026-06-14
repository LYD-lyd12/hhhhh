from sqlalchemy import create_engine, Column, String, Integer, Text, JSON, TIMESTAMP, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid

Base = declarative_base()

class MCPServer(Base):
    __tablename__ = "mcp_servers"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    description = Column(Text)
    server_url = Column(String(500), nullable=False)
    auth_type = Column(String(20), default="none")
    auth_config = Column(Text)
    tools = Column(JSON, default=[])
    status = Column(String(20), default="inactive")
    api_version = Column(String(20), default="1.0")
    timeout = Column(Integer, default=30000)
    health_status = Column(String(20), default="unknown")
    last_health_check = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)

def get_engine(database_url: str):
    return create_engine(database_url, connect_args={"check_same_thread": False})

def get_session_local(engine):
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal

def get_db():
    from app.config import settings
    engine = get_engine(settings.DATABASE_URL)
    db = get_session_local(engine)()
    try:
        yield db
    finally:
        db.close()

def init_db(database_url: str):
    engine = get_engine(database_url)
    Base.metadata.create_all(bind=engine)
    print("[OK] MCP数据库表初始化完成")
