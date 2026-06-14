"""
MCP配置管理模块 - FastAPI主应用入口
支持管理多个MCP Server配置、验证连通性、暴露工具给下游调用
"""
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db

init_db(settings.DATABASE_URL)

from app.routes.mcp_routes import router as mcp_router

app = FastAPI(
    title="MCP配置管理模块",
    description="管理多个MCP Server配置，验证连通性，暴露工具给下游调用",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mcp_router)

@app.get("/health", tags=["Health"])
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "service": "MCP配置管理模块",
        "version": "1.0.0",
        "timestamp": __import__('datetime').datetime.now().isoformat()
    }

@app.get("/", tags=["Root"])
async def root():
    """欢迎页面"""
    return {
        "message": "欢迎使用 MCP配置管理模块 API",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """全局异常处理器"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": 500,
            "message": "Internal Server Error",
            "detail": str(exc)
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower() if hasattr(settings, 'LOG_LEVEL') else "info"
    )
