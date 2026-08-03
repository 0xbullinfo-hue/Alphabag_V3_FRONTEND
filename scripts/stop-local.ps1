$ports = @(3005, 3003)
Write-Host "Stopping AlphaBAG local services..." -ForegroundColor Yellow
foreach ($port in $ports) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object {
      try {
        Stop-Process -Id $_ -Force -ErrorAction Stop
        Write-Host "Stopped PID $_ on port $port"
      } catch {}
    }
}
Write-Host "Done." -ForegroundColor Green
