// @ts-nocheck
import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import type { Task } from '@crm/types';

export async function taskRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAuth }, async () =>
    db.prepare('SELECT * FROM tasks ORDER BY done ASC, due ASC').all()
  );

  app.post('/', { preHandler: requireAuth }, async (req, reply) => {
    const b = req.body as Partial<Task>;
    if (!b.title) return reply.status(400).send({ error: 'Название обязательно' });
    const info = db.prepare('INSERT INTO tasks (title,client_id,client_name,type,priority,due,manager,comment) VALUES (?,?,?,?,?,?,?,?)')
      .run(b.title, b.client_id ?? null, b.client_name ?? '', b.type ?? 'call', b.priority ?? 'medium', b.due ?? '', b.manager ?? '', b.comment ?? '');
    return reply.status(201).send(db.prepare('SELECT * FROM tasks WHERE id = ?').get((info as { lastInsertRowid: number }).lastInsertRowid));
  });

  app.put('/:id', { preHandler: requireAuth }, async (req) => {
    const { id } = req.params as { id: string };
    const b = req.body as Partial<Task & { done: boolean }>;
    db.prepare(`UPDATE tasks SET done=COALESCE(?,done),title=COALESCE(?,title),type=COALESCE(?,type),priority=COALESCE(?,priority),due=COALESCE(?,due),manager=COALESCE(?,manager),comment=COALESCE(?,comment) WHERE id=?`)
      .run(b.done !== undefined ? (b.done ? 1 : 0) : null, b.title ?? null, b.type ?? null, b.priority ?? null, b.due ?? null, b.manager ?? null, b.comment ?? null, id);
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  });

  app.delete('/:id', { preHandler: requireAuth }, async (req) => {
    db.prepare('DELETE FROM tasks WHERE id = ?').run((req.params as { id: string }).id);
    return { ok: true };
  });
}
