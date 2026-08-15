import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH   = path.join(__dirname, '..', 'crm.db');

export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Add expires_at to sessions if missing (idempotent)
try { db.exec("ALTER TABLE sessions ADD COLUMN expires_at TEXT"); } catch {}
db.exec("UPDATE sessions SET expires_at = datetime(created_at, '+8 hours') WHERE expires_at IS NULL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    login         TEXT UNIQUE NOT NULL,
    password      TEXT NOT NULL,
    phone         TEXT DEFAULT '',
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
    short_name   TEXT DEFAULT '',
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
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    contact     TEXT DEFAULT '',
    phone       TEXT DEFAULT '',
    inn         TEXT DEFAULT '',
    source      TEXT DEFAULT '',
    branch      TEXT DEFAULT '',
    agent_name  TEXT DEFAULT '',
    status      TEXT DEFAULT 'new',
    product     TEXT DEFAULT '',
    amount      REAL DEFAULT 0,
    manager     TEXT DEFAULT '',
    stage_times TEXT DEFAULT '{}',
    lost_reason TEXT DEFAULT '',
    created_at  TEXT DEFAULT (datetime('now'))
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
    file_url   TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS product_catalog (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    category    TEXT DEFAULT '',
    description TEXT DEFAULT '',
    is_active   INTEGER DEFAULT 1,
    sort_order  INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS lead_activities (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id    INTEGER NOT NULL,
    type       TEXT DEFAULT 'call',
    summary    TEXT DEFAULT '',
    date       TEXT DEFAULT '',
    manager    TEXT DEFAULT '',
    result     TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS campaigns (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    source     TEXT DEFAULT 'telemarketing',
    status     TEXT DEFAULT 'draft',
    total      INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS campaign_contacts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id  INTEGER NOT NULL,
    company      TEXT DEFAULT '',
    inn          TEXT DEFAULT '',
    contact_name TEXT DEFAULT '',
    phone        TEXT DEFAULT '',
    assigned_to  TEXT DEFAULT '',
    call_status  TEXT DEFAULT 'pending',
    result_note  TEXT DEFAULT '',
    called_at    TEXT,
    is_duplicate INTEGER DEFAULT 0,
    created_at   TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS otps (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    phone       TEXT NOT NULL,
    code        TEXT NOT NULL,
    expires_at  INTEGER NOT NULL,
    used        INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS lead_transfers (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id        INTEGER NOT NULL,
    from_user      TEXT DEFAULT '',
    to_user        TEXT NOT NULL,
    reason         TEXT DEFAULT '',
    transferred_by TEXT DEFAULT '',
    created_at     TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS lead_arbitrations (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    requester        TEXT NOT NULL,
    requester_role   TEXT NOT NULL,
    duplicate_inn    TEXT DEFAULT '',
    duplicate_phone  TEXT DEFAULT '',
    existing_lead_id INTEGER NOT NULL,
    new_lead_data    TEXT NOT NULL,
    comment          TEXT DEFAULT '',
    status           TEXT DEFAULT 'pending',
    reviewer         TEXT DEFAULT '',
    review_comment   TEXT DEFAULT '',
    reviewed_at      TEXT,
    created_at       TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS field_config (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    entity     TEXT NOT NULL,
    field      TEXT NOT NULL,
    label      TEXT NOT NULL DEFAULT '',
    required   INTEGER DEFAULT 0,
    visible    INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(entity, field)
  );
`);

// Migrations for existing databases
try { db.exec("ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE leads ADD COLUMN inn TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE leads ADD COLUMN pinfl TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE leads ADD COLUMN branch TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE leads ADD COLUMN stage_times TEXT DEFAULT '{}'"); } catch {}
try { db.exec("ALTER TABLE leads ADD COLUMN agent_name TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE documents ADD COLUMN file_url TEXT DEFAULT ''"); } catch {}
// Migrate emoji icon values → string keys
db.exec(`UPDATE documents SET icon='clip'  WHERE icon='📄'`);
db.exec(`UPDATE documents SET icon='chart' WHERE icon='📊'`);
db.exec(`UPDATE documents SET icon='id'    WHERE icon='🪪'`);
db.exec(`UPDATE documents SET icon='note'  WHERE icon='📝'`);
db.exec(`UPDATE documents SET icon='doc'   WHERE icon NOT IN ('doc','chart','clip','id','note','lock','attach','other') AND icon != ''`);
try { db.exec("ALTER TABLE leads ADD COLUMN amount REAL DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE leads ADD COLUMN lost_reason TEXT DEFAULT ''"); } catch {}
// field_config v2 — new columns for full field configuration
try { db.exec("ALTER TABLE field_config ADD COLUMN field_type TEXT DEFAULT 'text'"); } catch {}
try { db.exec("ALTER TABLE field_config ADD COLUMN placeholder TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE field_config ADD COLUMN validation_regex TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE field_config ADD COLUMN min_length INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE field_config ADD COLUMN max_length INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE field_config ADD COLUMN options TEXT DEFAULT '[]'"); } catch {}
try { db.exec("ALTER TABLE field_config ADD COLUMN is_custom INTEGER DEFAULT 0"); } catch {}
// Set proper types for phone/amount fields
db.exec("UPDATE field_config SET field_type = 'phone'  WHERE field = 'phone'  AND field_type IS 'text'");
db.exec("UPDATE field_config SET field_type = 'number' WHERE field = 'amount' AND field_type IS 'text'");
// Custom field values storage
db.exec(`CREATE TABLE IF NOT EXISTS custom_field_values (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  entity    TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  field     TEXT NOT NULL,
  value     TEXT DEFAULT '',
  UNIQUE(entity, entity_id, field)
)`);
// Seed source select options for lead
db.exec("UPDATE field_config SET field_type = 'select', options = '[\"inbound\",\"website\",\"referral\",\"cold\",\"event\",\"branch\",\"agent\"]' WHERE entity = 'lead' AND field = 'source' AND field_type IS 'text'");

// Block & branch access control
try { db.exec("ALTER TABLE users ADD COLUMN block TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN branch TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE clients ADD COLUMN block TEXT DEFAULT ''"); } catch {}
try { db.exec("ALTER TABLE clients ADD COLUMN branch TEXT DEFAULT ''"); } catch {}
// Seed block for existing clients based on type_en
db.exec("UPDATE clients SET block = 'Large' WHERE type_en = 'large'  AND (block = '' OR block IS NULL)");
db.exec("UPDATE clients SET block = 'MSE'   WHERE type_en = 'sme'   AND (block = '' OR block IS NULL)");
db.exec("UPDATE clients SET block = 'Int'   WHERE type_en = 'international' AND (block = '' OR block IS NULL)");
db.exec("UPDATE clients SET block = 'Large' WHERE type_en = 'holding' AND (block = '' OR block IS NULL)");

// Seed default field config (INSERT OR IGNORE — safe to run on existing DBs)
const seedFieldConfig = db.prepare(
  'INSERT OR IGNORE INTO field_config (entity, field, label, required, visible, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
);
const DEFAULT_FIELD_CONFIG: [string, string, string, number, number, number][] = [
  ['lead', 'name',          'Название компании', 1, 1,  0],
  ['lead', 'inn',           'ИНН',               1, 1,  1],
  ['lead', 'pinfl',         'ПИНФЛ',             1, 1,  2],
  ['lead', 'contact',       'Контакт',           0, 1,  3],
  ['lead', 'phone',         'Телефон',           1, 1,  4],
  ['lead', 'product',       'Продукт',           1, 1,  5],
  ['lead', 'source',        'Источник',          0, 1,  6],
  ['lead', 'manager',       'Менеджер',          0, 1,  7],
  ['lead', 'amount',        'Сумма',             0, 1,  8],
  ['client', 'name',        'Название компании', 1, 1,  0],
  ['client', 'type',        'Тип клиента',       0, 1,  1],
  ['client', 'industry',    'Отрасль',           0, 1,  2],
  ['client', 'inn',         'ИНН',               0, 1,  3],
  ['client', 'city',        'Город',             0, 1,  4],
  ['client', 'phone',       'Телефон',           0, 1,  5],
  ['client', 'email',       'Email',             0, 1,  6],
  ['client', 'manager',     'Менеджер',          0, 1,  7],
  ['client', 'segment',     'Сегмент',           0, 1,  8],
  ['client', 'risk_level',  'Уровень риска',     0, 1,  9],
  ['client', 'rating',      'Рейтинг',           0, 1, 10],
  ['client', 'revenue',     'Выручка',           0, 1, 11],
  ['client', 'credit_limit','Кредитный лимит',   0, 1, 12],
  ['client', 'employees',   'Сотрудников',       0, 1, 13],
];
for (const [entity, field, label, required, visible, sort_order] of DEFAULT_FIELD_CONFIG) {
  seedFieldConfig.run(entity, field, label, required, visible, sort_order);
}

// Backfill phone numbers for existing seed users
const PHONE_MAP: Record<string, string> = {
  'admin':       '+998 90 500-10-00',
  'a.karimov':   '+998 90 500-10-01',
  'd.rashidov':  '+998 90 500-10-02',
  'n.yusupova':  '+998 90 500-10-03',
  'b.ismoilov':  '+998 90 500-10-04',
  'k.nazarova':  '+998 90 500-10-05',
  'z.kholikova': '+998 90 500-10-06',
};
const missingPhones = db.prepare("SELECT id, login FROM users WHERE phone = '' OR phone IS NULL").all() as { id: number; login: string }[];
const upPhone = db.prepare("UPDATE users SET phone = ? WHERE id = ?");
for (const u of missingPhones) {
  if (PHONE_MAP[u.login]) upPhone.run(PHONE_MAP[u.login], u.id);
}

function seed() {
  const count = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (count > 0) return;

  const iu = db.prepare(`INSERT INTO users (name,login,password,phone,role,dept,tab,status,clients_count,last_login,initials) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  [
    ['Алишер Каримов',  'a.karimov',   'karimov123',   '+998 90 500-10-01','manager',    'Корпоративный блок','10234','active',  18,'2026-07-21 09:12','АК'],
    ['Дилшод Рашидов',  'd.rashidov',  'rashidov123',  '+998 90 500-10-02','manager',    'Корпоративный блок','10456','active',  15,'2026-07-21 08:54','ДР'],
    ['Нилуфар Юсупова', 'n.yusupova',  'yusupova123',  '+998 90 500-10-03','supervisor', 'Корпоративный блок','10891','active',  14,'2026-07-20 17:30','НЮ'],
    ['Бахром Исмоилов', 'b.ismoilov',  'ismoilov123',  '+998 90 500-10-04','analyst',    'Аналитика',         '11023','active',   0,'2026-07-21 10:00','БИ'],
    ['Камола Назарова',  'k.nazarova',  'nazarova123',  '+998 90 500-10-05','manager',    'МСП',               '10672','active',  22,'2026-07-19 15:20','КН'],
    ['Сарвар Тошматов', 'admin',        'admin123',     '+998 90 500-10-00','admin',      'IT / Администрация','10001','active',   0,'2026-07-21 07:45','СТ'],
    ['Зарина Холикова',  'z.kholikova', 'kholikova123', '+998 90 500-10-06','manager',    'Корпоративный блок','10789','inactive',11,'2026-07-10 11:00','ЗХ'],
  ].forEach(u => iu.run(...u));

  const ic = db.prepare(`INSERT INTO clients (name,short_name,type,type_en,inn,industry,manager,status,rating,revenue,last_contact,city,phone,email,employees,segment,risk_level,balance,credit_limit) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  [
    ['UzAuto Motors','UAM','Крупный бизнес','large','2020785432','Автомобилестроение','А. Каримов','active','A+','850 млрд','18.07.2026','Ташкент','+998 71 234 56 78','treasury@uzautomotors.uz','12 400','Premium','low','12.4 млрд UZS','80 млрд UZS'],
    ['Uzmetkombinat','UMK','Крупный бизнес','large','2009123456','Металлургия','Д. Рашидов','active','AA','1.2 трлн','15.07.2026','Алмалык','+998 70 111 22 33','finance@uzmetkombinat.uz','22 000','Premium','low','45 млрд UZS','200 млрд UZS'],
    ['Арсенал Капитал','АК','МСП','sme','3041234567','Финансы','А. Каримов','active','B+','15 млрд','19.07.2026','Ташкент','+998 71 345 67 89','info@arsenal-capital.uz','85','Standard','medium','890 млн UZS','5 млрд UZS'],
    ['GlobalTrans Logistics','GTL','Международные','international','2070987654','Логистика','Н. Юсупова','active','A','320 млн USD','17.07.2026','Ташкент','+998 78 456 78 90','cfo@globaltrans.uz','3 200','Premium','low','8.5 млрд UZS','50 млрд UZS'],
    ['Texnopark Invest','TI','МСП','sme','3101234567','IT / Технологии','Д. Рашидов','pending','BBB','42 млрд','20.07.2026','Ташкент','+998 90 567 89 01','finance@texnopark.uz','340','Standard','medium','2.1 млрд UZS','10 млрд UZS'],
    ['Agroexport UZ','AE','Крупный бизнес','large','2040234567','Агропром','Н. Юсупова','active','A-','180 млрд','14.07.2026','Самарканд','+998 66 234 56 78','info@agroexport.uz','5 600','Premium','low','6.2 млрд UZS','35 млрд UZS'],
    ['СП «УзКорЭнерго»','УКЭ','Холдинг','holding','2060345678','Энергетика','А. Каримов','active','AA-','2.1 трлн','16.07.2026','Ташкент','+998 71 890 12 34','treasury@uzkorenergo.uz','45 000','Premium','low','82 млрд UZS','400 млрд UZS'],
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
  id_.run(1,'Договор кредитной линии KL-2024-0891','clip','15.03.2024','2.4 MB');
  id_.run(1,'Финансовая отчётность 2025','chart','01.02.2026','8.1 MB');
  id_.run(1,'KYC / Анкета клиента','id','10.01.2021','1.1 MB');
  id_.run(1,'Протокол встречи 10.07.2026','note','10.07.2026','0.3 MB');

  const it = db.prepare(`INSERT INTO tasks (title,client_id,client_name,type,priority,due,done,manager) VALUES (?,?,?,?,?,?,?,?)`);
  it.run('Подготовить КП по кредитной линии',1,'UzAuto Motors','proposal','high','21.07.2026',0,'А. Каримов');
  it.run('Встреча с CFO — Uzmetkombinat',2,'Uzmetkombinat','meeting','high','22.07.2026',0,'Д. Рашидов');
  it.run('Подписание договора факторинга',3,'Арсенал Капитал','document','medium','23.07.2026',0,'А. Каримов');
  it.run('Звонок по FX-лимитам GlobalTrans',4,'GlobalTrans Logistics','call','medium','20.07.2026',1,'Н. Юсупова');
  it.run('Переоформление банковских гарантий',6,'Agroexport UZ','document','high','21.07.2026',0,'Н. Юсупова');

  const il = db.prepare(`INSERT INTO leads (name,contact,phone,source,status,product,manager) VALUES (?,?,?,?,?,?,?)`);
  il.run('Silk Road Trading Co.','Аброр Юлдашев','+998 91 234 56 78','Реклама','new','РКО','А. Каримов');
  il.run('Tashkent Stone Group','Дилшод Ашуров','+998 90 345 67 89','Рекомендация','qualified','Кредитная линия','Д. Рашидов');
  il.run('Central Asia Pharma','Малика Исмаилова','+998 71 456 78 90','Конференция','proposal','Зарплатный проект','Н. Юсупова');

  const ipl = db.prepare(`INSERT INTO pipeline (client_name,client_id,product,stage,amount,amount_raw,probability,manager,close_date) VALUES (?,?,?,?,?,?,?,?,?)`);
  ipl.run('UzAuto Motors',1,'Кредитная линия · 80 млрд','negotiation','80 млрд',80,75,'А. Каримов','31.08.2026');
  ipl.run('Texnopark Invest',5,'Кредитная линия · 10 млрд','proposal','10 млрд',10,40,'Д. Рашидов','15.09.2026');
  ipl.run('GlobalTrans Logistics',4,'FX конвертация USD/UZS','approval','2.5 млн USD',2.5,90,'Н. Юсупова','25.07.2026');
  ipl.run('Agroexport UZ',6,'Лизинг агрооборудования','qualification','15 млрд',15,25,'Н. Юсупова','30.09.2026');
  ipl.run('СП «УзКорЭнерго»',7,'Депозит · 100 млрд','closed','100 млрд',100,100,'А. Каримов','18.07.2026');

  const imm = db.prepare(`INSERT INTO communications (client_id,type,date,summary,contact,duration,manager,result) VALUES (?,?,?,?,?,?,?,?)`);
  imm.run(1,'call','18.07.2026 · 14:30','Обсуждение условий кредитной линии на 2026 год','Абдулла Мирзаев (CFO)','42 мин','А. Каримов','Запрошены дополнительные документы');
  imm.run(1,'email','15.07.2026','Направлено КП по кредитному продукту','treasury@uzautomotors.uz','—','А. Каримов','Ожидание ответа');
  imm.run(1,'meeting','10.07.2026 · 10:00','Ежеквартальный review в офисе клиента','Топ-менеджмент UzAuto','1.5 ч','А. Каримов','Подтверждён интерес к расширению лимитов');
}

seed();

// Ensure operator test user exists
const opExists = db.prepare("SELECT id FROM users WHERE login='az.rahimova'").get();
if (!opExists) {
  db.prepare(`INSERT INTO users (name,login,password,phone,role,dept,tab,status,clients_count,initials) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run('Азиза Рахимова','az.rahimova','rahimova123','+998 90 500-10-07','operator','Кол-центр','','active',0,'АР');
}

// Ensure DSA test user exists
const dsaExists = db.prepare("SELECT id FROM users WHERE login='j.nazarov'").get();
if (!dsaExists) {
  db.prepare(`INSERT INTO users (name,login,password,phone,role,dept,tab,status,clients_count,initials) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run('Жамшид Назаров','j.nazarov','nazarov123','+998 90 500-10-08','dsa','DSA / Выездные','','active',0,'ЖН');
}

// Seed historical lost leads for analytics demo (idempotent)
const lostCount = (db.prepare("SELECT COUNT(*) as c FROM leads WHERE status='lost'").get() as { c: number }).c;
if (lostCount === 0) {
  const ils = db.prepare(
    `INSERT INTO leads (name,contact,phone,source,status,product,manager,lost_reason,stage_times,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`
  );
  const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString().replace('T',' ').slice(0,19);
  ils.run('Omega Trade Group',    'Санжар Юнусов',   '+998 90 100 00 01', 'cold',        'lost','Кредитная линия',   'А. Каримов',  'Конкурент предложил лучшую цену',    '{}', ago(45));
  ils.run('Sanat Solutions',      'Гулнора Саидова',  '+998 90 100 00 02', 'cold',        'lost','Кредитная линия',   'А. Каримов',  'Нет бюджета',                        '{}', ago(38));
  ils.run('Ferghana Agro Ltd',    'Мирзо Рустамов',   '+998 90 100 00 03', 'Рекомендация','lost','Зарплатный проект', 'Д. Рашидов',  'Долгий процесс оформления',          '{}', ago(30));
  ils.run('Central Foods Co.',    'Феруза Алиева',    '+998 90 100 00 04', 'Конференция', 'lost','РКО',               'Н. Юсупова',  'Нет интереса к продукту',            '{}', ago(25));
  ils.run('Bukhara Metal Works',  'Отабек Каримов',   '+998 90 100 00 05', 'cold',        'lost','Кредитная линия',   'Д. Рашидов',  'Конкурент предложил лучшую цену',    '{}', ago(20));
  ils.run('Tashkent Digital Hub', 'Лола Маматова',    '+998 90 100 00 06', 'dsa',         'lost','РКО',               'К. Назарова', 'Клиент выбрал другой банк',           '{}', ago(15));
  ils.run('NamPharma Group',      'Бобур Тошпўлатов', '+998 90 100 00 07', 'Рекомендация','lost','Зарплатный проект', 'А. Каримов',  'Нет бюджета',                        '{}', ago(10));
}

// Seed historical converted leads for HQ analytics demo (idempotent)
const convCount = (db.prepare("SELECT COUNT(*) as c FROM leads WHERE status='converted'").get() as { c: number }).c;
if (convCount === 0) {
  const ilc = db.prepare(
    `INSERT INTO leads (name,contact,phone,source,status,product,manager,lost_reason,stage_times,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`
  );
  const ago = (d: number) => new Date(Date.now() - d * 86400000).toISOString().replace('T',' ').slice(0,19);
  const st = (created: number, convDaysLater: number) => JSON.stringify({
    new: new Date(Date.now() - created * 86400000).toISOString(),
    in_progress: new Date(Date.now() - (created - 3) * 86400000).toISOString(),
    converted: new Date(Date.now() - (created - convDaysLater) * 86400000).toISOString(),
  });
  ilc.run('Orient Dairy Combine',    'Юсуф Рахматов',   '+998 90 200 00 01', 'branch',      'converted','Кредитная линия',   'А. Каримов',  '', st(42,8),  ago(42));
  ilc.run('Maxima Auto Salon',        'Диёра Ашурова',   '+998 90 200 00 02', 'agent',       'converted','Ипотека',           'Д. Рашидов',  '', st(35,6),  ago(35));
  ilc.run('QR Digital Solutions',     'Нодир Эргашев',   '+998 90 200 00 03', 'dsa',         'converted','Зарплатный проект', 'К. Назарова', '', st(28,4),  ago(28));
  ilc.run('Sunrise Textile Factory',  'Малика Умарова',  '+998 90 200 00 04', 'Рекомендация','converted','РКО',               'А. Каримов',  '', st(21,5),  ago(21));
  ilc.run('Delta Cargo Services',     'Зафар Ниёзов',    '+998 90 200 00 05', 'branch',      'converted','Кредитная линия',   'Н. Юсупова',  '', st(14,7),  ago(14));
  ilc.run('EcoFarm Agro Group',       'Камол Турсунов',  '+998 90 200 00 06', 'cold',        'converted','Зарплатный проект', 'Д. Рашидов',  '', st(10,9),  ago(10));
  ilc.run('InnoTech Startup Hub',     'Саида Юлдашева',  '+998 90 200 00 07', 'dsa',         'converted','РКО',               'К. Назарова', '', st(7,5),   ago(7));
}

// Seed lead_activities for HQ productivity demo (idempotent)
const actCount = (db.prepare(
  "SELECT COUNT(*) as c FROM lead_activities la JOIN leads l ON la.lead_id=l.id WHERE l.name='Orient Dairy Combine'"
).get() as { c: number }).c;
if (actCount === 0) {
  const ila = db.prepare(
    `INSERT INTO lead_activities (lead_id,type,summary,date,manager,result) VALUES (?,?,?,?,?,?)`
  );
  type LeadIdRow = { id: number };
  function lid(name: string): number {
    return ((db.prepare("SELECT id FROM leads WHERE name=?").get(name) as LeadIdRow | undefined)?.id ?? 0);
  }
  const agoIso = (d: number) => new Date(Date.now() - d * 86400000).toISOString().replace('T',' ').slice(0,19);
  // Converted leads – activities
  const orient = lid('Orient Dairy Combine');
  if (orient) {
    ila.run(orient, 'call',    'Первичный звонок',           agoIso(40), 'А. Каримов',  'Интерес подтверждён');
    ila.run(orient, 'meeting', 'Встреча в офисе клиента',    agoIso(38), 'А. Каримов',  'КП направлено');
    ila.run(orient, 'task',    'Подготовить договор',        agoIso(36), 'А. Каримов',  'Завершено');
  }
  const maxima = lid('Maxima Auto Salon');
  if (maxima) {
    ila.run(maxima, 'call',    'Входящий запрос по ипотеке', agoIso(34), 'Д. Рашидов',  'Назначена встреча');
    ila.run(maxima, 'meeting', 'Презентация продукта',       agoIso(32), 'Д. Рашидов',  'Одобрен');
  }
  const qr = lid('QR Digital Solutions');
  if (qr) {
    ila.run(qr, 'call',    'Холодный звонок DSA',         agoIso(27), 'К. Назарова', 'Согласился на встречу');
    ila.run(qr, 'task',    'Сбор документов',             agoIso(25), 'К. Назарова', 'Завершено');
  }
  const sunrise = lid('Sunrise Textile Factory');
  if (sunrise) {
    ila.run(sunrise, 'call',    'Звонок по рекомендации',     agoIso(20), 'А. Каримов',  'Клиент заинтересован');
    ila.run(sunrise, 'meeting', 'Оформление счёта',           agoIso(18), 'А. Каримов',  'Счёт открыт');
  }
  const delta = lid('Delta Cargo Services');
  if (delta) {
    ila.run(delta, 'call',    'Первый контакт',             agoIso(13), 'Н. Юсупова',  'Согласились на КП');
    ila.run(delta, 'call',    'Повторный звонок',           agoIso(11), 'Н. Юсупова',  'Подписали');
    ila.run(delta, 'task',    'Закрыть сделку в системе',  agoIso(10), 'Н. Юсупова',  'Завершено');
  }
  const ecofarm = lid('EcoFarm Agro Group');
  if (ecofarm) {
    ila.run(ecofarm, 'call',    'Холодный звонок',           agoIso(9),  'Д. Рашидов',  'Перезвонить');
    ila.run(ecofarm, 'meeting', 'Встреча на выезде',         agoIso(8),  'Д. Рашидов',  'Успешно');
  }
  const inno = lid('InnoTech Startup Hub');
  if (inno) {
    ila.run(inno, 'call',    'DSA звонок',                agoIso(6),  'К. Назарова', 'Заявка оформлена');
    ila.run(inno, 'task',    'Верификация ИНН',           agoIso(5),  'К. Назарова', 'Пройдена');
  }
  // Lost leads – activities
  const omega = lid('Omega Trade Group');
  if (omega) {
    ila.run(omega, 'call',    'Холодный звонок',           agoIso(44), 'А. Каримов',  'Сравнивают с конкурентом');
    ila.run(omega, 'call',    'Повторный звонок',          agoIso(42), 'А. Каримов',  'Отказ — конкурент дешевле');
  }
  const tashHub = lid('Tashkent Digital Hub');
  if (tashHub) {
    ila.run(tashHub, 'call',    'DSA звонок',               agoIso(14), 'К. Назарова', 'Интерес есть');
    ila.run(tashHub, 'meeting', 'Онлайн-встреча',           agoIso(13), 'К. Назарова', 'Клиент выбрал другой банк');
  }
}

// Settings table (key-value store)
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);
const defaultSettings: [string, string][] = [
  ['bank_name',  'Ипотека Банк'],
  ['bank_short', 'ИБ'],
  ['sla_hours',  '1'],
  ['city',       'Ташкент'],
];
const upsertSetting = db.prepare(
  "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING"
);
for (const [k, v] of defaultSettings) upsertSetting.run(k, v);

// Seed product catalog (idempotent)
const catCount = (db.prepare('SELECT COUNT(*) as c FROM product_catalog').get() as { c: number }).c;
if (catCount === 0) {
  const ipc = db.prepare('INSERT INTO product_catalog (name, category, description, sort_order) VALUES (?,?,?,?)');
  const cats: [string, string, string, number][] = [
    ['Кредитная линия',          'Кредитование',   'Возобновляемая кредитная линия для пополнения оборотных средств', 1],
    ['Срочный кредит',           'Кредитование',   'Единовременная выдача кредита на инвестиционные цели',           2],
    ['Овердрафт',                'Кредитование',   'Краткосрочное кредитование расчётного счёта',                    3],
    ['Банковская гарантия',      'Гарантии',       'Обеспечение обязательств клиента перед третьими лицами',         4],
    ['Аккредитив',               'Гарантии',       'Документарный аккредитив для торговых операций',                 5],
    ['РКО',                      'Расчёты',        'Расчётно-кассовое обслуживание',                                 6],
    ['Зарплатный проект',        'Расчёты',        'Перечисление зарплаты сотрудникам на карты банка',               7],
    ['Эквайринг',                'Расчёты',        'Приём безналичных платежей через POS-терминалы',                 8],
    ['Факторинг',                'Финансирование', 'Финансирование под уступку дебиторской задолженности',           9],
    ['Торговое финансирование',  'Финансирование', 'Финансирование импортных/экспортных операций',                  10],
    ['Депозит',                  'Пассивы',        'Размещение временно свободных средств компании',                11],
    ['Ипотека (коммерческая)',   'Недвижимость',   'Финансирование покупки коммерческой недвижимости',              12],
    ['Лизинг',                   'Финансирование', 'Финансовая аренда оборудования или транспорта',                 13],
    ['Инкассация',               'Расчёты',        'Услуга инкассации наличных денежных средств',                   14],
  ];
  for (const row of cats) ipc.run(...row);
}

// Scrypt-based password hashing (no external deps). Format: $scrypt$salt$hash
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `$scrypt$${salt}$${hash}`;
}

export function verifyPassword(stored: string, input: string): boolean {
  if (stored.startsWith('$scrypt$')) {
    const parts = stored.split('$');
    const salt = parts[2];
    const hash = parts[3];
    try {
      const inputHash = crypto.scryptSync(input, salt, 64).toString('hex');
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(inputHash, 'hex'));
    } catch { return false; }
  }
  // Legacy plaintext — should only exist briefly during migration
  return stored === input;
}

// Migrate all plaintext passwords to scrypt on startup
function migratePasswords() {
  const users = db.prepare("SELECT id, password FROM users").all() as { id: number; password: string }[];
  const update = db.prepare("UPDATE users SET password = ? WHERE id = ?");
  for (const u of users) {
    if (!u.password.startsWith('$scrypt$')) {
      update.run(hashPassword(u.password), u.id);
    }
  }
}
migratePasswords();
