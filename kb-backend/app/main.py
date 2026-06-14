"""
KB知识库模块 - FastAPI主应用入口
支持RAG检索增强功能
"""
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db

init_db(settings.DATABASE_URL)

from app.routes.kb_routes import router as kb_router
from app.routes.document_routes import router as document_router

app = FastAPI(
    title="KB知识库模块",
    description="支持RAG检索增强的知识库管理系统",
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

app.include_router(kb_router)
app.include_router(document_router)

@app.get("/health", tags=["Health"])
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "service": "KB知识库模块",
        "version": "1.0.0",
        "timestamp": __import__('datetime').datetime.now().isoformat()
    }

@app.get("/", tags=["Root"])
async def root():
    """欢迎页面"""
    return {
        "message": "欢迎使用 KB知识库模块 API",
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
        log_level=settings.LOG_LEVEL.lower()
    )
