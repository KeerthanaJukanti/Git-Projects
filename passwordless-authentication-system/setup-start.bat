@echo off
title Passwordless Auth - Setup & Start
color 0A

:main
cls
echo ================================================================================
echo                    PASSWORDLESS AUTHENTICATION SYSTEM
echo                        Setup and Development Starter
echo ================================================================================
echo.
echo Choose an option:
echo.
echo   1. Quick Setup (First time setup)
echo   2. Start Development Menu
echo   3. Exit
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" goto setup
if "%choice%"=="2" goto start_menu
if "%choice%"=="3" goto end
echo Invalid choice. Please try again.
timeout /t 2 /nobreak >nul
goto main

:setup
cls
echo ================================================================================
echo                           QUICK SETUP
echo ================================================================================
echo.

REM Check if .env already exists
if exist "server\.env" (
    echo ⚠️  Server environment file already exists!
    set /p overwrite="Do you want to overwrite it? (y/N): "
    if /i not "%overwrite%"=="y" (
        echo Setup cancelled.
        timeout /t 2 /nobreak >nul
        goto main
    )
)

echo 📝 Creating server environment file...

REM Create environment file
(
echo # Email Configuration
echo EMAIL_FROM=your-email@gmail.com
echo EMAIL_USER=your-email@gmail.com
echo EMAIL_PASS=your-app-password
echo.
echo # Database Configuration
echo MONGODB_URI=mongodb://localhost:27017/passwordless-auth
echo.
echo # Application URLs
echo APP_URL=http://localhost:5173
echo API_URL=http://localhost:4000
echo.
echo # JWT Configuration
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random
echo TOKEN_EXPIRY_MINUTES=15
echo.
echo # Server Configuration
echo PORT=4000
echo NODE_ENV=development
) > server\.env

echo ✅ Server environment file created at server\.env

REM Check if node_modules exists
if exist "server\node_modules" (
    echo 📦 Server dependencies already installed. Skipping...
) else (
    echo 📦 Installing server dependencies...
    cd server
    call npm install
    cd ..
)

if exist "client\node_modules" (
    echo 📦 Client dependencies already installed. Skipping...
) else (
    echo 📦 Installing client dependencies...
    cd client
    call npm install
    cd ..
)

echo.
echo ================================================================================
echo 🎉 Setup complete!
echo ================================================================================
echo.
echo ⚠️  IMPORTANT: Update server\.env with your email credentials
echo.
echo Gmail Setup:
echo  1. Enable 2-factor authentication on your Google account
echo  2. Go to: https://myaccount.google.com/apppasswords
echo  3. Generate an App Password for Mail
echo  4. Use the App Password as EMAIL_PASS in server\.env
echo.
pause
goto main

:start_menu
cls
echo ================================================================================
echo                      DEVELOPMENT START MENU
echo ================================================================================
echo.
echo Choose an option:
echo.
echo   1. Start Server + MongoDB only (Docker)
echo   2. Start Client only (Docker)
echo   3. Start Both locally (Server + Client)
echo   4. Start All with Docker Compose
echo   5. Back to Main Menu
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto start_server
if "%choice%"=="2" goto start_client
if "%choice%"=="3" goto start_both
if "%choice%"=="4" goto start_docker
if "%choice%"=="5" goto main
echo Invalid choice. Please try again.
timeout /t 2 /nobreak >nul
goto start_menu

:start_server
cls
echo ================================================================================
echo Starting Server + MongoDB with Docker...
echo ================================================================================
echo.
docker-compose -f docker-compose.server.yml up --build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to start Docker services
    echo.
    pause
)
goto start_menu

:start_client
cls
echo ================================================================================
echo Starting Client with Docker...
echo ================================================================================
echo.
docker-compose -f docker-compose.client.yml up --build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to start Docker services
    echo.
    pause
)
goto start_menu

:start_both
cls
echo ================================================================================
echo Starting both services locally...
echo ================================================================================
echo.

REM Start MongoDB in background
echo Starting MongoDB...
docker-compose up -d mongo 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Could not start MongoDB with Docker
    echo Assuming MongoDB is running locally...
) else (
    echo ✅ MongoDB started
    timeout /t 3 /nobreak >nul
)

REM Start Server
echo Starting Server...
cd server
start "Passwordless Auth - Server [http://localhost:4000]" cmd /k "echo Starting Server... && npm run dev"
cd ..
timeout /t 3 /nobreak >nul

REM Start Client
echo Starting Client...
cd client
start "Passwordless Auth - Client [http://localhost:5173]" cmd /k "echo Starting Client... && npm run dev"
cd ..

echo.
echo ================================================================================
echo Services started!
echo ================================================================================
echo.
echo 📱 Client: http://localhost:5173
echo 🔧 Server: http://localhost:4000
echo 📊 Health: http://localhost:4000/health
echo.
echo Services are running in separate windows.
echo Close those windows to stop the services.
echo.
pause
goto start_menu

:start_docker
cls
echo ================================================================================
echo Starting all services with Docker Compose...
echo ================================================================================
echo.
docker-compose up --build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to start Docker services
    echo.
    pause
)
goto start_menu

:end
cls
echo.
echo Thank you for using Passwordless Authentication System!
echo.
timeout /t 2 /nobreak >nul
exit
