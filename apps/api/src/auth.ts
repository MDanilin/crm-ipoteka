// @ts-nocheck
import type { FastifyRequest, FastifyReply } from 'fastify';
import { db } from './db.js';
import type { User } from '@crm/types';

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers['authorization'];
  const token  = header?.replace('Bearer ', '').trim();
  if (!token) return reply.status(401).send({ error: 'Не авторизован' });

  const session = db.prepare(
    "SELECT * FROM sessions WHERE token = ? AND (expires_at IS NULL OR expires_at > datetime('now'))"
  ).get(token) as { user_id: number } | undefined;
  if (!session) return reply.status(401).send({ error: 'Сессия истекла' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id) as User | undefined;
  if (!user) return reply.status(401).send({ error: 'Пользователь не найден' });
  if (user.status === 'inactive') return reply.status(403).send({ error: 'Учётная запись деактивирована' });

  (req as FastifyRequest & { user: User }).user = user;
}

export function requireRole(roles: string[]) {
  return async function(req: FastifyRequest, reply: FastifyReply) {
    await requireAuth(req, reply);
    if (reply.sent) return;
    const user = getUser(req);
    if (!roles.includes(user.role)) {
      return reply.status(403).send({ error: 'Нет доступа' });
    }
  };
}

export function getUser(req: FastifyRequest): User {
  return (req as FastifyRequest & { user: User }).user;
}
