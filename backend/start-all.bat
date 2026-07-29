@echo off
REM Convenience launcher for AgriLink - runs start-all.ps1 without changing
REM the machine's PowerShell execution policy. Double-click or run from cmd.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-all.ps1" %*
