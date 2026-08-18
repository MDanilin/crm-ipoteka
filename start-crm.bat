@echo off
chcp 65001 > nul
echo.
echo  ╔══════════════════════════════════════╗
echo  ║   Ипотека Банк · Corporate CRM       ║
echo  ╚══════════════════════════════════════╝
echo.

:: Check Node
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ОШИБКА: Node.js не найден.
    echo  Скачайте: https://nodejs.org
    pause & exit /b 1
)

:: Install pnpm if missing
where pnpm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  Устанавливаю pnpm...
    call npm install -g pnpm
    if %ERRORLEVEL% NEQ 0 (
        echo  ОШИБКА установки pnpm
        pause & exit /b 1
    )
    echo  pnpm установлен.
    echo.
)

:: Install dependencies if missing
if not exist "apps\web\node_modules" (
    echo  Устанавливаю зависимости (первый запуск ~2-3 мин)...
    call pnpm install
    if %ERRORLEVEL% NEQ 0 (
        echo  ОШИБКА при установке зависимостей
        pause & exit /b 1
    )
    echo.
)

:: Reset DB if --reset flag or first run
if not exist "apps\api\crm.db" (
    echo  База данных будет создана автоматически.
    echo.
)

echo  Запуск серверов:
echo    API  →  http://localhost:3001
echo    Web  →  http://localhost:3000
echo.
echo  Телефоны для входа:
echo    +998 90 500-10-00  (admin)
echo    +998 90 500-10-01  (manager Каримов)
echo    +998 90 500-10-03  (supervisor Юсупова)
echo.
echo  Для остановки: Ctrl+C
echo.

call pnpm dev
pause
