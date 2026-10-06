@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (
  echo Python launcher was not found. Install Python 3.10 or newer first.
  pause
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" py -3 -m venv .venv
call ".venv\Scripts\activate.bat"
pip install -r requirements.txt
if errorlevel 1 goto :error
python app.py --web --host 127.0.0.1 --port 8765
exit /b 0
:error
echo EchoDesk web preview could not start.
pause
exit /b 1
