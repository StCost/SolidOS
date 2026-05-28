@echo off
setlocal
cd /d "%~dp0"

title COLLAPSE MACHINE Web UI
echo.
echo   COLLAPSE MACHINE Web UI
echo   http://localhost:8765
echo   http://localhost:8765/Web%%20Main%%20Menu/index.html
echo.
echo   Press Ctrl+C to stop.
echo.

npx --yes serve . -p 8765
if errorlevel 1 (
  echo.
  echo Server exited with an error.
  pause
)
