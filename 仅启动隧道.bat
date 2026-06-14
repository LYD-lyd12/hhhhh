@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================
echo  TeleToken Router - 仅启动内网穿透
echo  (前后端需已在运行中)
echo ==========================================
echo.
echo 正在启动隧道...
powershell -ExecutionPolicy Bypass -Command ^
"$webJob = Start-Job -Name 'Tunnel-Web' -ScriptBlock { ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:localhost:3000 serveo.net 2>&1 }; ^
$apiJob = Start-Job -Name 'Tunnel-API' -ScriptBlock { ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:localhost:8080 serveo.net 2>&1 }; ^
Start-Sleep 10; ^
$webOut = Receive-Job -Job $webJob; $apiOut = Receive-Job -Job $apiJob; ^
if ($webOut -match 'https://[a-z0-9]+-[0-9-]+\.serveousercontent\.com') { Write-Host ''; Write-Host '  🌐 管理后台:' $matches[0] -ForegroundColor Cyan }; ^
if ($apiOut -match 'https://[a-z0-9]+-[0-9-]+\.serveousercontent\.com') { Write-Host '  🔌 API 接口:' $matches[0]/api/v1 -ForegroundColor Cyan }; ^
Write-Host ''; Write-Host '按任意键关闭此窗口（隧道继续运行）...'; ^
$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')"
