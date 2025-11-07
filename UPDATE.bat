@echo off
setlocal enabledelayedexpansion

REM ======================================================
REM Define paths relative to the script location
REM ======================================================
set "CURRENT_DIR=%~dp0"
if "%CURRENT_DIR:~-1%"=="\" set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"
set "GIT_PATH=%CURRENT_DIR%\resources\PortableGit\bin\git.exe"

REM ======================================================
REM Verify Portable Git path
REM ======================================================
echo Current directory: %CURRENT_DIR%
echo Checking Git path: %GIT_PATH%

if not exist "%GIT_PATH%" (
    echo ❌ Git executable not found at %GIT_PATH%
    pause
    exit /b 1
)

REM ======================================================
REM Run Git Pull
REM ======================================================
echo =====================================
echo Pulling latest code from repository...
echo =====================================
"%GIT_PATH%" pull
if errorlevel 1 (
    echo ❌ Git pull failed.
    pause
    exit /b 1
)

REM ======================================================
REM Install and Build
REM ======================================================
echo =====================================
echo Installing dependencies and building...
echo =====================================
call npm install
if errorlevel 1 (
    echo ❌ npm install failed.
    pause
    exit /b 1
)
call npm run build
if errorlevel 1 (
    echo ❌ npm run build failed.
    pause
    exit /b 1
)

REM ======================================================
REM Restart Service
REM ======================================================
echo =====================================
echo Restarting intraguard-service...
echo =====================================
npm run restart-service

echo =====================================
echo ✅ Process completed successfully!
echo =====================================

pause
endlocal