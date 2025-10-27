# Quick script to restart the Docker server after email config

Write-Host "Restarting server..." -ForegroundColor Yellow
docker restart pla-server

Write-Host ""
Write-Host "Waiting for server to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Server restarted!" -ForegroundColor Green
Write-Host "Email should now be configured" -ForegroundColor Green
Write-Host ""
Write-Host "Try signing up at: http://localhost:5173"
