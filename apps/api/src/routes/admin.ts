// @ts-nocheck
import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { requireAuth, getUser } from '../auth.js';

interface FieldConfigRow {
  id: number;
  entity: string;
  field: string;
  label: string;
  required: number;
  visible: number;
  sort_order: number;
}

export async function adminRoutes(app: FastifyInstance) {

  // GET /api/admin/field-config?entity=lead|client
  app.get('/field-config', { preHandler: requireAuth }, async (req) => {
    const { entity } = req.query as { entity?: string };
    if (entity) {
      return db.prepare(
        'SELECT * FROM field_config WHERE entity = ? ORDER BY sort_order, id'
      ).all(entity) as FieldConfigRow[];
    }
    return db.prepare(
      'SELECT * FROM field_config ORDER BY entity, sort_order, id'
    ).all() as FieldConfigRow[];
  });

  // PUT /api/admin/field-config — bulk update (admin only)
  app.put('/field-config', { preHandler: requireAuth }, async (req, reply) => {
    const u = getUser(req);
    if (u.role !== 'admin') return reply.status(403).send({ error: 'Только администратор' });

    const { configs } = req.body as {
      configs: { entity: string; field: string; label: string; required: boolean; visible: boolean }[];
    };
    if (!Array.isArray(configs)) return reply.status(400).send({ error: 'configs must be array' });

    const upd = db.prepare(
      'UPDATE field_config SET label = ?, required = ?, visible = ? WHERE entity = ? AND field = ?'
    );
    for (const c of configs) {
      upd.run(c.label, c.required ? 1 : 0, c.visible ? 1 : 0, c.entity, c.field);
    }
    return db.prepare('SELECT * FROM field_config ORDER BY entity, sort_order, id').all();
  });

  // GET /api/admin/companies — all clients with their bank products
  app.get('/companies', { preHandler: requireAuth }, async (req, reply) => {
    const u = getUser(req);
    if (!['admin', 'supervisor', 'analyst'].includes(u.role)) {
      return reply.status(403).send({ error: 'Нет доступа' });
    }

    const rows = db.prepare(`
      SELECT
        c.id, c.name, c.short_name, c.type, c.inn, c.industry,
        c.city, c.manager, c.status, c.segment, c.risk_level,
        c.credit_limit, c.revenue, c.created_at,
        COUNT(p.id) AS products_count,
        CASE WHEN COUNT(p.id) > 0
          THEN json_group_array(json_object(
            'id',        p.id,
            'name',      p.name,
            'number',    p.number,
            'limit_val', p.limit_val,
            'used_val',  p.used_val,
            'rate',      p.rate,
            'status',    p.status,
            'opened',    p.opened,
            'expires',   p.expires
          ))
          ELSE '[]'
        END AS products_json
      FROM clients c
      LEFT JOIN products p ON p.client_id = c.id
      GROUP BY c.id
      ORDER BY c.name
    `).all() as any[];

    return rows.map(r => ({
      ...r,
      products: JSON.parse(r.products_json || '[]'),
      products_json: undefined,
    }));
  });
}
