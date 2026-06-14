@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ======================================
echo  TeleToken Router - 全栈启动
echo ======================================
echo.
echo 提示：推荐使用"一键启动.bat"，自带内网穿透
echo 此脚本仅启动本地服务（localhost）
echo.
echo [1/2] 启动后端 API 服务 (端口 8080)...
start "TeleToken Backend" cmd /c "cd /d %~dp0backend && node server.js"
timeout /t 3 /nobreak >nul
echo [2/2] 启动前端 Next.js (端口 3000)...
start "TeleToken Frontend" cmd /c "cd /d %~dp0 && npx next dev --port 3000"
echo.
echo ======================================
echo  启动完成!
echo  前端: http://localhost:3000
echo  后端: http://localhost:8080
echo  管理员: admin@teletoken.io / admin123
echo  API Key: admin-api-key-123
echo ======================================
echo.
echo 按任意键退出...
pause >nul