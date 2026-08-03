$ErrorActionPreference = 'Stop'

$frontendDir = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path (Split-Path -Parent $frontendDir) 'alphabag_v3_backend'

if (-not (Test-Path $backendDir)) {
  throw "Backend directory not found: $backendDir"
}

Write-Host "`n============================================" -ForegroundColor Green
Write-Host " AlphaBAG V3 - Local Dev Launcher" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green

# Stop anything already listening on app ports
$ports = @(3005, 3003)
foreach ($port in $ports) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object {
      try { Stop-Process -Id $_ -Force -ErrorAction Stop } catch {}
    }
}

Start-Sleep -Milliseconds 500

Write-Host "Starting backend on :3003 ..." -ForegroundColor Yellow
$backendCmd = 'cd /d "{0}" && set NODE_ENV=development && set VITE_ENVIRONMENT=testnet && set FRONTEND_URL=http://localhost:3005 && set JWT_SECRET=local_dev_jwt_secret_abcdefghijklmnopqrstuvwxyz_123456 && set PORT=3003 && npm start' -f $backendDir
Start-Process cmd.exe -ArgumentList @(
  '/k',
  $backendCmd
) | Out-Null

Start-Sleep -Seconds 2

Write-Host "Starting frontend on :3005 ..." -ForegroundColor Yellow
$frontendCmd = 'cd /d "{0}" && npm run dev' -f $frontendDir
Start-Process cmd.exe -ArgumentList @(
  '/k',
  $frontendCmd
) | Out-Null

Start-Sleep -Seconds 2

Start-Process "http://localhost:3005/" | Out-Null

Write-Host "`nSERVERS RUNNING" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3005" -ForegroundColor Cyan
Write-Host "Backend : http://localhost:3003" -ForegroundColor Cyan
Write-Host "Admin   : http://localhost:3005/#/admin`n" -ForegroundColor Cyan
