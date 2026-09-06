@echo off
title GitHub Auto-Sync (anti-grav-resumeshot)
cd /d "%~dp0"
set PATH=%LOCALAPPDATA%\Programs\Git\cmd;%LOCALAPPDATA%\Programs\gh\bin;%PATH%
echo Starting GitHub Auto Synchronizer...
python auto_sync.py
pause
