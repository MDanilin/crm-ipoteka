import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import type { Deal } from '@crm/types';

export async function pipelineRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAuth }, async () =>
    db.prepare('SELECT * FROM pipeline ORDER BY probability DESC').all()
  );
  app.get('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const deal = db.prepare('SELECT * FROM pipeline WHERE id = ?').get(id);
    if (!deal) return reply.status(404).send({ error: 'Не найдено' });
    return deal;
  });
  app.post('/', { preHandler: requireAuth }, async (req, reply) => {
    const b = req.body as Partial<Deal>;
    if (!b.client_name) return reply.status(400).send({ error: 'Клиент обязателен' });
    const info = db.prepare('INSERT INTO pipeline (client_name,client_id,product,product_id,stage,amount,amount_raw,probability,manager,close_date) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(b.client_name, b.client_id ?? null, b.product ?? '', b.product_id ?? null, b.stage ?? 'qualification', b.amount ?? '', parseFloat(String(b.amount_raw)) || 0, parseInt(String(b.probability)) || 50, b.manager ?? '', b.close_date ?? '');
    return reply.status(201).send(db.prepare('SELECT * FROM pipeline WHERE id = ?').get((info as { lastInsertRowid: number }).lastInsertRowid));
  });
  app.put('/:id', { preHandler: requireAuth }, async (req) => {
    const { id } = req.params as { id: string };
    const b = req.body as Partial<Deal>;
    db.prepare(`UPDATE pipeline SET stage=COALESCE(?,stage),probability=COALESCE(?,probability),amount=COALESCE(?,amount),close_date=COALESCE(?,close_date) WHERE id=?`)
      .run(b.stage ?? null, b.probability !== undefined ? parseInt(String(b.probability)) : null, b.amount ?? null, b.close_date ?? null, id);
    return db.prepare('SELECT * FROM pipeline WHERE id = ?').get(id);
  });
  app.delete('/:id', { preHandler: requireAuth }, async (req) => {
    db.prepare('DELETE FROM pipeline WHERE id = ?').run((req.params as { id: string }).id);
    return { ok: true };
  });
}
