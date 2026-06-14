import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", 8002))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./kb.db")
    
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", 52428800))
    
    DEFAULT_EMBEDDING_MODEL: str = os.getenv("DEFAULT_EMBEDDING_MODEL", "bge-large-zh")
    SUPPORTED_MODELS: list = os.getenv("SUPPORTED_MODELS", "bge-large-zh,text-embedding-ada").split(",")
    
    VECTOR_STORE: str = os.getenv("VECTOR_STORE", "faiss")
    TOP_K: int = int(os.getenv("TOP_K", 5))
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", 512))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", 50))
    
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

settings = Settings()
