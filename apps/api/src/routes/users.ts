// @ts-nocheck
import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { requireAuth, getUser } from '../auth.js';
import type { User } from '@crm/types';

const SAFE = 'id,name,login,phone,role,dept,status,clients_count,last_login,initials';

export async function userRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAuth }, async (req, reply) => {
    const u = getUser(req);
    if (!['admin','supervisor'].includes(u.role)) return reply.status(403).send({ error: 'Нет доступа' });
    return db.prepare(`SELECT ${SAFE} FROM users`).all();
  });

  // Lightweight staff list for transfer modal — manager+ access
  app.get('/staff', { preHandler: requireAuth }, async () =>
    db.prepare("SELECT id,name,role FROM users WHERE role IN ('manager','supervisor','admin') AND status='active' ORDER BY name ASC").all()
  );
  app.post('/', { preHandler: requireAuth }, async (req, reply) => {
    if (getUser(req).role !== 'admin') return reply.status(403).send({ error: 'Нет доступа' });
    const { name, phone, login: reqLogin, password: reqPass, role, dept } = req.body as Partial<User & { phone: string; login: string; password: string }>;
    if (!name) return reply.status(400).send({ error: 'Имя обязательно' });
    const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    const isAgent = role === 'agent';
    if (isAgent) {
      if (!reqLogin || !reqPass) return reply.status(400).send({ error: 'Для агента обязательны логин и пароль' });
      try {
        const info = db.prepare('INSERT INTO users (name,login,password,phone,role,dept,initials) VALUES (?,?,?,?,?,?,?)')
          .run(name, reqLogin.trim(), reqPass, '', 'agent', dept ?? '', initials);
        return reply.status(201).send(db.prepare(`SELECT ${SAFE} FROM users WHERE id=?`).get((info as { lastInsertRowid: number }).lastInsertRowid));
      } catch { return reply.status(400).send({ error: 'Логин уже занят' }); }
    } else {
      if (!phone) return reply.status(400).send({ error: 'Телефон обязателен' });
      const login = name.trim().toLowerCase().replace(/\s+/g, '.').replace(/[^a-zа-я.]/gi, '').slice(0, 20) + '_' + Date.now().toString(36);
      try {
        const info = db.prepare('INSERT INTO users (name,login,password,phone,role,dept,initials) VALUES (?,?,?,?,?,?,?)')
          .run(name, login, 'otp_only', phone, role ?? 'manager', dept ?? '', initials);
        return reply.status(201).send(db.prepare(`SELECT ${SAFE} FROM users WHERE id=?`).get((info as { lastInsertRowid: number }).lastInsertRowid));
      } catch { return reply.status(400).send({ error: 'Пользователь уже существует' }); }
    }
  });
  app.put('/:id', { preHandler: requireAuth }, async (req, reply) => {
    if (getUser(req).role !== 'admin') return reply.status(403).send({ error: 'Нет доступа' });
    const { id } = req.params as { id: string };
    const b = req.body as Partial<User & { password: string }>;
    const initials = b.name ? b.name.trim().split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase() : null;
    let sql = 'UPDATE users SET role=COALESCE(?,role),dept=COALESCE(?,dept),status=COALESCE(?,status)';
    const params: unknown[] = [b.role ?? null, b.dept ?? null, b.status ?? null];
    if (b.name)     { sql += ',name=?,initials=?'; params.push(b.name.trim(), initials); }
    if (b.tab)      { sql += ',tab=?'; params.push(b.tab.trim()); }
    if (b.password) { sql += ',password=?'; params.push(b.password); }
    sql += ' WHERE id=?'; params.push(id);
    db.prepare(sql).run(...params);
    return db.prepare(`SELECT ${SAFE} FROM users WHERE id=?`).get(id);
  });
  app.delete('/:id', { preHandler: requireAuth }, async (req, reply) => {
    const u = getUser(req);
    if (u.role !== 'admin') return reply.status(403).send({ error: 'Нет доступа' });
    const { id } = req.params as { id: string };
    if (String(id) === String(u.id)) return reply.status(400).send({ error: 'Нельзя удалить себя' });
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return { ok: true };
  });
}
