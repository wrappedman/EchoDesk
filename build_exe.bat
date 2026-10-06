@echo off
setlocal
cd /d "%~dp0"
set "APP_VERSION=1.0.5"
set "ICON_FILE=%~dp0web\assets\echodesk-icon.ico"

where py >nul 2>nul
if errorlevel 1 (
  echo Python launcher was not found. Install Python 3.10 or newer first.
  pause
  exit /b 1
)
if not exist "%ICON_FILE%" (
  echo Windows icon file not found: "%ICON_FILE%"
  pause
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" (
  echo Creating the build environment...
  py -3 -m venv .venv
  if errorlevel 1 goto :error
)
call ".venv\Scripts\activate.bat"
python -m pip install --upgrade pip
if errorlevel 1 goto :error
python -m pip install -r requirements.txt
if errorlevel 1 goto :error
if not exist "%~dp0build" mkdir "%~dp0build"
if not exist "%~dp0dist" mkdir "%~dp0dist"

echo.
echo Building EchoDesk.exe and embedding:
echo "%ICON_FILE%"
python -m PyInstaller --noconfirm --clean --onefile --windowed --name EchoDesk --icon "%ICON_FILE%" --add-data "%~dp0web;web" --collect-all webview --collect-all mutagen --distpath "%~dp0dist" --workpath "%~dp0build" --specpath "%~dp0build" "%~dp0app.py"
if errorlevel 1 goto :error
if not exist "%~dp0dist\EchoDesk.exe" goto :error
copy /y "%~dp0dist\EchoDesk.exe" "%~dp0dist\EchoDesk-%APP_VERSION%.exe" >nul
if errorlevel 1 goto :error

echo.
echo Build complete: %~dp0dist\EchoDesk.exe
echo Versioned copy: %~dp0dist\EchoDesk-%APP_VERSION%.exe
echo The ICO above is passed directly to PyInstaller for both EXE files.
echo User data is stored separately in %%APPDATA%%\EchoDesk.
pause
exit /b 0
:error
echo.
echo Build failed. Read the error above and confirm Python 3.10+ and Edge WebView2 Runtime are installed.
pause
exit /b 1
