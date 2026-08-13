// @ts-nocheck
import type { FastifyInstance } from 'fastify';
import { db, verifyPassword } from '../db.js';
import { requireAuth, getUser } from '../auth.js';
import crypto from 'crypto';
import type { User } from '@crm/types';

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function findUserByPhone(phone: string): (User & { password: string }) | undefined {
  const n = normalizePhone(phone);
  return db.prepare(`
    SELECT * FROM users
    WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone,'+',''),' ',''),'-',''),'(','') = ?
  `).get(n) as (User & { password: string }) | undefined;
}

// In-memory rate limiter: max 5 attempts per key per 15 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function authRoutes(app: FastifyInstance) {

  // ── OTP: request code ──────────────────────────────────────────────────────
  app.post('/send-otp', async (req, reply) => {
    const { phone } = req.body as { phone?: string };
    if (!phone) return reply.status(400).send({ error: 'Укажите номер телефона' });

    const ip = req.ip;
    if (!checkRateLimit(`otp:${ip}:${normalizePhone(phone)}`)) {
      return reply.status(429).send({ error: 'Слишком много запросов. Попробуйте через 15 минут' });
    }

    const user = findUserByPhone(phone);
    if (!user) return reply.status(404).send({ error: 'Номер не найден в системе' });
    if (user.status === 'inactive') return reply.status(403).send({ error: 'Учётная запись деактивирована' });

    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60;

    db.prepare("UPDATE otps SET used = 1 WHERE phone = ? AND used = 0").run(normalizePhone(phone));
    db.prepare("INSERT INTO otps (phone, code, expires_at) VALUES (?, ?, ?)").run(normalizePhone(phone), code, expiresAt);

    const response: Record<string, unknown> = { success: true };
    if (process.env.NODE_ENV !== 'production') {
      response.dev_otp = code;
    }
    return response;
  });

  // ── OTP: verify code ───────────────────────────────────────────────────────
  app.post('/verify-otp', async (req, reply) => {
    const { phone, code } = req.body as { phone?: string; code?: string };
    if (!phone || !code) return reply.status(400).send({ error: 'Укажите телефон и код' });

    const ip = req.ip;
    if (!checkRateLimit(`verify:${ip}:${normalizePhone(phone)}`)) {
      return reply.status(429).send({ error: 'Слишком много запросов. Попробуйте через 15 минут' });
    }

    const now = Math.floor(Date.now() / 1000);
    const otp = db.prepare(
      "SELECT * FROM otps WHERE phone = ? AND code = ? AND used = 0 AND expires_at > ? ORDER BY id DESC LIMIT 1"
    ).get(normalizePhone(phone), code, now) as { id: number } | undefined;

    if (!otp) return reply.status(401).send({ error: 'Неверный или устаревший код' });

    db.prepare("UPDATE otps SET used = 1 WHERE id = ?").run(otp.id);

    const user = findUserByPhone(phone);
    if (!user) return reply.status(404).send({ error: 'Пользователь не найден' });

    const token = crypto.randomBytes(32).toString('hex');
    db.prepare(
      "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+8 hours'))"
    ).run(token, user.id);
    db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

    const { password: _, ...safe } = user;
    return { token, user: safe };
  });

  // ── Password login (admin / dev fallback) ──────────────────────────────────
  app.post('/login', async (req, reply) => {
    const { login, password } = req.body as { login: string; password: string };
    if (!login || !password) return reply.status(400).send({ error: 'Укажите логин и пароль' });

    const ip = req.ip;
    if (!checkRateLimit(`login:${ip}:${login}`)) {
      return reply.status(429).send({ error: 'Слишком много попыток. Попробуйте через 15 минут' });
    }

    const user = db.prepare('SELECT * FROM users WHERE login = ?').get(login) as (User & { password: string }) | undefined;
    if (!user || !verifyPassword(user.password, password)) {
      return reply.status(401).send({ error: 'Неверный логин или пароль' });
    }
    if (user.status === 'inactive') return reply.status(403).send({ error: 'Учётная запись деактивирована' });

    const token = crypto.randomBytes(32).toString('hex');
    db.prepare(
      "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+8 hours'))"
    ).run(token, user.id);
    db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

    const { password: _, ...safe } = user;
    return { token, user: safe };
  });

  // ── Me ─────────────────────────────────────────────────────────────────────
  app.get('/me', { preHandler: requireAuth }, async (req) => {
    const u = getUser(req) as User & { password?: string };
    const { password: _, ...safe } = u;
    return safe;
  });

  // ── Logout ─────────────────────────────────────────────────────────────────
  app.post('/logout', { preHandler: requireAuth }, async (req) => {
    const token = req.headers['authorization']?.replace('Bearer ', '').trim();
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return { ok: true };
  });
}
