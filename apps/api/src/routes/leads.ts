// @ts-nocheck
import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { requireAuth, getUser } from '../auth.js';
import type { Lead, LeadActivity } from '@crm/types';

function pickManagerRoundRobin(): string {
  const managers = db.prepare("SELECT name FROM users WHERE role='manager' AND status='active' ORDER BY clients_count ASC, id ASC LIMIT 1").get() as { name: string } | undefined;
  return managers?.name ?? '';
}

type LeadRow = Lead & { inn: string; branch: string; agent_name: string; stage_times: string; amount: number; lost_reason: string };

function insertLead(b: Partial<LeadRow>, stage_times: string) {
  return db.prepare(
    'INSERT INTO leads (name,contact,phone,inn,source,branch,agent_name,status,product,amount,manager,stage_times) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
  ).run(
    b.name ?? '', b.contact ?? '', b.phone ?? '', b.inn ?? '', b.source ?? 'inbound',
    b.branch ?? '', b.agent_name ?? '', b.status ?? 'new', b.product ?? '',
    b.amount ?? 0, b.manager ?? '', stage_times
  );
}

export async function leadRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAuth }, async () =>
    db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all()
  );

  // Duplicate check — used by DSA PWA before submission
  app.get('/check', { preHandler: requireAuth }, async (req) => {
    const { inn, phone } = req.query as { inn?: string; phone?: string };
    const byInn   = inn?.trim()   ? db.prepare("SELECT id, name FROM leads WHERE inn = ? AND inn != ''").get(inn.trim())   as { id: number; name: string } | null : null;
    const byPhone = phone?.trim() ? db.prepare("SELECT id, name FROM leads WHERE phone = ? AND phone != ''").get(phone.trim()) as { id: number; name: string } | null : null;
    return { inn_duplicate: byInn ?? null, phone_duplicate: byPhone ?? null };
  });

  app.post('/', { preHandler: requireAuth }, async (req, reply) => {
    const b = req.body as Partial<LeadRow>;
    if (!b.name) return reply.status(400).send({ error: 'Название обязательно' });
    if (b.inn?.trim()) {
      const dup = db.prepare("SELECT id, name FROM leads WHERE inn = ? AND inn != ''").get(b.inn.trim()) as { id: number; name: string } | undefined;
      if (dup) return reply.status(409).send({ error: `Дублирующий ИНН: лид «${dup.name}» (ID ${dup.id}) уже зарегистрирован с этим ИНН`, duplicate_id: dup.id });
    }
    // Auto-assign manager for DSA leads
    if (b.source === 'dsa' && !b.manager) b.manager = pickManagerRoundRobin();
    const info = insertLead(b, JSON.stringify({ new: new Date().toISOString() }));
    return reply.status(201).send(db.prepare('SELECT * FROM leads WHERE id = ?').get((info as { lastInsertRowid: number }).lastInsertRowid));
  });

  // Public endpoint — no auth, used by agent link form
  app.post('/public', async (req, reply) => {
    const b = req.body as Partial<LeadRow>;
    if (!b.name) return reply.status(400).send({ error: 'Название обязательно' });
    if (!b.agent_name) return reply.status(400).send({ error: 'Имя агента обязательно' });
    if (b.inn?.trim()) {
      const dup = db.prepare("SELECT id, name FROM leads WHERE inn = ? AND inn != ''").get(b.inn.trim()) as { id: number; name: string } | undefined;
      if (dup) return reply.status(409).send({ error: `Дублирующий ИНН: лид «${dup.name}» уже зарегистрирован`, duplicate_id: dup.id });
    }
    const body: Partial<LeadRow> = { ...b, source: 'agent' };
    const info = insertLead(body, JSON.stringify({ new: new Date().toISOString() }));
    return reply.status(201).send({ ok: true, id: (info as { lastInsertRowid: number }).lastInsertRowid });
  });

  app.get('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
    if (!lead) return reply.status(404).send({ error: 'Лид не найден' });
    const activities = db.prepare('SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at ASC').all(id);
    const transfers  = db.prepare('SELECT * FROM lead_transfers WHERE lead_id = ? ORDER BY created_at ASC').all(id);
    return { ...(lead as object), activities, transfers };
  });

  app.put('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const b = req.body as Partial<LeadRow>;
    const existing = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as LeadRow | undefined;
    if (!existing) return reply.status(404).send({ error: 'Лид не найден' });

    let st = existing.stage_times || '{}';
    if (b.status && b.status !== existing.status) {
      try { const o = JSON.parse(st) as Record<string,string>; o[b.status] = new Date().toISOString(); st = JSON.stringify(o); }
      catch { st = JSON.stringify({ [b.status]: new Date().toISOString() }); }
    }
    db.prepare(`UPDATE leads SET
      name=COALESCE(?,name), contact=COALESCE(?,contact), phone=COALESCE(?,phone),
      inn=COALESCE(?,inn), source=COALESCE(?,source), branch=COALESCE(?,branch),
      agent_name=COALESCE(?,agent_name), status=COALESCE(?,status),
      product=COALESCE(?,product), amount=COALESCE(?,amount), manager=COALESCE(?,manager),
      lost_reason=COALESCE(?,lost_reason), stage_times=? WHERE id=?`
    ).run(b.name??null, b.contact??null, b.phone??null, b.inn??null, b.source??null,
          b.branch??null, b.agent_name??null, b.status??null, b.product??null,
          b.amount??null, b.manager??null, b.lost_reason??null, st, id);
    return db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  });

  app.delete('/:id', { preHandler: requireAuth }, async (req) => {
    db.prepare('DELETE FROM leads WHERE id = ?').run((req.params as { id: string }).id);
    return { ok: true };
  });

  app.post('/:id/activities', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const b = req.body as Partial<LeadActivity>;
    if (!b.summary) return reply.status(400).send({ error: 'Описание обязательно' });
    const info = db.prepare(
      'INSERT INTO lead_activities (lead_id,type,summary,date,manager,result) VALUES (?,?,?,?,?,?)'
    ).run(id, b.type ?? 'call', b.summary, b.date ?? new Date().toISOString().slice(0, 10), b.manager ?? '', b.result ?? '');
    return reply.status(201).send(db.prepare('SELECT * FROM lead_activities WHERE id = ?').get((info as { lastInsertRowid: number }).lastInsertRowid));
  });

  app.delete('/:id/activities/:actId', { preHandler: requireAuth }, async (req) => {
    db.prepare('DELETE FROM lead_activities WHERE id = ?').run((req.params as { id: string; actId: string }).actId);
    return { ok: true };
  });

  // POST /leads/:id/transfer — reassign lead with reason, record ownership history
  app.post('/:id/transfer', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const u = getUser(req);
    const { to_user, reason } = req.body as { to_user: string; reason?: string };
    if (!to_user) return reply.status(400).send({ error: 'Укажите нового ответственного' });

    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as LeadRow | undefined;
    if (!lead) return reply.status(404).send({ error: 'Лид не найден' });

    const from_user = lead.manager ?? '';

    // Record transfer
    db.prepare(
      'INSERT INTO lead_transfers (lead_id, from_user, to_user, reason, transferred_by) VALUES (?,?,?,?,?)'
    ).run(Number(id), from_user, to_user, reason ?? '', u.name);

    // Update manager
    db.prepare('UPDATE leads SET manager=? WHERE id=?').run(to_user, id);

    return {
      ok: true,
      from_user,
      to_user,
      reason: reason ?? '',
      transferred_by: u.name,
    };
  });

  // GET /leads/:id/transfers — ownership history
  app.get('/:id/transfers', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const transfers = db.prepare('SELECT * FROM lead_transfers WHERE lead_id = ? ORDER BY created_at ASC').all(id);
    return transfers;
  });
}
