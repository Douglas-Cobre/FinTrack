@echo off
set SERVER_PORT=8081
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-backend.ps1"
