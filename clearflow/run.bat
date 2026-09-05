@echo off
title ClearFlow - AI-Powered Payment Revenue Recovery Platform
set PATH=C:\Users\HP\nodejs;%PATH%

echo =======================================================
echo          Starting ClearFlow Platform Server
echo =======================================================
echo Base URL: http://localhost:5000
echo.

node server/src/server.js
pause
