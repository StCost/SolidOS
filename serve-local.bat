@echo off
setlocal EnableExtensions
cd /d "%~dp0"

title COLLAPSE MACHINE Web UI
echo.
echo   COLLAPSE MACHINE Web UI
echo   http://localhost:8765
echo   http://localhost:8765/Web%%20Main%%20Menu/index.html
echo.
echo   Press Ctrl+C to stop.
echo.

set "NODE_EXE="
set "NPX_CMD="

where node >nul 2>&1
if not errorlevel 1 (
  set "NODE_EXE=node"
  where npx >nul 2>&1
  if not errorlevel 1 set "NPX_CMD=npx"
)

if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" (
  set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
  if exist "%ProgramFiles%\nodejs\npx.cmd" set "NPX_CMD=%ProgramFiles%\nodejs\npx.cmd"
)

if not defined NODE_EXE if exist "%LOCALAPPDATA%\Programs\node\node.exe" (
  set "NODE_EXE=%LOCALAPPDATA%\Programs\node\node.exe"
  if exist "%LOCALAPPDATA%\Programs\node\npx.cmd" set "NPX_CMD=%LOCALAPPDATA%\Programs\node\npx.cmd"
)

if not defined NODE_EXE if exist "%ProgramFiles%\cursor\resources\app\resources\helpers\node.exe" (
  set "NODE_EXE=%ProgramFiles%\cursor\resources\app\resources\helpers\node.exe"
)

if not defined NODE_EXE (
  echo Node.js was not found. Install from https://nodejs.org/ or run from a shell where node is on PATH.
  echo.
  pause
  exit /b 1
)

if defined NPX_CMD (
  "%NPX_CMD%" --yes serve . -p 8765
  if not errorlevel 1 exit /b 0
  echo.
  echo npx serve failed, using built-in static server...
  echo.
)

"%NODE_EXE%" "%~dp0serve-local-server.js"
if errorlevel 1 (
  echo.
  echo Server exited with an error.
  pause
  exit /b 1
)
