import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", 8003))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./mcp.db")
    
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "")
    API_KEYS: list = os.getenv("API_KEYS", "mcp-api-key-123").split(",")
    
    DEFAULT_TIMEOUT: int = int(os.getenv("DEFAULT_TIMEOUT", 30000))

settings = Settings()
