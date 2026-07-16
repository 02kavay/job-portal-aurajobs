@echo off
title AuraJobs Launcher
echo =======================================
echo 🚀 Launching AuraJobs Local Servers...
echo =======================================
echo.

:: Start Backend API Server
echo [1/3] Starting Backend API on port 5000...
start "AuraJobs Backend API" cmd /k "cd /d %~dp0backend && npm start"

:: Start Frontend Next.js Server
echo [2/3] Starting Frontend Next.js Portal on port 3000...
start "AuraJobs Frontend Portal" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Wait 3 seconds to let servers spin up, then open browser
timeout /t 3 /nobreak >nul
echo [3/3] Opening site in browser...
start http://localhost:3000

echo.
echo =======================================
echo 🎉 AuraJobs is now running!
echo =======================================
timeout /t 5
