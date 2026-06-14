# ============================================
#  TeleToken Router - 一键启动脚本
#  自动启动前后端 + 内网穿透，其他人打开网址就能用
# ============================================

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "TeleToken Router 启动中..."

# 项目根目录（脚本所在目录）
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ROOT

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TeleToken Router - 一键启动         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── 检查 Node.js ──
$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "[错误] 未找到 Node.js，请先安装 https://nodejs.org" -ForegroundColor Red
    pause
    exit 1
}

# ── 清理旧进程 ──
Write-Host "[1/5] 清理旧进程..." -ForegroundColor Yellow
$ports = @(3000, 8080)
foreach ($port in $ports) {
    $pids = (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue).OwningProcess | Sort-Object -Unique
    foreach ($pid in $pids) {
        try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {}
    }
}
# 也清理旧 SSH 隧道
Get-Process -Name "ssh" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Write-Host "   已清理" -ForegroundColor Green

# ── 启动后端 (Express, 端口 8080) ──
Write-Host "[2/5] 启动后端 API 服务 (端口 8080)..." -ForegroundColor Yellow
$backendDir = Join-Path $ROOT "backend"
$backendJob = Start-Job -Name "TeleToken-Backend" -ScriptBlock {
    param($dir)
    Set-Location $dir
    node server.js 2>&1 | Out-File -Append (Join-Path $dir "server.log")
} -ArgumentList $backendDir
Write-Host "   PID: $($backendJob.Id)" -ForegroundColor Green

# ── 启动前端 (Next.js, 端口 3000) ──
Write-Host "[3/5] 启动前端界面 (端口 3000)..." -ForegroundColor Yellow
$frontendJob = Start-Job -Name "TeleToken-Frontend" -ScriptBlock {
    param($dir)
    Set-Location $dir
    $env:NEXT_TELEMETRY_DISABLED = "1"
    node node_modules/next/dist/bin/next dev --port 3000 2>&1 | Out-File -Append (Join-Path $dir "frontend.log")
} -ArgumentList $ROOT
Write-Host "   PID: $($frontendJob.Id)" -ForegroundColor Green

# ── 等待服务就绪 ──
Write-Host "[4/5] 等待服务启动..." -ForegroundColor Yellow
$maxWait = 60
$elapsed = 0
$bothReady = $false
while ($elapsed -lt $maxWait -and -not $bothReady) {
    Start-Sleep -Seconds 2
    $elapsed += 2
    $backendOk = $false; $frontendOk = $false
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8080/api/v1/admin/stats" -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200) { $backendOk = $true }
    } catch {}
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200) { $frontendOk = $true }
    } catch {}
    Write-Host "   [$elapsed`s] 后端: $(if($backendOk){'✓'}else{'...'})  前端: $(if($frontendOk){'✓'}else{'...'})"
    $bothReady = $backendOk -and $frontendOk
}

if (-not $bothReady) {
    Write-Host "[警告] 服务启动超时，但隧道仍会尝试连接" -ForegroundColor DarkYellow
}
Write-Host "   服务就绪" -ForegroundColor Green

# ── 启动内网穿透 (serveo) ──
Write-Host "[5/5] 启动内网穿透..." -ForegroundColor Yellow

Start-Sleep -Seconds 2

# 启动 Web 隧道（前端 3000）
$webTunnelScript = Join-Path $ROOT "tunnel_web.ps1"
@"
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes -R 80:localhost:3000 serveo.net 2>&1
"@ | Out-File -FilePath $webTunnelScript -Encoding UTF8

$webJob = Start-Job -Name "Tunnel-Web" -ScriptBlock {
    param($cmd)
    ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes -R 80:localhost:3000 serveo.net 2>&1
} -ArgumentList ""

# 启动 API 隧道（后端 8080）
$apiJob = Start-Job -Name "Tunnel-API" -ScriptBlock {
    ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes -R 80:localhost:8080 serveo.net 2>&1
}

# 等待隧道 URL 出现
Write-Host "   等待隧道地址..." -ForegroundColor Yellow
$webUrl = $null; $apiUrl = $null
$maxWait2 = 20; $wait2 = 0
while ($wait2 -lt $maxWait2 -and (-not $webUrl -or -not $apiUrl)) {
    Start-Sleep -Seconds 2
    $wait2 += 2
    
    if (-not $webUrl) {
        $webOut = Receive-Job -Job $webJob -ErrorAction SilentlyContinue
        if ($webOut -match "https://[a-z0-9]+-[0-9-]+\.serveousercontent\.com") {
            $webUrl = $matches[0]
        }
    }
    if (-not $apiUrl) {
        $apiOut = Receive-Job -Job $apiJob -ErrorAction SilentlyContinue
        if ($apiOut -match "https://[a-z0-9]+-[0-9-]+\.serveousercontent\.com") {
            $apiUrl = $matches[0]
        }
    }
}

# ── 显示结果 ──
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║            启动完成！可以开始使用了                ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 管理后台（给别人这个网址）:" -ForegroundColor White
if ($webUrl) {
    Write-Host "     $webUrl" -ForegroundColor Cyan
} else {
    Write-Host "     (隧道启动中，请稍等...)" -ForegroundColor DarkYellow
}
Write-Host ""
Write-Host "  🔌 API 接口地址:" -ForegroundColor White
if ($apiUrl) {
    Write-Host "     $apiUrl/api/v1" -ForegroundColor Cyan
} else {
    Write-Host "     (隧道启动中，请稍等...)" -ForegroundColor DarkYellow
}
Write-Host ""
Write-Host "  ──────────────────────────────────" -ForegroundColor Gray
Write-Host "  📧 登录账号:" -ForegroundColor White
Write-Host "     管理员: admin@teletoken.io / admin123" -ForegroundColor Yellow
Write-Host "     测试用户: test@teletoken.io / test123" -ForegroundColor Yellow
Write-Host ""
Write-Host "  🔑 API Key: admin-api-key-123" -ForegroundColor Yellow
Write-Host "  🤖 推荐模型: deepseek-chat" -ForegroundColor Yellow
Write-Host "  ──────────────────────────────────" -ForegroundColor Gray
Write-Host ""
Write-Host "  📌 提示: 关闭此窗口不会停止服务" -ForegroundColor DarkGray
Write-Host "     停止服务请双击: 停止服务.bat" -ForegroundColor DarkGray
Write-Host ""

# ── 保存地址到文件，方便查看 ──
$infoFile = Join-Path $ROOT "当前地址.txt"
@"
TeleToken Router - 当前访问地址
===================================
生成时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

管理后台 (给别人用): $webUrl

API 接口: $apiUrl/api/v1

登录账号:
  管理员: admin@teletoken.io / admin123
  测试用户: test@teletoken.io / test123

API Key: admin-api-key-123
模型: deepseek-chat

⚠️ 电脑重启或隧道断开后，地址会变化。重新双击"一键启动.bat"即可。
"@ | Out-File -FilePath $infoFile -Encoding UTF8

Write-Host "  地址已保存到: 当前地址.txt" -ForegroundColor Green
Write-Host ""

# 保持脚本运行，等待用户按任意键
Write-Host "按任意键退出此窗口（服务继续后台运行）..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
