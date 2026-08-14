// @ts-nocheck
import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { requireAuth, getUser } from '../auth.js';

function getAll() {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

export async function settingsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAuth }, async () => getAll());

  app.put('/', { preHandler: requireAuth }, async (req, reply) => {
    const u = getUser(req);
    if (u.role !== 'admin') return reply.status(403).send({ error: 'Только администратор' });

    const allowed = ['bank_name', 'bank_short', 'sla_hours', 'city'];
    const body = req.body as Record<string, string>;

    const upd = db.prepare(
      "UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?"
    );
    for (const key of allowed) {
      if (body[key] !== undefined) upd.run(String(body[key]).trim(), key);
    }
    return getAll();
  });
}
