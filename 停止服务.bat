@echo off
chcp 65001 >nul
echo ==========================================
echo  TeleToken Router - 停止所有服务
echo ==========================================
echo.

echo 正在停止 Express 后端 (端口 8080)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080.*LISTENING"') do (
    taskkill /F /PID %%a 2>nul && echo   已停止 PID %%a
)

echo 正在停止 Next.js 前端 (端口 3000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000.*LISTENING"') do (
    taskkill /F /PID %%a 2>nul && echo   已停止 PID %%a
)

echo.
echo ==========================================
echo  所有服务已停止
echo ==========================================
echo.
pause
