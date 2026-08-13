import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { requireAuth, getUser } from '../auth.js';

export async function productCatalogRoutes(app: FastifyInstance) {
  // GET — all active items (all authenticated users)
  app.get('/', { preHandler: requireAuth }, async () =>
    db.prepare('SELECT * FROM product_catalog ORDER BY sort_order, name').all()
  );

  // POST — create item (admin only)
  app.post('/', { preHandler: requireAuth }, async (req, reply) => {
    const user = await getUser(req);
    if (user?.role !== 'admin') return reply.status(403).send({ error: 'Только администратор' });
    const { name, category, description, sort_order } = req.body as Record<string, string>;
    if (!name) return reply.status(400).send({ error: 'Название обязательно' });
    const info = db.prepare('INSERT INTO product_catalog (name,category,description,sort_order) VALUES (?,?,?,?)')
      .run(name, category ?? '', description ?? '', sort_order ? Number(sort_order) : 0);
    return reply.status(201).send(db.prepare('SELECT * FROM product_catalog WHERE id = ?').get((info as { lastInsertRowid: number }).lastInsertRowid));
  });

  // PUT — update item (admin only)
  app.put('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const user = await getUser(req);
    if (user?.role !== 'admin') return reply.status(403).send({ error: 'Только администратор' });
    const { id } = req.params as { id: string };
    const { name, category, description, is_active, sort_order } = req.body as Record<string, string>;
    db.prepare('UPDATE product_catalog SET name=COALESCE(?,name),category=COALESCE(?,category),description=COALESCE(?,description),is_active=COALESCE(?,is_active),sort_order=COALESCE(?,sort_order) WHERE id=?')
      .run(name ?? null, category ?? null, description ?? null, is_active != null ? Number(is_active) : null, sort_order ? Number(sort_order) : null, id);
    return db.prepare('SELECT * FROM product_catalog WHERE id = ?').get(id);
  });

  // DELETE — remove item (admin only)
  app.delete('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const user = await getUser(req);
    if (user?.role !== 'admin') return reply.status(403).send({ error: 'Только администратор' });
    const { id } = req.params as { id: string };
    db.prepare('DELETE FROM product_catalog WHERE id = ?').run(id);
    return { ok: true };
  });
}
