@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ╔════════════════════════════════════════╗
echo ║   TeleToken Router - 安装依赖       ║
echo ╚════════════════════════════════════════╝
echo.

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js！
    echo 请先安装 Node.js: https://nodejs.org
    echo 推荐 LTS 版本，安装后重新运行本脚本。
    pause
    exit /b 1
)
echo Node.js 版本:
node -v
echo.

REM 安装前端依赖
echo [1/2] 安装前端依赖...
call npm install
if %errorlevel% neq 0 (
    echo [错误] 前端依赖安装失败，请检查网络连接
    pause
    exit /b 1
)
echo 前端依赖安装完成 ✓
echo.

REM 安装后端依赖
echo [2/2] 安装后端依赖...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [错误] 后端依赖安装失败，请检查网络连接
    pause
    exit /b 1
)
cd ..
echo 后端依赖安装完成 ✓
echo.

echo ╔════════════════════════════════════════╗
echo ║  安装完成！                        ║
echo ╚════════════════════════════════════════╝
echo.
echo 现在双击 "一键启动.bat" 即可启动服务
echo.
pause
