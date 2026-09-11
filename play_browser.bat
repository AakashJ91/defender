@echo off
echo ========================================================
echo Starting Frontier Defense Dev Server (Ports 8080 & 8090)
echo ========================================================
start http://localhost:8080
node server.js
if %ERRORLEVEL% NEQ 0 (
    python -m http.server 8080 --directory web
)
pause
