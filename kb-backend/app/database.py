from sqlalchemy import create_engine, Column, String, Integer, Text, TIMESTAMP, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import uuid

Base = declarative_base()

class KnowledgeBase(Base):
    __tablename__ = "knowledge_bases"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    description = Column(Text)
    chunk_size = Column(Integer, default=512)
    chunk_overlap = Column(Integer, default=50)
    embedding_model = Column(String(50), default="bge-large-zh")
    created_at = Column(TIMESTAMP, default=datetime.now)
    
    documents = relationship("Document", back_populates="kb", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    kb_id = Column(String(36), ForeignKey("knowledge_bases.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    chunk_count = Column(Integer, default=0)
    status = Column(String(20), default="processing")
    error_message = Column(Text)
    created_at = Column(TIMESTAMP, default=datetime.now)
    
    kb = relationship("KnowledgeBase", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doc_id = Column(String(36), ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    chunk_metadata = Column(JSON)  # 'metadata' is reserved in SQLAlchemy
    created_at = Column(TIMESTAMP, default=datetime.now)
    
    document = relationship("Document", back_populates="chunks")

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
    print("[OK] 数据库表初始化完成")
