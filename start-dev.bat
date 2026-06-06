@echo off
title AlphaBAG Dev Environment
color 0A

echo.
echo  ============================================
echo   AlphaBAG V3 - Development Server Launcher
echo  ============================================
echo.

:: --- Kill any existing instances on ports 3001, 3003, and 51213-51215 ---
echo [1/5] Clearing ports 3001, 3003, 51213, 51214, 51215...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":3001\>" ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":3003\>" ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":51213\>" ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":51214\>" ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":51215\>" ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul
echo     Ports cleared.

:: --- Start Database Server (Prisma Dev on port 51213) ---
echo [2/5] Starting local PostgreSQL Database...
start "AlphaBAG Database :51213" cmd /k "cd /d "%~dp0" && npx prisma dev"
timeout /t 5 /nobreak >nul
echo     Database launcher running.

:: --- Start Backend (Express on port 3003) ---
echo [3/5] Starting Backend API (port 3003)...
start "AlphaBAG Backend :3003" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 3 /nobreak >nul
echo     Backend launched.

:: --- Start Frontend (Vite on port 3001) ---
echo [4/5] Starting Frontend Dev Server (port 3001)...
start "AlphaBAG Frontend :3001" cmd /k "cd /d "%~dp0" && npm run dev"
timeout /t 5 /nobreak >nul
echo     Frontend launched.

:: --- Open browser ---
echo [5/5] Opening browser...
timeout /t 3 /nobreak >nul
start "" "http://localhost:3001"

echo.
echo  ============================================
echo   SERVERS RUNNING
echo   Database : http://localhost:51213 (Proxy)
echo   Frontend : http://localhost:3001
echo   Backend  : http://localhost:3003
echo   Admin    : http://localhost:3001/#/admin
echo  ============================================
echo.
echo  Close the server windows to stop servers.
echo  Or run stop-dev.bat to kill all instances.
echo.
pause
