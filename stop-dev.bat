@echo off
title AlphaBAG - Stop Servers
color 0C

echo.
echo  Stopping AlphaBAG Dev Servers...
echo.

echo  Killing processes on port 3005...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":3005\>" ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
    echo  Killed PID %%a on port 3005
)

echo  Killing processes on port 3003...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":3003\>" ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
    echo  Killed PID %%a on port 3003
)

echo.
echo  All AlphaBAG servers stopped.
echo.
timeout /t 2 /nobreak >nul
