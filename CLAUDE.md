# CRM Ipoteka — Project Guide

## Стек
- **Монорепо**: TurboRepo — `apps/web` (Next.js 15 App Router) + `apps/api` (Fastify + better-sqlite3)
- **БД**: SQLite — `apps/api/crm.db`, миграции через `try { db.exec("ALTER TABLE...") } catch {}`
- **Пакетный менеджер**: pnpm
- **Стейт**: Zustand (`crm-auth` в localStorage) + React Query
- **Стили**: Tailwind CSS + `globals.css` (классы `.crm-table`, `.status-select`, `.form-input`)
- **GitHub**: https://github.com/MDanilin/crm-ipoteka.git

## Сервер (продакшн)
- **IP**: `89.19.214.73`
- **SSH**: `root@89.19.214.73`
- **Проект**: `/var/www/crm`
- **Nginx**: `/etc/nginx/conf.d/crm.conf` — проксирует 80 → 3000 (web) и /api/ → 3001 (api)
- **PM2**: `crm-web` (порт 3000) + `crm-api` (порт 3001)

## Команда деплоя (единственная правильная)
```bash
# 1. Тянем код (сбрасываем БД чтобы git pull не конфликтовал — живые данные остаются)
cd /var/www/crm && git checkout -- apps/api/crm.db apps/api/crm.db-shm apps/api/crm.db-wal && git pull origin master

# 2. Собираем и перезапускаем фронт
cd /var/www/crm/apps/web && pm2 stop crm-web && fuser -k 3000/tcp && sleep 1 && NODE_OPTIONS="--max-old-space-size=400" ./node_modules/.bin/next build && pm2 start crm-web
```

## КРИТИЧЕСКИЕ ПРАВИЛА
- **НИКОГДА** не запускать `pnpm install` в корне на сервере — вызывает полный аутаж
- `NODE_OPTIONS="--max-old-space-size=400"` — сервер с ограниченной памятью, без этого build падает
- БД на сервере — живые данные, никогда не перезаписывать из git

## Авторизация (локальная разработка)
- Admin телефон: `+998 90 500-10-00` (Сарвар Тошматов)
- OTP flow: POST `/api/auth/send-otp` → получить `dev_otp` → POST `/api/auth/verify-otp` с полем `code`
- После получения токена — вставить в оба ключа localStorage: `crm_token` и `crm-auth`

## Локальный запуск
- Web: `pnpm --filter @crm/web dev` → порт 3000
- API: `pnpm --filter @crm/api dev` → порт 3001
- Или через `.claude/launch.json` в браузере

## Архитектура доступа
- `admin`, `supervisor`, `analyst` — видят всех клиентов
- Остальные роли — фильтруются по `block` и `branch` из таблицы `users`
- Блоки: MSE, Middle, Large, Int
