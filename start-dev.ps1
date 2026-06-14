$env:NEXT_TELEMETRY_DISABLED = "1"
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
Write-Host "Starting Next.js dev server on port 3000..." -ForegroundColor Green
npx next dev --port 3000
