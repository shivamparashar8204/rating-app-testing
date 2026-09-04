@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FUNCTIONS_DIR=%ROOT%backend\functions"
set "FRONTEND_DIR=%ROOT%frontend"

echo Starting backend server...
start "Backend API" cmd /k "cd /d "%BACKEND_DIR%" && npm run dev"

echo Starting Firebase emulators...
start "Firebase Emulators" cmd /k "cd /d "%ROOT%" && firebase emulators:start"

echo Starting frontend...
start "Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo Services started.
echo   Backend API: http://localhost:5000
echo   Frontend: http://localhost:3000
echo   Firebase Emulator UI: http://localhost:4000
echo   Functions: http://localhost:5001
echo   Firestore: http://localhost:8080
echo   Auth: http://localhost:9099
endlocal
