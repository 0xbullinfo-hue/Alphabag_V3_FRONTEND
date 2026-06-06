@echo off
title AlphaBAG - Stop Servers
color 0C

echo.
echo  Stopping AlphaBAG Dev Servers...
echo.

echo  Killing processes on port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":3001\>" ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
    echo  Killed PID %%a on port 3001
)

echo  Killing processes on port 3003...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":3003\>" ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
    echo  Killed PID %%a on port 3003
)

echo  Killing database processes (ports 51213, 51214, 51215)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":51213\>" ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
    echo  Killed PID %%a on port 51213
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":51214\>" ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
    echo  Killed PID %%a on port 51214
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":51215\>" ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
    echo  Killed PID %%a on port 51215
)

echo.
echo  All AlphaBAG servers stopped.
echo.
timeout /t 2 /nobreak >nul
