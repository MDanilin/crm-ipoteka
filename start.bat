@echo off
chcp 65001 > nul
echo.
echo  CRM Ipoteka Bank — Запуск...
echo.

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ОШИБКА: Node.js не установлен.
    echo  Скачайте с https://nodejs.org
    pause
    exit /b
)

if not exist node_modules (
    echo  Установка зависимостей...
    npm install
    echo.
)

echo  Сервер запускается на http://localhost:3001
echo  Для остановки нажмите Ctrl+C
echo.
start "" http://localhost:3001
node server.js
pause
