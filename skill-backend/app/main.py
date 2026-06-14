"""
FastAPI主应用入口
包含应用配置、中间件和路由注册
"""
import os
from dotenv import load_dotenv
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# 加载环境变量
load_dotenv()

# 应用配置
class Settings:
    PORT: int = int(os.getenv("PORT", 8001))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./skills.db")
    API_KEYS: set = set((os.getenv("API_KEYS", "skill-admin-key-123")).split(",")) - {""}
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", 10485760))  # 10MB
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

# 创建配置实例
settings = Settings()

# 初始化数据库（必须在导入路由前执行）
from app.database import init_db
init_db(settings.DATABASE_URL)

# 创建FastAPI应用
app = FastAPI(
    title="SKILL技能资产库",
    description="管理AI可调用工具插件的后端服务",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
from app.routes.skills import router as skills_router
from app.routes.logs import router as logs_router

app.include_router(skills_router)
app.include_router(logs_router)

# 健康检查端点
@app.get("/health", tags=["Health"])
async def health_check():
    """
    健康检查端点
    用于监控服务状态
    """
    return {
        "status": "healthy",
        "service": "SKILL技能资产库",
        "version": "1.0.0"
    }

# 根路径欢迎信息
@app.get("/", tags=["Root"])
async def root():
    """
    欢迎页面
    """
    return {
        "message": "欢迎使用 SKILL技能资产库 API",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    全局异常处理器
    统一处理未捕获的异常
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": 500,
            "message": "Internal Server Error",
            "detail": str(exc)
        }
    )

# 启动应用（用于开发环境）
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )
