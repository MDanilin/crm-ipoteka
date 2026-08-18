'use strict';

const express  = require('express');
const { DatabaseSync } = require('node:sqlite');
const cors     = require('cors');
const path     = require('path');
const crypto   = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── DB ──────────────────────────────────────────────────────────────────────

const db = new DatabaseSync(path.join(__dirname, 'crm.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    login         TEXT UNIQUE NOT NULL,
    password      TEXT NOT NULL,
    role          TEXT DEFAULT 'manager',
    dept          TEXT DEFAULT '',
    tab           TEXT DEFAULT '',
    status        TEXT DEFAULT 'active',
    clients_count INTEGER DEFAULT 0,
    last_login    TEXT,
    initials      TEXT,
    created_at    TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS clients (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    short_name   TEXT,
    type         TEXT DEFAULT 'Крупный бизнес',
    type_en      TEXT DEFAULT 'large',
    inn          TEXT DEFAULT '',
    kpp          TEXT DEFAULT '',
    ogrn         TEXT DEFAULT '',
    industry     TEXT DEFAULT '',
    manager      TEXT DEFAULT '',
    status       TEXT DEFAULT 'active',
    rating       TEXT DEFAULT '',
    revenue      TEXT DEFAULT '',
    last_contact TEXT DEFAULT '',
    city         TEXT DEFAULT 'Ташкент',
    phone        TEXT DEFAULT '',
    email        TEXT DEFAULT '',
    employees    TEXT DEFAULT '',
    segment      TEXT DEFAULT 'Standard',
    risk_level   TEXT DEFAULT 'low',
    balance      TEXT DEFAULT '—',
    credit_limit TEXT DEFAULT '—',
    created_at   TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS contacts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id  INTEGER NOT NULL,
    name       TEXT NOT NULL,
    role       TEXT DEFAULT '',
    phone      TEXT DEFAULT '',
    email      TEXT DEFAULT '',
    is_primary INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS products (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id  INTEGER,
    name       TEXT,
    number     TEXT DEFAULT '',
    limit_val  TEXT DEFAULT '—',
    used_val   TEXT DEFAULT '—',
    rate       TEXT DEFAULT '—',
    opened     TEXT DEFAULT '',
    expires    TEXT DEFAULT '',
    status     TEXT DEFAULT 'active',
    usage_pct  INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    client_id   INTEGER,
    client_name TEXT DEFAULT '',
    type        TEXT DEFAULT 'call',
    priority    TEXT DEFAULT 'medium',
    due         TEXT DEFAULT '',
    done        INTEGER DEFAULT 0,
    manager     TEXT DEFAULT '',
    comment     TEXT DEFAULT '',
    created_at  TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS leads (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    contact    TEXT DEFAULT '',
    phone      TEXT DEFAULT '',
    source     TEXT DEFAULT '',
    status     TEXT DEFAULT 'new',
    product    TEXT DEFAULT '',
    manager    TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS pipeline (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    client_name  TEXT NOT NULL,
    client_id    INTEGER,
    product      TEXT DEFAULT '',
    stage        TEXT DEFAULT 'qualification',
    amount       TEXT DEFAULT '',
    amount_raw   REAL DEFAULT 0,
    probability  INTEGER DEFAULT 50,
    manager      TEXT DEFAULT '',
    close_date   TEXT DEFAULT '',
    created_at   TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS communications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id  INTEGER,
    type       TEXT DEFAULT 'call',
    date       TEXT DEFAULT '',
    summary    TEXT DEFAULT '',
    contact    TEXT DEFAULT '',
    duration   TEXT DEFAULT '—',
    manager    TEXT DEFAULT '',
    result     TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS documents (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id  INTEGER,
    name       TEXT,
    icon       TEXT DEFAULT '📄',
    date       TEXT DEFAULT '',
    size       TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );
`);

// ─── SEED ────────────────────────────────────────────────────────────────────

(function seed() {
  if (db.prepare('SELECT COUNT(*) as c FROM users').get().c > 0) return;

  const iu = db.prepare(`INSERT INTO users (name,login,password,role,dept,tab,status,clients_count,last_login,initials) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  [
    ['Алишер Каримов',   'a.karimov',   'karimov123',   'manager',    'Корпоративный блок','10234','active',  18,'21.07.2026 09:12','АК'],
    ['Дилшод Рашидов',   'd.rashidov',  'rashidov123',  'manager',    'Корпоративный блок','10456','active',  15,'21.07.2026 08:54','ДР'],
    ['Нилуфар Юсупова',  'n.yusupova',  'yusupova123',  'supervisor', 'Корпоративный блок','10891','active',  14,'20.07.2026 17:30','НЮ'],
    ['Бахром Исмоилов',  'b.ismoilov',  'ismoilov123',  'analyst',    'Аналитика',         '11023','active',   0,'21.07.2026 10:00','БИ'],
    ['Камола Назарова',   'k.nazarova',  'nazarova123',  'manager',    'МСП',               '10672','active',  22,'19.07.2026 15:20','КН'],
    ['Сарвар Тошматов',  'admin',        'admin123',     'admin',      'IT / Администрация','10001','active',   0,'21.07.2026 07:45','СТ'],
    ['Зарина Холикова',   'z.kholikova', 'kholikova123', 'manager',    'Корпоративный блок','10789','inactive',11,'10.07.2026 11:00','ЗХ'],
  ].forEach(u => iu.run(...u));

  const ic = db.prepare(`INSERT INTO clients (name,short_name,type,type_en,inn,kpp,ogrn,industry,manager,status,rating,revenue,last_contact,city,phone,email,employees,segment,risk_level,balance,credit_limit) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  [
    ['UzAuto Motors','UAM','Крупный бизнес','large','2020785432','201001001','1020785432','Автомобилестроение','А. Каримов','active','A+','850 млрд','18.07.2026','Ташкент','+998 71 234 56 78','treasury@uzautomotors.uz','12 400','Premium','low','12.4 млрд UZS','80 млрд UZS'],
    ['Uzmetkombinat','UMK','Крупный бизнес','large','2009123456','200901001','1020091234','Металлургия','Д. Рашидов','active','AA','1.2 трлн','15.07.2026','Алмалык','+998 70 111 22 33','finance@uzmetkombinat.uz','22 000','Premium','low','45 млрд UZS','200 млрд UZS'],
    ['Арсенал Капитал','АК','МСП','sme','3041234567','304101001','1030412345','Финансы','А. Каримов','active','B+','15 млрд','19.07.2026','Ташкент','+998 71 345 67 89','info@arsenal-capital.uz','85','Standard','medium','890 млн UZS','5 млрд UZS'],
    ['GlobalTrans Logistics','GTL','Международные','international','2070987654','207001001','1020709876','Логистика','Н. Юсупова','active','A','320 млн USD','17.07.2026','Ташкент','+998 78 456 78 90','cfo@globaltrans.uz','3 200','Premium','low','8.5 млрд UZS','50 млрд UZS'],
    ['Texnopark Invest','TI','МСП','sme','3101234567','310101001','1031012345','IT / Технологии','Д. Рашидов','pending','BBB','42 млрд','20.07.2026','Ташкент','+998 90 567 89 01','finance@texnopark.uz','340','Standard','medium','2.1 млрд UZS','10 млрд UZS'],
    ['Agroexport UZ','AE','Крупный бизнес','large','2040234567','204001001','1020402345','Агропром','Н. Юсупова','active','A-','180 млрд','14.07.2026','Самарканд','+998 66 234 56 78','info@agroexport.uz','5 600','Premium','low','6.2 млрд UZS','35 млрд UZS'],
    ['СП «УзКорЭнерго»','УКЭ','Холдинг','holding','2060345678','206001001','1020603456','Энергетика','А. Каримов','active','AA-','2.1 трлн','16.07.2026','Ташкент','+998 71 890 12 34','treasury@uzkorenergo.uz','45 000','Premium','low','82 млрд UZS','400 млрд UZS'],
  ].forEach(c => ic.run(...c));

  const ico = db.prepare(`INSERT INTO contacts (client_id,name,role,phone,email,is_primary) VALUES (?,?,?,?,?,?)`);
  ico.run(1,'Абдулла Мирзаев','CFO','+998 90 111 22 33','a.mirzaev@uzautomotors.uz',1);
  ico.run(1,'Нилуфар Хасанова','Treasury Director','+998 90 222 33 44','n.hasanova@uzautomotors.uz',0);
  ico.run(1,'Отабек Нишонов','CEO','+998 71 234 56 79','o.nishonov@uzautomotors.uz',0);

  const ip = db.prepare(`INSERT INTO products (client_id,name,number,limit_val,used_val,rate,opened,expires,status,usage_pct) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  ip.run(1,'Кредитная линия','KL-2024-0891','80 млрд UZS','52 млрд UZS','19.5% год.','15.03.2024','15.03.2027','active',65);
  ip.run(1,'РКО','RKO-2021-0123','—','—','—','10.01.2021','Бессрочно','active',0);
  ip.run(1,'FX Конвертация','FX-2025-0445','5 млн USD','1.2 млн USD','Market rate','01.06.2025','01.06.2026','expired',24);

  const id_ = db.prepare(`INSERT INTO documents (client_id,name,icon,date,size) VALUES (?,?,?,?,?)`);
  id_.run(1,'Договор кредитной линии KL-2024-0891','📄','15.03.2024','2.4 MB');
  id_.run(1,'Финансовая отчётность 2025','📊','01.02.2026','8.1 MB');
  id_.run(1,'Учредительные документы (устав)','📋','10.01.2021','12.3 MB');
  id_.run(1,'KYC / Анкета клиента','🪪','10.01.2021','1.1 MB');
  id_.run(1,'Протокол встречи 10.07.2026','📝','10.07.2026','0.3 MB');

  const it = db.prepare(`INSERT INTO tasks (title,client_id,client_name,type,priority,due,done,manager) VALUES (?,?,?,?,?,?,?,?)`);
  it.run('Подготовить КП по кредитной линии',1,'UzAuto Motors','proposal','high','21.07.2026',0,'А. Каримов');
  it.run('Встреча с CFO — Uzmetkombinat',2,'Uzmetkombinat','meeting','high','22.07.2026',0,'Д. Рашидов');
  it.run('Подписание договора факторинга',3,'Арсенал Капитал','document','medium','23.07.2026',0,'А. Каримов');
  it.run('Звонок по FX-лимитам GlobalTrans',4,'GlobalTrans Logistics','call','medium','20.07.2026',1,'Н. Юсупова');
  it.run('Анализ финансовой отчётности',5,'Texnopark Invest','analysis','low','25.07.2026',0,'Д. Рашидов');
  it.run('Переоформление банковских гарантий',6,'Agroexport UZ','document','high','21.07.2026',0,'Н. Юсупова');
  it.run('Презентация зарплатного проекта',7,'СП «УзКорЭнерго»','meeting','medium','24.07.2026',0,'А. Каримов');

  const il = db.prepare(`INSERT INTO leads (name,contact,phone,source,status,product,manager) VALUES (?,?,?,?,?,?,?)`);
  il.run('Silk Road Trading Co.','Аброр Юлдашев','+998 91 234 56 78','Реклама','new','РКО','А. Каримов');
  il.run('Tashkent Stone Group','Дилшод Ашуров','+998 90 345 67 89','Рекомендация','qualified','Кредитная линия','Д. Рашидов');
  il.run('Central Asia Pharma','Малика Исмаилова','+998 71 456 78 90','Конференция','proposal','Зарплатный проект','Н. Юсупова');
  il.run('Bukhara Carpets Export','Шухрат Мирзоев','+998 65 567 89 01','Сайт','new','FX','А. Каримов');
  il.run('Fergana Valley Agro','Комил Рашидов','+998 73 678 90 12','Партнёр','qualified','Лизинг','Д. Рашидов');

  const ipl = db.prepare(`INSERT INTO pipeline (client_name,client_id,product,stage,amount,amount_raw,probability,manager,close_date) VALUES (?,?,?,?,?,?,?,?,?)`);
  ipl.run('UzAuto Motors',1,'Кредитная линия · 80 млрд','negotiation','80 млрд',80,75,'А. Каримов','31.08.2026');
  ipl.run('Texnopark Invest',5,'Кредитная линия · 10 млрд','proposal','10 млрд',10,40,'Д. Рашидов','15.09.2026');
  ipl.run('GlobalTrans Logistics',4,'FX конвертация USD/UZS','approval','2.5 млн USD',2.5,90,'Н. Юсупова','25.07.2026');
  ipl.run('Agroexport UZ',6,'Лизинг агрооборудования','qualification','15 млрд',15,25,'Н. Юсупова','30.09.2026');
  ipl.run('СП «УзКорЭнерго»',7,'Депозит · 100 млрд','closed','100 млрд',100,100,'А. Каримов','18.07.2026');

  const imm = db.prepare(`INSERT INTO communications (client_id,type,date,summary,contact,duration,manager,result) VALUES (?,?,?,?,?,?,?,?)`);
  imm.run(1,'call','18.07.2026 · 14:30','Обсуждение условий кредитной линии на 2026 год','Абдулла Мирзаев (CFO)','42 мин','А. Каримов','Запрошены дополнительные документы');
  imm.run(1,'email','15.07.2026','Направлено КП по кредитному продукту','treasury@uzautomotors.uz','—','А. Каримов','Ожидание ответа');
  imm.run(1,'meeting','10.07.2026 · 10:00','Ежеквартальный review в офисе клиента','Топ-менджмент UzAuto','1.5 ч','А. Каримов','Подтверждён интерес к расширению лимитов');
})();

// ─── AUTH ─────────────────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Не авторизован' });
  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!session) return res.status(401).json({ error: 'Сессия истекла' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id);
  if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
  req.user = user;
  next();
}

app.post('/api/auth/login', (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password) return res.status(400).json({ error: 'Укажите логин и пароль' });
  const user = db.prepare('SELECT * FROM users WHERE login = ? AND password = ?').get(login, password);
  if (!user) return res.status(401).json({ error: 'Неверный логин или пароль' });
  if (user.status === 'inactive') return res.status(403).json({ error: 'Учётная запись деактивирована' });
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id);
  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
  const { password: _, ...safe } = user;
  res.json({ token, user: safe });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const { password: _, ...safe } = req.user;
  res.json(safe);
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  res.json({ ok: true });
});

// ─── CLIENTS ─────────────────────────────────────────────────────────────────

app.get('/api/clients', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, GROUP_CONCAT(p.name,'|||') AS products_csv
    FROM clients c LEFT JOIN products p ON p.client_id = c.id
    GROUP BY c.id ORDER BY c.name
  `).all();
  res.json(rows.map(({ products_csv, ...r }) => ({ ...r, products: products_csv ? products_csv.split('|||') : [] })));
});

app.get('/api/clients/:id', requireAuth, (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Клиент не найден' });
  res.json({
    ...client,
    contacts: db.prepare('SELECT * FROM contacts WHERE client_id = ? ORDER BY is_primary DESC, name').all(client.id),
    products: db.prepare('SELECT * FROM products WHERE client_id = ? ORDER BY id').all(client.id),
    docs:     db.prepare('SELECT * FROM documents WHERE client_id = ? ORDER BY date DESC').all(client.id),
    comms:    db.prepare('SELECT * FROM communications WHERE client_id = ? ORDER BY created_at DESC').all(client.id),
    tasks:    db.prepare('SELECT * FROM tasks WHERE client_id = ? ORDER BY done ASC, due ASC').all(client.id),
  });
});

app.post('/api/clients', requireAuth, (req, res) => {
  const { name, short_name, type, inn, kpp, ogrn, industry, manager, city, phone, email, employees, segment, risk_level, revenue, balance, credit_limit } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const sn = short_name || name.split(' ').map(w=>w[0]).join('').slice(0,3).toUpperCase();
  const type_en = type === 'МСП' ? 'sme' : type === 'Холдинг' ? 'holding' : type === 'Международные' ? 'international' : 'large';
  const today = new Date().toLocaleDateString('ru-RU').replace(/\//g,'.');
  const info = db.prepare(`INSERT INTO clients (name,short_name,type,type_en,inn,kpp,ogrn,industry,manager,status,revenue,last_contact,city,phone,email,employees,segment,risk_level,balance,credit_limit) VALUES (?,?,?,?,?,?,?,?,?,'active',?,?,?,?,?,?,?,?,?,?)`)
    .run(name, sn, type||'Крупный бизнес', type_en, inn||'', kpp||'', ogrn||'', industry||'', manager||'', revenue||'', today, city||'Ташкент', phone||'', email||'', employees||'', segment||'Standard', risk_level||'low', balance||'—', credit_limit||'—');
  res.status(201).json(db.prepare('SELECT * FROM clients WHERE id = ?').get(info.lastInsertRowid));
});

app.put('/api/clients/:id', requireAuth, (req, res) => {
  const fields = ['name','short_name','type','type_en','inn','kpp','ogrn','industry','manager','status','rating','revenue','city','phone','email','employees','segment','risk_level','balance','credit_limit','last_contact'];
  const updates = [], values = [];
  for (const f of fields) if (req.body[f] !== undefined) { updates.push(`${f}=?`); values.push(req.body[f]); }
  if (!updates.length) return res.json(db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id));
  values.push(req.params.id);
  db.prepare(`UPDATE clients SET ${updates.join(',')} WHERE id = ?`).run(...values);
  res.json(db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id));
});

app.delete('/api/clients/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── CONTACTS ─────────────────────────────────────────────────────────────────

app.post('/api/clients/:id/contacts', requireAuth, (req, res) => {
  const { name, role, phone, email, is_primary } = req.body;
  if (!name) return res.status(400).json({ error: 'Имя обязательно' });
  if (is_primary) db.prepare('UPDATE contacts SET is_primary=0 WHERE client_id=?').run(req.params.id);
  const info = db.prepare('INSERT INTO contacts (client_id,name,role,phone,email,is_primary) VALUES (?,?,?,?,?,?)')
    .run(req.params.id, name, role||'', phone||'', email||'', is_primary?1:0);
  res.status(201).json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(info.lastInsertRowid));
});

app.delete('/api/contacts/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── TASKS ────────────────────────────────────────────────────────────────────

app.get('/api/tasks', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM tasks ORDER BY done ASC, due ASC').all());
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const { title, client_id, client_name, type, priority, due, manager, comment } = req.body;
  if (!title) return res.status(400).json({ error: 'Название обязательно' });
  const info = db.prepare('INSERT INTO tasks (title,client_id,client_name,type,priority,due,manager,comment) VALUES (?,?,?,?,?,?,?,?)')
    .run(title, client_id||null, client_name||'', type||'call', priority||'medium', due||'', manager||'', comment||'');
  res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid));
});

app.put('/api/tasks/:id', requireAuth, (req, res) => {
  const { done, title, type, priority, due, manager, comment } = req.body;
  db.prepare(`UPDATE tasks SET done=COALESCE(?,done),title=COALESCE(?,title),type=COALESCE(?,type),priority=COALESCE(?,priority),due=COALESCE(?,due),manager=COALESCE(?,manager),comment=COALESCE(?,comment) WHERE id=?`)
    .run(done !== undefined ? (done?1:0) : null, title||null, type||null, priority||null, due||null, manager||null, comment||null, req.params.id);
  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── LEADS ────────────────────────────────────────────────────────────────────

app.get('/api/leads', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all());
});

app.post('/api/leads', requireAuth, (req, res) => {
  const { name, contact, phone, source, status, product, manager } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const info = db.prepare('INSERT INTO leads (name,contact,phone,source,status,product,manager) VALUES (?,?,?,?,?,?,?)')
    .run(name, contact||'', phone||'', source||'', status||'new', product||'', manager||'');
  res.status(201).json(db.prepare('SELECT * FROM leads WHERE id = ?').get(info.lastInsertRowid));
});

app.put('/api/leads/:id', requireAuth, (req, res) => {
  const { name, contact, phone, source, status, product, manager } = req.body;
  db.prepare(`UPDATE leads SET name=COALESCE(?,name),contact=COALESCE(?,contact),phone=COALESCE(?,phone),source=COALESCE(?,source),status=COALESCE(?,status),product=COALESCE(?,product),manager=COALESCE(?,manager) WHERE id=?`)
    .run(name||null, contact||null, phone||null, source||null, status||null, product||null, manager||null, req.params.id);
  res.json(db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id));
});

app.delete('/api/leads/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── PIPELINE ─────────────────────────────────────────────────────────────────

app.get('/api/pipeline', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM pipeline ORDER BY probability DESC').all());
});

app.post('/api/pipeline', requireAuth, (req, res) => {
  const { client_name, client_id, product, stage, amount, amount_raw, probability, manager, close_date } = req.body;
  if (!client_name) return res.status(400).json({ error: 'Клиент обязателен' });
  const info = db.prepare('INSERT INTO pipeline (client_name,client_id,product,stage,amount,amount_raw,probability,manager,close_date) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(client_name, client_id||null, product||'', stage||'qualification', amount||'', parseFloat(amount_raw)||0, parseInt(probability)||50, manager||'', close_date||'');
  res.status(201).json(db.prepare('SELECT * FROM pipeline WHERE id = ?').get(info.lastInsertRowid));
});

app.put('/api/pipeline/:id', requireAuth, (req, res) => {
  const { stage, probability, amount, close_date } = req.body;
  db.prepare(`UPDATE pipeline SET stage=COALESCE(?,stage),probability=COALESCE(?,probability),amount=COALESCE(?,amount),close_date=COALESCE(?,close_date) WHERE id=?`)
    .run(stage||null, probability !== undefined ? parseInt(probability) : null, amount||null, close_date||null, req.params.id);
  res.json(db.prepare('SELECT * FROM pipeline WHERE id = ?').get(req.params.id));
});

app.delete('/api/pipeline/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM pipeline WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── COMMUNICATIONS ───────────────────────────────────────────────────────────

app.post('/api/communications', requireAuth, (req, res) => {
  const { client_id, type, date, summary, contact, duration, manager, result } = req.body;
  if (!summary) return res.status(400).json({ error: 'Описание обязательно' });
  const today = new Date().toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).replace(',', ' ·');
  const info = db.prepare('INSERT INTO communications (client_id,type,date,summary,contact,duration,manager,result) VALUES (?,?,?,?,?,?,?,?)')
    .run(client_id||null, type||'call', date||today, summary, contact||'', duration||'—', manager||'', result||'');
  res.status(201).json(db.prepare('SELECT * FROM communications WHERE id = ?').get(info.lastInsertRowid));
});

app.delete('/api/communications/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM communications WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

app.post('/api/clients/:id/products', requireAuth, (req, res) => {
  const { name, number, limit_val, used_val, rate, opened, expires, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const info = db.prepare('INSERT INTO products (client_id,name,number,limit_val,used_val,rate,opened,expires,status) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(req.params.id, name, number||'', limit_val||'—', used_val||'—', rate||'—', opened||'', expires||'', status||'active');
  res.status(201).json(db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid));
});

// ─── USERS ────────────────────────────────────────────────────────────────────

app.get('/api/users', requireAuth, (req, res) => {
  if (!['admin','supervisor'].includes(req.user.role)) return res.status(403).json({ error: 'Нет доступа' });
  res.json(db.prepare('SELECT id,name,login,role,dept,tab,status,clients_count,last_login,initials FROM users').all());
});

app.post('/api/users', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  const { name, login, password, role, dept, tab } = req.body;
  if (!name || !login || !password) return res.status(400).json({ error: 'Имя, логин и пароль обязательны' });
  const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  try {
    const info = db.prepare('INSERT INTO users (name,login,password,role,dept,tab,initials) VALUES (?,?,?,?,?,?,?)')
      .run(name, login, password, role||'manager', dept||'', tab||'', initials);
    res.status(201).json(db.prepare('SELECT id,name,login,role,dept,tab,status,clients_count,last_login,initials FROM users WHERE id=?').get(info.lastInsertRowid));
  } catch { res.status(400).json({ error: 'Логин уже существует' }); }
});

app.put('/api/users/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  const { name, role, dept, tab, status, password } = req.body;
  const initials = name ? name.trim().split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase() : null;
  let sql = 'UPDATE users SET role=COALESCE(?,role),dept=COALESCE(?,dept),status=COALESCE(?,status)';
  const params = [role||null, dept||null, status||null];
  if (name) { sql += ',name=?,initials=?'; params.push(name.trim(), initials); }
  if (tab)  { sql += ',tab=?'; params.push(tab.trim()); }
  if (password) { sql += ',password=?'; params.push(password); }
  sql += ' WHERE id=?'; params.push(req.params.id);
  db.prepare(sql).run(...params);
  res.json(db.prepare('SELECT id,name,login,role,dept,tab,status,clients_count,last_login,initials FROM users WHERE id=?').get(req.params.id));
});

app.delete('/api/users/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ error: 'Нельзя удалить свою учётную запись' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

app.get('/api/dashboard', requireAuth, (req, res) => {
  const clientCount   = db.prepare('SELECT COUNT(*) as c FROM clients').get().c;
  const activeDeals   = db.prepare("SELECT COUNT(*) as c FROM pipeline WHERE stage != 'closed'").get().c;
  const openTasks     = db.prepare('SELECT COUNT(*) as c FROM tasks WHERE done = 0').get().c;
  const pipelineTotal = db.prepare("SELECT COALESCE(SUM(amount_raw),0) as s FROM pipeline WHERE stage != 'closed'").get().s;
  const myClients     = db.prepare('SELECT * FROM clients ORDER BY last_contact DESC LIMIT 5').all();
  const todayTasks    = db.prepare('SELECT * FROM tasks WHERE done = 0 ORDER BY due ASC LIMIT 5').all();
  const recentComms   = db.prepare('SELECT cm.*,c.name as client_name FROM communications cm LEFT JOIN clients c ON c.id=cm.client_id ORDER BY cm.created_at DESC LIMIT 5').all();
  res.json({ clientCount, activeDeals, openTasks, pipelineTotal: pipelineTotal.toFixed(1) + ' млрд', myClients, todayTasks, recentComms });
});

// ─── SEARCH ───────────────────────────────────────────────────────────────────

app.get('/api/search', requireAuth, (req, res) => {
  const q = '%' + (req.query.q || '') + '%';
  res.json({
    clients: db.prepare("SELECT id,name,city,industry FROM clients WHERE name LIKE ? OR inn LIKE ? OR industry LIKE ? LIMIT 6").all(q,q,q),
    tasks:   db.prepare("SELECT id,title,client_name FROM tasks WHERE title LIKE ? LIMIT 4").all(q),
    leads:   db.prepare("SELECT id,name,contact FROM leads WHERE name LIKE ? LIMIT 4").all(q),
  });
});

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  CRM Ipoteka Bank v2\n  http://localhost:${PORT}\n  admin / admin123\n`);
});
