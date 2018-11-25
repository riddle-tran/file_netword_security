cd /d %~dp0
del /f /s /q build >nul
rmdir /s /q build
mkdir build
call yarn build
