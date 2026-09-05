@echo off
title ClearFlow - Seed Database
set PATH=C:\Users\HP\nodejs;%PATH%

echo =======================================================
echo          Resetting and Seeding ClearFlow Database
echo =======================================================
echo.

node server/src/database/seed.js
echo.
echo Database successfully seeded!
pause
