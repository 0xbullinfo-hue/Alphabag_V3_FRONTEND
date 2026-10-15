$ErrorActionPreference = 'Stop'

$frontendDir = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path (Split-Path -Parent $frontendDir) 'backend'
if (-not (Test-Path $backendDir)) {
  $backendDir = Join-Path (Split-Path -Parent $frontendDir) 'alphabag_v3_backend'
}

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

$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notmatch '^169\.254\.' } |
  Select-Object -First 1 -ExpandProperty IPAddress)

if (-not $ipAddress) {
  $ipAddress = '127.0.0.1'
}

$networkFrontendUrl = "http://$($ipAddress):3005"

Write-Host "Starting backend on :3003 ..." -ForegroundColor Yellow
$backendCmd = 'cd /d "{0}" && set NODE_ENV=development && set VITE_ENVIRONMENT=testnet && set FRONTEND_URL={1} && set JWT_SECRET=local_dev_jwt_secret_abcdefghijklmnopqrstuvwxyz_123456 && set PORT=3003 && npm start' -f $backendDir, $networkFrontendUrl
Start-Process cmd.exe -ArgumentList @(
  '/k',
  $backendCmd
) | Out-Null

Start-Sleep -Seconds 2

Write-Host "Starting frontend on :3005 ..." -ForegroundColor Yellow
$frontendCmd = 'cd /d "{0}" && set VITE_DEV_HOST=0.0.0.0 && set VITE_DEV_PORT=3005 && npm run dev' -f $frontendDir
Start-Process cmd.exe -ArgumentList @(
  '/k',
  $frontendCmd
) | Out-Null

Start-Sleep -Seconds 2

Start-Process "http://localhost:3005/" | Out-Null

Write-Host "`n============================================" -ForegroundColor Green
Write-Host " SERVERS RUNNING SUCCESSFULLY" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host " Landing Page : http://localhost:3005/ (or http://localhost:3005/#/landing)" -ForegroundColor Cyan
Write-Host " Dashboard    : http://localhost:3005/#/dashboard (or http://localhost:3005/#/my-alphabag)" -ForegroundColor Cyan
Write-Host " Alpha Desk   : http://localhost:3005/#/alpha-desk" -ForegroundColor Cyan
Write-Host " Alpha Feed   : http://localhost:3005/#/alphas-feed" -ForegroundColor Cyan
Write-Host " Backend API  : http://localhost:3003" -ForegroundColor Cyan
Write-Host " Admin Portal : http://localhost:3005/#/admin" -ForegroundColor Cyan
Write-Host " Network URL  : $networkFrontendUrl`n" -ForegroundColor Green
