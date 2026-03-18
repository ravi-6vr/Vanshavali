@echo off
title Vanshavali - Family Tree
echo.
echo   ========================================
echo       Vanshavali - Family Tree App
echo   ========================================
echo.
echo   Starting app...
echo.
cd /d "%~dp0"
npm run electron:dev
pause
