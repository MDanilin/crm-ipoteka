// @ts-nocheck
import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { requireAuth, getUser } from '../auth.js';

const SLA_HOURS = 1; // configurable SLA threshold

interface LeadRow {
  id: number; name: string; contact: string; phone: string;
  manager: string; status: string; created_at: string; stage_times: string;
  source: string; agent_name: string;
}

function parseMinutesDiff(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}

function firstReactionMinutes(row: LeadRow): number | null {
  try {
    const st = JSON.parse(row.stage_times ?? '{}') as Record<string, string>;
    const entries = Object.entries(st).filter(([k]) => k !== 'new');
    if (!entries.length) return null;
    entries.sort(([, a], [, b]) => new Date(a).getTime() - new Date(b).getTime());
    return parseMinutesDiff(row.created_at, entries[0][1]);
  } catch { return null; }
}

export async function slaRoutes(app: FastifyInstance) {

  // GET /sla/violations — active violations (new leads past SLA deadline)
  app.get('/violations', { preHandler: requireAuth }, async (req) => {
    const u = getUser(req);
    const now = Date.now();
    const threshold = new Date(now - SLA_HOURS * 3600 * 1000).toISOString();

    let rows: LeadRow[];
    if (u.role === 'manager') {
      rows = db.prepare(
        "SELECT * FROM leads WHERE status='new' AND created_at <= ? AND manager=? ORDER BY created_at ASC"
      ).all(threshold, u.name) as LeadRow[];
    } else {
      rows = db.prepare(
        "SELECT * FROM leads WHERE status='new' AND created_at <= ? ORDER BY created_at ASC"
      ).all(threshold) as LeadRow[];
    }

    const nowMs = now;
    return rows.map(r => ({
      ...r,
      overdue_minutes: Math.round((nowMs - new Date(r.created_at).getTime()) / 60000 - SLA_HOURS * 60),
    }));
  });

  // GET /sla/stats — summary for supervisor/admin
  app.get('/stats', { preHandler: requireAuth }, async (req) => {
    const u = getUser(req);
    if (!['admin', 'supervisor', 'analyst'].includes(u.role)) {
      // managers see their own stats
    }

    const threshold = new Date(Date.now() - SLA_HOURS * 3600 * 1000).toISOString();

    // Active violations
    const activeViolations = (db.prepare(
      "SELECT COUNT(*) as c FROM leads WHERE status='new' AND created_at <= ?"
    ).get(threshold) as { c: number }).c;

    // Violations by manager (current active)
    const byManager = db.prepare(
      "SELECT manager, COUNT(*) as violations FROM leads WHERE status='new' AND created_at <= ? GROUP BY manager ORDER BY violations DESC"
    ).all(threshold) as { manager: string; violations: number }[];

    // Avg response time — leads that changed status (have non-new stage_times entry)
    const resolved = db.prepare(
      "SELECT created_at, stage_times FROM leads WHERE status != 'new' AND stage_times != '{}'"
    ).all() as { created_at: string; stage_times: string }[];

    const reactionTimes: number[] = [];
    for (const r of resolved) {
      try {
        const st = JSON.parse(r.stage_times) as Record<string, string>;
        const entries = Object.entries(st).filter(([k]) => k !== 'new');
        if (!entries.length) continue;
        entries.sort(([, a], [, b]) => new Date(a).getTime() - new Date(b).getTime());
        const mins = parseMinutesDiff(r.created_at, entries[0][1]);
        if (mins > 0 && mins < 10000) reactionTimes.push(mins);
      } catch { /* skip */ }
    }

    const avgReactionMinutes = reactionTimes.length
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : null;

    // Total leads today
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const totalToday = (db.prepare(
      "SELECT COUNT(*) as c FROM leads WHERE created_at >= ?"
    ).get(todayStart.toISOString()) as { c: number }).c;

    // Historical violations count (all leads that spent > 1h in 'new')
    const historicalViolations = (db.prepare(
      "SELECT COUNT(*) as c FROM leads WHERE status != 'new' AND stage_times != '{}'"
    ).get() as { c: number }).c;

    // Manager response time breakdown
    const managerStats = db.prepare(
      "SELECT manager, created_at, stage_times FROM leads WHERE status != 'new' AND manager != ''"
    ).all() as { manager: string; created_at: string; stage_times: string }[];

    const byManagerReaction: Record<string, number[]> = {};
    for (const r of managerStats) {
      try {
        const st = JSON.parse(r.stage_times) as Record<string, string>;
        const entries = Object.entries(st).filter(([k]) => k !== 'new');
        if (!entries.length) continue;
        entries.sort(([, a], [, b]) => new Date(a).getTime() - new Date(b).getTime());
        const mins = parseMinutesDiff(r.created_at, entries[0][1]);
        if (mins > 0 && mins < 10000) {
          if (!byManagerReaction[r.manager]) byManagerReaction[r.manager] = [];
          byManagerReaction[r.manager].push(mins);
        }
      } catch { /* skip */ }
    }

    const managerReactionStats = Object.entries(byManagerReaction).map(([manager, times]) => ({
      manager,
      avg_minutes: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      processed: times.length,
    })).sort((a, b) => a.avg_minutes - b.avg_minutes);

    return {
      sla_hours: SLA_HOURS,
      active_violations: activeViolations,
      by_manager: byManager,
      avg_reaction_minutes: avgReactionMinutes,
      total_today: totalToday,
      historical_violations: historicalViolations,
      manager_reaction_stats: managerReactionStats,
    };
  });

  // POST /sla/demo-breach — create a backdated lead for demo purposes
  app.post('/demo-breach', { preHandler: requireAuth }, async (req, reply) => {
    const u = getUser(req);
    if (!['admin', 'supervisor'].includes(u.role)) return reply.status(403).send({ error: 'Нет доступа' });

    const { manager_name } = (req.body ?? {}) as { manager_name?: string };

    // Pick a manager if not specified
    const manager = manager_name
      || (db.prepare("SELECT name FROM users WHERE role='manager' AND status='active' ORDER BY id LIMIT 1").get() as { name: string } | undefined)?.name
      || '';

    const breachTime = new Date(Date.now() - (SLA_HOURS * 3600 + 900) * 1000).toISOString();

    const names = ['ТОО «КазГрупп»', 'Евразия Трейдинг', 'ООО «СитиМаркет»', 'Промснаб Плюс', 'АО «МеталлТрейд»'];
    const phones = ['+998 90 111 22 33', '+998 91 333 44 55', '+998 93 555 66 77', '+998 95 777 88 99', '+998 97 999 00 11'];
    const idx = Math.floor(Math.random() * names.length);

    const info = db.prepare(
      "INSERT INTO leads (name,contact,phone,source,status,manager,stage_times,created_at) VALUES (?,?,?,?,?,?,?,?)"
    ).run(
      names[idx], 'Директор', phones[idx],
      'inbound', 'new', manager,
      JSON.stringify({ new: breachTime }),
      breachTime
    );

    return reply.status(201).send({
      ok: true,
      lead_id: (info as { lastInsertRowid: number }).lastInsertRowid,
      manager,
      breach_time: breachTime,
    });
  });

  // GET /sla/config
  app.get('/config', { preHandler: requireAuth }, async () => ({
    sla_hours: SLA_HOURS,
    check_interval_minutes: 15,
  }));
}
