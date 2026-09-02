@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"

echo Starting backend...
start "Backend" cmd /k "cd /d "%BACKEND_DIR%" && npm run dev"

echo Starting frontend...
start "Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo Both services have been started.
endlocal
