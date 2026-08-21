// @ts-nocheck
import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { requireAuth, getUser } from '../auth.js';
import type { Client } from '@crm/types';
import { createWriteStream, mkdirSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });

// Те же правила, что в форме Лидов (routes/leads.ts / leads/page.tsx):
// ИНН — ровно 9 цифр, ПИНФЛ — ровно 14 цифр. Оба поля необязательны, но
// если что-то введено — должно быть валидным (не текст, не другая длина).
function validateInnPinfl(body: Record<string, unknown>): string | null {
  const inn = String(body.inn ?? '').replace(/\D/g, '');
  if (body.inn && inn.length !== 9) return 'ИНН должен содержать ровно 9 цифр';
  const pinfl = String(body.pinfl ?? '').replace(/\D/g, '');
  if (body.pinfl && pinfl.length !== 14) return 'ПИНФЛ должен содержать ровно 14 цифр';
  return null;
}

export async function clientRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAuth }, async (req) => {
    const u = getUser(req);
    // Build WHERE clause based on user's block/branch restrictions
    const conditions: string[] = [];
    const params: string[] = [];
    const restricted = !['admin', 'supervisor', 'analyst'].includes(u.role);
    if (restricted && (u as any).block) {
      conditions.push('c.block = ?');
      params.push((u as any).block);
    }
    if (restricted && (u as any).branch) {
      conditions.push('c.branch = ?');
      params.push((u as any).branch);
    }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const rows = db.prepare(`
      SELECT c.*, GROUP_CONCAT(p.name,'|||') AS products_csv
      FROM clients c LEFT JOIN products p ON p.client_id = c.id
      ${where}
      GROUP BY c.id ORDER BY c.name
    `).all(...params) as (Client & { products_csv: string })[];
    return rows.map(({ products_csv, ...r }) => ({
      ...r,
      products: products_csv ? products_csv.split('|||') : [],
    }));
  });

  app.get('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as Client | undefined;
    if (!client) return reply.status(404).send({ error: 'Клиент не найден' });
    return {
      ...client,
      contacts: db.prepare('SELECT * FROM contacts WHERE client_id = ? ORDER BY is_primary DESC, name').all(id),
      products: db.prepare('SELECT * FROM products WHERE client_id = ? ORDER BY id').all(id),
      docs:     db.prepare('SELECT * FROM documents WHERE client_id = ? ORDER BY date DESC').all(id),
      comms:    db.prepare('SELECT * FROM communications WHERE client_id = ? ORDER BY created_at DESC').all(id),
      tasks:    db.prepare('SELECT * FROM tasks WHERE client_id = ? ORDER BY done ASC, due ASC').all(id),
    };
  });

  app.post('/', { preHandler: requireAuth }, async (req, reply) => {
    const body = req.body as Partial<Client> & { pinfl?: string };
    if (!body.name) return reply.status(400).send({ error: 'Название обязательно' });
    const validationError = validateInnPinfl(body as Record<string, unknown>);
    if (validationError) return reply.status(400).send({ error: validationError });
    const sn = body.short_name || body.name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
    const typeEnMap: Record<string, string> = { 'Малый бизнес': 'small', 'Средний бизнес': 'medium', 'Международные': 'international', 'Payroll': 'payroll', 'Private': 'private' };
    const type_en = typeEnMap[body.type ?? ''] ?? 'large';
    const blockMap: Record<string, string> = { small: 'MSE', medium: 'Middle', large: 'Large', international: 'Int', payroll: 'Large', private: 'Large' };
    const block = (body as any).block || blockMap[type_en] || 'Large';
    const today = new Date().toLocaleDateString('ru-RU').replace(/\//g, '.');
    const info = db.prepare(`INSERT INTO clients (name,short_name,type,type_en,inn,pinfl,kpp,ogrn,industry,manager,status,revenue,last_contact,city,phone,email,employees,segment,risk_level,balance,credit_limit,block,branch)
      VALUES (?,?,?,?,?,?,?,?,?,?,'active',?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(body.name, sn, body.type ?? 'Крупный бизнес', type_en, body.inn ?? '', body.pinfl ?? '', body.kpp ?? '', body.ogrn ?? '',
           body.industry ?? '', body.manager ?? '', body.revenue ?? '', today,
           body.city ?? 'Ташкент', body.phone ?? '', body.email ?? '', body.employees ?? '',
           body.segment ?? 'Standard', body.risk_level ?? 'low', body.balance ?? '—', body.credit_limit ?? '—',
           block, (body as any).branch ?? '');
    return reply.status(201).send(db.prepare('SELECT * FROM clients WHERE id = ?').get((info as { lastInsertRowid: number }).lastInsertRowid));
  });

  app.put('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, string>;
    const validationError = validateInnPinfl(body);
    if (validationError) return reply.status(400).send({ error: validationError });
    const FIELDS = ['name','short_name','type','type_en','inn','pinfl','kpp','ogrn','industry','manager','status','rating','revenue','city','phone','email','employees','segment','risk_level','balance','credit_limit','last_contact'];
    const sets: string[] = [], vals: unknown[] = [];
    for (const f of FIELDS) if (body[f] !== undefined) { sets.push(`${f}=?`); vals.push(body[f]); }
    if (!sets.length) return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    vals.push(id);
    db.prepare(`UPDATE clients SET ${sets.join(',')} WHERE id = ?`).run(...vals);
    return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  });

  app.delete('/:id', { preHandler: requireAuth }, async (req) => {
    const { id } = req.params as { id: string };
    db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    return { ok: true };
  });

  // Contacts
  app.post('/:id/contacts', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { name, role, phone, email, is_primary } = req.body as Record<string, string>;
    if (!name) return reply.status(400).send({ error: 'Имя обязательно' });
    if (is_primary) db.prepare('UPDATE contacts SET is_primary=0 WHERE client_id=?').run(id);
    const info = db.prepare('INSERT INTO contacts (client_id,name,role,phone,email,is_primary) VALUES (?,?,?,?,?,?)')
      .run(id, name, role ?? '', phone ?? '', email ?? '', is_primary ? 1 : 0);
    return reply.status(201).send(db.prepare('SELECT * FROM contacts WHERE id = ?').get((info as { lastInsertRowid: number }).lastInsertRowid));
  });

  // Contacts — delete
  app.delete('/:id/contacts/:cid', { preHandler: requireAuth }, async (req) => {
    const { cid } = req.params as { cid: string };
    db.prepare('DELETE FROM contacts WHERE id = ?').run(cid);
    return { ok: true };
  });

  // Documents — add
  app.post('/:id/documents', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { name, icon, date, size } = req.body as Record<string, string>;
    if (!name) return reply.status(400).send({ error: 'Название обязательно' });
    const info = db.prepare('INSERT INTO documents (client_id,name,icon,date,size) VALUES (?,?,?,?,?)')
      .run(id, name, icon ?? 'doc', date ?? new Date().toLocaleDateString('ru-RU'), size ?? '—');
    return reply.status(201).send(db.prepare('SELECT * FROM documents WHERE id = ?').get((info as { lastInsertRowid: number }).lastInsertRowid));
  });

  // Documents — upload file
  app.post('/:id/documents/upload', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const data = await req.file();
    if (!data) return reply.status(400).send({ error: 'Файл не найден' });

    const ext  = path.extname(data.filename) || '';
    const fname = `${randomUUID()}${ext}`;
    const dest  = path.join(UPLOADS_DIR, fname);
    await pipeline(data.file, createWriteStream(dest));

    const sizeBytes = data.file.bytesRead ?? 0;
    const sizeMB = sizeBytes > 0 ? (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB' : '—';
    const origName = data.fieldname === 'file' ? data.filename : data.filename;
    const name = origName || 'Документ';
    const date = new Date().toLocaleDateString('ru-RU');
    const fileUrl = `/api/uploads/${fname}`;

    const info = db.prepare('INSERT INTO documents (client_id,name,icon,date,size,file_url) VALUES (?,?,?,?,?,?)')
      .run(id, name, 'attach', date, sizeMB, fileUrl);
    return reply.status(201).send(db.prepare('SELECT * FROM documents WHERE id = ?').get((info as { lastInsertRowid: number }).lastInsertRowid));
  });

  // Documents — delete
  app.delete('/:id/documents/:did', { preHandler: requireAuth }, async (req) => {
    const { did } = req.params as { did: string };
    db.prepare('DELETE FROM documents WHERE id = ?').run(did);
    return { ok: true };
  });

  // Products
  app.post('/:id/products', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { name, number, limit_val, used_val, rate, opened, expires, status } = req.body as Record<string, string>;
    if (!name) return reply.status(400).send({ error: 'Название обязательно' });
    const info = db.prepare('INSERT INTO products (client_id,name,number,limit_val,used_val,rate,opened,expires,status) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, name, number ?? '', limit_val ?? '—', used_val ?? '—', rate ?? '—', opened ?? '', expires ?? '', status ?? 'active');
    return reply.status(201).send(db.prepare('SELECT * FROM products WHERE id = ?').get((info as { lastInsertRowid: number }).lastInsertRowid));
  });

  // Products — delete
  app.delete('/:id/products/:pid', { preHandler: requireAuth }, async (req) => {
    const { pid } = req.params as { pid: string };
    db.prepare('DELETE FROM products WHERE id = ?').run(pid);
    return { ok: true };
  });

  // Communications — add
  app.post('/:id/comms', { preHandler: requireAuth }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const { type, date, summary, contact, duration, result } = req.body as Record<string, string>;
    if (!summary) return reply.status(400).send({ error: 'Описание обязательно' });
    const user = await getUser(req);
    const today = new Date().toLocaleDateString('ru-RU');
    const info = db.prepare(
      'INSERT INTO communications (client_id,type,date,summary,contact,duration,manager,result,created_at) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run(id, type ?? 'call', date ?? today, summary, contact ?? '', duration ?? '—', user?.name ?? '', result ?? '', new Date().toISOString());
    return reply.status(201).send(db.prepare('SELECT * FROM communications WHERE id = ?').get((info as { lastInsertRowid: number }).lastInsertRowid));
  });

  // Communications — delete
  app.delete('/:id/comms/:cid', { preHandler: requireAuth }, async (req) => {
    const { cid } = req.params as { cid: string };
    db.prepare('DELETE FROM communications WHERE id = ?').run(cid);
    return { ok: true };
  });
}
