@echo off
title AlphaBAG Dev Environment
color 0A
set "FRONTEND_DIR=%~dp0"
set "BACKEND_DIR=%~dp0..\alphabag_v3_backend"

echo.
echo  ============================================
echo   AlphaBAG V3 - Development Server Launcher
echo  ============================================
echo.

:: --- Kill any existing instances on the local app ports ---
echo [1/4] Clearing ports 3005 and 3003...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":3005\>" ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":3003\>" ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul
echo     Ports cleared.

:: --- Start Backend (Express on port 3003) ---
echo [2/4] Starting Backend API (port 3003)...
start "AlphaBAG Backend :3003" cmd /k "cd /d ""%BACKEND_DIR%"" && npm run dev"
timeout /t 3 /nobreak >nul
echo     Backend launched.

:: --- Start Frontend (Vite on port 3005) ---
echo [3/4] Starting Frontend Dev Server (port 3005)...
start "AlphaBAG Frontend :3005" cmd /k "cd /d ""%FRONTEND_DIR%"" && npm run dev"
timeout /t 5 /nobreak >nul
echo     Frontend launched.

:: --- Open browser ---
echo [4/4] Opening browser...
timeout /t 3 /nobreak >nul
start "" "http://localhost:3005"

echo.
echo  ============================================
echo   SERVERS RUNNING
echo   Frontend : http://localhost:3005
echo   Backend  : http://localhost:3003
echo   Admin    : http://localhost:3005/#/admin
echo  ============================================
echo.
echo  Close the server windows to stop servers.
echo  Or run stop-dev.bat to kill all instances.
echo.
