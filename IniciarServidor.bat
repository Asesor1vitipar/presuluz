
@echo off
cd /d %~dp0
echo Iniciando servidor en http://localhost:8000 ...
"Portable Python-3.10.5 x64\App\Python\python.exe" -m http.server 8000
pause
