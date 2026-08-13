import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { requireAuth, getUser } from '../auth.js';
import type { Campaign, CampaignContact } from '@crm/types';

interface ContactRow {
  id: number; campaign_id: number; company: string; inn: string;
  contact_name: string; phone: string; assigned_to: string;
  call_status: string; result_note: string; called_at: string | null;
  is_duplicate: number; created_at: string;
}

function campaignStats(id: number) {
  const total    = (db.prepare('SELECT COUNT(*) as c FROM campaign_contacts WHERE campaign_id=?').get(id) as { c: number }).c;
  const pending  = (db.prepare("SELECT COUNT(*) as c FROM campaign_contacts WHERE campaign_id=? AND call_status='pending'").get(id) as { c: number }).c;
  return { total, pending, processed: total - pending };
}

export async function campaignRoutes(app: FastifyInstance) {

  // GET /campaigns
  app.get('/', { preHandler: requireAuth }, async (req) => {
    const rows = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all() as Campaign[];
    return rows.map(c => ({ ...c, ...campaignStats(c.id) }));
  });

  // POST /campaigns
  app.post('/', { preHandler: requireAuth }, async (req, reply) => {
    const u = getUser(req);
    if (!['admin', 'supervisor', 'manager'].includes(u.role)) return reply.status(403).send({ error: 'Нет доступа' });
    const { name, source } = req.body as { name: string; source?: string };
    if (!name) return reply.status(400).send({ error: 'Название обязательно' });
    const info = db.prepare('INSERT INTO campaigns (name, source) VALUES (?,?)').run(name, source ?? 'telemarketing');
    return reply.status(201).send(db.prepare('SELECT * FROM campaigns WHERE id=?').get(info.lastInsertRowid));
  });

  // GET /campaigns/:id  — campaign + contacts (operators see only their own)
  app.get('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const u = getUser(req);
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id=?').get(id) as Campaign | undefined;
    if (!campaign) return reply.status(404).send({ error: 'Не найдено' });
    const contacts = u.role === 'operator'
      ? db.prepare('SELECT * FROM campaign_contacts WHERE campaign_id=? AND assigned_to=? ORDER BY id').all(id, u.name) as ContactRow[]
      : db.prepare('SELECT * FROM campaign_contacts WHERE campaign_id=? ORDER BY assigned_to, id').all(id) as ContactRow[];
    return { ...campaign, ...campaignStats(Number(id)), contacts };
  });

  // PATCH /campaigns/:id  — update status
  app.patch('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status?: string };
    db.prepare('UPDATE campaigns SET status=COALESCE(?,status) WHERE id=?').run(status ?? null, id);
    return db.prepare('SELECT * FROM campaigns WHERE id=?').get(id);
  });

  // POST /campaigns/:id/import  — bulk insert contacts
  app.post('/:id/import', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id=?').get(id) as Campaign | undefined;
    if (!campaign) return reply.status(404).send({ error: 'Кампания не найдена' });

    const { contacts } = req.body as {
      contacts: { company: string; inn?: string; contact_name?: string; phone?: string }[];
    };
    if (!Array.isArray(contacts) || contacts.length === 0)
      return reply.status(400).send({ error: 'Пустой список контактов' });

    // Check duplicates against existing leads by INN
    const innSet = new Set(
      (db.prepare("SELECT inn FROM leads WHERE inn != ''").all() as { inn: string }[]).map(r => r.inn)
    );

    const insert = db.prepare(
      'INSERT INTO campaign_contacts (campaign_id, company, inn, contact_name, phone, is_duplicate) VALUES (?,?,?,?,?,?)'
    );

    let inserted = 0;
    db.exec('BEGIN');
    try {
      for (const c of contacts) {
        const isDup = c.inn ? (innSet.has(c.inn.trim()) ? 1 : 0) : 0;
        insert.run(Number(id), c.company ?? '', c.inn ?? '', c.contact_name ?? '', c.phone ?? '', isDup);
        inserted++;
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      return reply.status(500).send({ error: 'Ошибка импорта' });
    }

    db.prepare('UPDATE campaigns SET status=? WHERE id=?').run('active', id);
    return { inserted, duplicates: contacts.filter(c => c.inn && innSet.has(c.inn.trim())).length };
  });

  // POST /campaigns/:id/distribute  — round-robin assign contacts to operators
  app.post('/:id/distribute', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { operators } = req.body as { operators: string[] };
    if (!operators?.length) return reply.status(400).send({ error: 'Укажите операторов' });

    const contacts = db.prepare(
      "SELECT id FROM campaign_contacts WHERE campaign_id=? AND call_status='pending' ORDER BY id"
    ).all(id) as { id: number }[];

    const upd = db.prepare('UPDATE campaign_contacts SET assigned_to=? WHERE id=?');
    db.exec('BEGIN');
    contacts.forEach((c, i) => upd.run(operators[i % operators.length], c.id));
    db.exec('COMMIT');

    return { assigned: contacts.length, operators };
  });

  // PUT /campaigns/:id/contacts/:cid  — update call result
  app.put('/:id/contacts/:cid', { preHandler: requireAuth }, async (req, reply) => {
    const { cid } = req.params as { id: string; cid: string };
    const u = getUser(req);
    const { call_status, result_note } = req.body as { call_status: string; result_note?: string };
    const now = new Date().toISOString();
    db.prepare(
      "UPDATE campaign_contacts SET call_status=?, result_note=COALESCE(?,result_note), called_at=?, assigned_to=CASE WHEN assigned_to='' THEN ? ELSE assigned_to END WHERE id=?"
    ).run(call_status, result_note ?? null, now, u.name, cid);
    return db.prepare('SELECT * FROM campaign_contacts WHERE id=?').get(cid);
  });

  // DELETE /campaigns/:id
  app.delete('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const u = getUser(req);
    if (!['admin', 'supervisor'].includes(u.role)) return reply.status(403).send({ error: 'Нет доступа' });
    db.prepare('DELETE FROM campaigns WHERE id=?').run((req.params as { id: string }).id);
    return { ok: true };
  });
}
