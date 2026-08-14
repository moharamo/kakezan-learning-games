@echo off
setlocal
set "PROJECT_ROOT=%~dp0.."
set "BUNDLED_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
pushd "%PROJECT_ROOT%"
where node >nul 2>nul
if %errorlevel%==0 (
  node --test
) else if exist "%BUNDLED_NODE%" (
  "%BUNDLED_NODE%" --test
) else (
  echo Node.js 20 or later is required.
  exit /b 1
)
popd

