// @ts-nocheck
import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { requireAuth, getUser } from '../auth.js';

interface FieldConfig {
  id: number;
  entity: string;
  field: string;
  label: string;
  required: number;
  visible: number;
  sort_order: number;
  field_type: string;
  placeholder: string;
  validation_regex: string;
  min_length: number;
  max_length: number;
  options: string;
  is_custom: number;
}

export async function adminRoutes(app: FastifyInstance) {

  // GET /api/admin/field-config?entity=lead|client
  app.get('/field-config', { preHandler: requireAuth }, async (req) => {
    const { entity } = req.query as { entity?: string };
    if (entity) {
      return db.prepare(
        'SELECT * FROM field_config WHERE entity = ? ORDER BY sort_order, id'
      ).all(entity) as FieldConfig[];
    }
    return db.prepare(
      'SELECT * FROM field_config ORDER BY entity, sort_order, id'
    ).all() as FieldConfig[];
  });

  // PUT /api/admin/field-config — bulk update label/required/visible/type/validation (admin only)
  app.put('/field-config', { preHandler: requireAuth }, async (req, reply) => {
    const u = getUser(req);
    if (u.role !== 'admin') return reply.status(403).send({ error: 'Только администратор' });

    const { configs } = req.body as { configs: FieldConfig[] };
    if (!Array.isArray(configs)) return reply.status(400).send({ error: 'configs must be array' });

    const upd = db.prepare(`
      UPDATE field_config
      SET label = ?, required = ?, visible = ?, sort_order = ?,
          field_type = ?, placeholder = ?, validation_regex = ?,
          min_length = ?, max_length = ?, options = ?
      WHERE entity = ? AND field = ?
    `);
    for (const c of configs) {
      upd.run(
        c.label, c.required ? 1 : 0, c.visible ? 1 : 0, c.sort_order ?? 0,
        c.field_type || 'text', c.placeholder || '', c.validation_regex || '',
        c.min_length || 0, c.max_length || 0, c.options || '[]',
        c.entity, c.field
      );
    }
    return db.prepare('SELECT * FROM field_config ORDER BY entity, sort_order, id').all();
  });

  // POST /api/admin/field-config — create new custom field (admin only)
  app.post('/field-config', { preHandler: requireAuth }, async (req, reply) => {
    const u = getUser(req);
    if (u.role !== 'admin') return reply.status(403).send({ error: 'Только администратор' });

    const { entity, field, label, field_type = 'text', required = 0, visible = 1, placeholder = '', options = '[]' } = req.body as any;
    if (!entity || !field || !label) return reply.status(400).send({ error: 'entity, field, label обязательны' });
    // slug validation
    if (!/^[a-z0-9_]+$/.test(field)) return reply.status(400).send({ error: 'field — только a-z, 0-9, _' });

    const maxOrder = ((db.prepare('SELECT MAX(sort_order) as m FROM field_config WHERE entity = ?').get(entity) as any)?.m ?? 0);
    try {
      db.prepare(
        'INSERT INTO field_config (entity, field, label, required, visible, sort_order, field_type, placeholder, options, is_custom) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)'
      ).run(entity, field, label, required ? 1 : 0, visible ? 1 : 0, maxOrder + 1, field_type, placeholder, options);
    } catch (e: any) {
      if (e.message?.includes('UNIQUE')) return reply.status(409).send({ error: `Поле "${field}" уже существует для ${entity}` });
      throw e;
    }
    return db.prepare('SELECT * FROM field_config WHERE entity = ? ORDER BY sort_order, id').all(entity);
  });

  // DELETE /api/admin/field-config/:id — delete custom field only (admin only)
  app.delete('/field-config/:id', { preHandler: requireAuth }, async (req, reply) => {
    const u = getUser(req);
    if (u.role !== 'admin') return reply.status(403).send({ error: 'Только администратор' });

    const { id } = req.params as { id: string };
    const cfg = db.prepare('SELECT * FROM field_config WHERE id = ?').get(Number(id)) as FieldConfig | undefined;
    if (!cfg) return reply.status(404).send({ error: 'Не найдено' });
    if (!cfg.is_custom) return reply.status(400).send({ error: 'Встроенные поля удалить нельзя' });

    db.prepare('DELETE FROM field_config WHERE id = ?').run(Number(id));
    db.prepare('DELETE FROM custom_field_values WHERE entity = ? AND field = ?').run(cfg.entity, cfg.field);
    return { ok: true };
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
