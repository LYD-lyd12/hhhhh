@echo off
chcp 65001 >nul
cd /d "%~dp0"
npx next dev --port 3000
pause
