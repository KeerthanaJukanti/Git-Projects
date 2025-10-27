# PowerShell script to start the application with Docker
Write-Host "Starting Passwordless Auth Application with Docker..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "Docker is running. Starting with Docker Compose..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check if .env.docker exists
    if (-not (Test-Path ".env.docker")) {
        Write-Host "Creating .env.docker from env.example..." -ForegroundColor Yellow
        Copy-Item "env.example" ".env.docker"
        
        # Generate secure JWT secrets
        $jwtAccessSecret = -join ((1..64) | ForEach {Get-Random -InputObject @('a','b','c','d','e','f','0','1','2','3','4','5','6','7','8','9')})
        $jwtRefreshSecret = -join ((1..64) | ForEach {Get-Random -InputObject @('a','b','c','d','e','f','0','1','2','3','4','5','6','7','8','9')})
        
        $envContent = Get-Content ".env.docker" -Raw
        $envContent = $envContent -replace "JWT_ACCESS_SECRET=your-super-secret-access-key-change-this-in-production", "JWT_ACCESS_SECRET=$jwtAccessSecret"
        $envContent = $envContent -replace "JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production", "JWT_REFRESH_SECRET=$jwtRefreshSecret"
        $envContent = $envContent -replace "MONGODB_URI=mongodb://localhost:27017/passwordless-auth", "MONGODB_URI=mongodb://pla-mongo:27017/passwordless-auth"
        Set-Content ".env.docker" $envContent
        
        Write-Host "✅ Created .env.docker with secure JWT secrets" -ForegroundColor Green
    }
    
    Write-Host "Building and starting all services..." -ForegroundColor Yellow
    docker-compose up --build
    
    Write-Host ""
    Write-Host "Services stopped." -ForegroundColor Red
}
catch {
    Write-Host "Docker is not running or not installed." -ForegroundColor Red
    Write-Host "Please install Docker Desktop and try again." -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
