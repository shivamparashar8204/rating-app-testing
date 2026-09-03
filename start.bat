@echo off
setlocal

set "ROOT=%~dp0"
set "FUNCTIONS_DIR=%ROOT%backend\functions"
set "FRONTEND_DIR=%ROOT%frontend"

echo Starting Firebase emulators...
start "Firebase Emulators" cmd /k "cd /d "%ROOT%" && firebase emulators:start"

echo Starting frontend...
start "Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo Services started.
echo   Frontend: http://localhost:3000
echo   Firebase Emulator UI: http://localhost:4000
echo   Functions: http://localhost:5001
echo   Firestore: http://localhost:8080
echo   Auth: http://localhost:9099
endlocal
