@echo off
setlocal
cd /d "%~dp0"
echo Iniciando XZ Audio Visualizer en http://localhost:8000
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8000"
  py -m http.server 8000
  goto :end
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8000"
  python -m http.server 8000
  goto :end
)
echo ERROR: No se encontro Python. Instala Python 3 o abre la carpeta con VS Code y usa Live Server.
pause
:end
endlocal
