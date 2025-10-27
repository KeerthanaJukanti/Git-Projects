@echo off
echo 🔧 Passwordless Auth Troubleshooting Tool
echo ========================================
echo.

:menu
echo Choose an option:
echo 1. Check if ports are in use
echo 2. Kill processes on ports 4000 and 5173
echo 3. Check if MongoDB is running
echo 4. Test server health endpoint
echo 5. Check environment file
echo 6. Restart all services
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto check_ports
if "%choice%"=="2" goto kill_ports
if "%choice%"=="3" goto check_mongo
if "%choice%"=="4" goto test_health
if "%choice%"=="5" goto check_env
if "%choice%"=="6" goto restart_all
if "%choice%"=="7" goto exit
goto menu

:check_ports
echo.
echo 🔍 Checking ports 4000 and 5173...
echo.
echo Port 4000 (Server):
netstat -ano | findstr :4000
echo.
echo Port 5173 (Client):
netstat -ano | findstr :5173
echo.
pause
goto menu

:kill_ports
echo.
echo ⚠️  Killing processes on ports 4000 and 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    taskkill /PID %%a /F 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    taskkill /PID %%a /F 2>nul
)
echo ✅ Processes killed
pause
goto menu

:check_mongo
echo.
echo 📊 Checking MongoDB...
curl -s http://localhost:27017 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB is running
) else (
    echo ❌ MongoDB is not running
    echo.
    echo To start MongoDB:
    echo 1. Install MongoDB locally and start the service
    echo 2. Use Docker: docker run -d --name mongodb -p 27017:27017 mongo:7
    echo 3. Use MongoDB Atlas and update MONGODB_URI in server\.env
)
pause
goto menu

:test_health
echo.
echo 🏥 Testing server health endpoint...
curl -s http://localhost:4000/health
if %errorlevel% equ 0 (
    echo.
    echo ✅ Server is responding
) else (
    echo ❌ Server is not responding
    echo Make sure the server is running: cd server && npm run dev
)
pause
goto menu

:check_env
echo.
echo 📝 Checking environment file...
if exist server\.env (
    echo ✅ Environment file exists
    echo.
    echo Current configuration:
    type server\.env
) else (
    echo ❌ Environment file missing
    echo Run setup.bat to create it
)
pause
goto menu

:restart_all
echo.
echo 🔄 Restarting all services...
echo.
echo Stopping existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do (
    taskkill /PID %%a /F 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    taskkill /PID %%a /F 2>nul
)
echo.
echo Starting services...
start "Server" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak >nul
start "Client" cmd /k "cd client && npm run dev"
echo.
echo ✅ Services restarted
pause
goto menu

:exit
echo.
echo 👋 Goodbye!
pause
exit
