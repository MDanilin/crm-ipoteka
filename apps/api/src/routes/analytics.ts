import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const CH_MAP: Record<string, string> = {
  branch: 'Филиал', agent: 'Агент',
  referral: 'Партнер', 'Рекомендация': 'Партнер',
  cold: 'Телемаркетинг', 'Холодный': 'Телемаркетинг',
  dsa: 'DSA',
};
const CHANNELS = ['Филиал', 'Агент', 'Партнер', 'Телемаркетинг', 'DSA', 'Прочие'] as const;
function mapCh(source: string): string { return CH_MAP[source] ?? 'Прочие'; }

type LeadRow = { id: number; source: string; status: string; manager: string; stage_times: string; created_at: string };
type ActRow  = { lead_id: number; type: string; manager: string };

function processingDays(lead: LeadRow): number {
  const created = new Date(lead.created_at).getTime();
  let end = Date.now();
  try {
    const st = JSON.parse(lead.stage_times || '{}') as Record<string, string>;
    if (lead.status === 'converted' && st.converted) end = new Date(st.converted).getTime();
    else if (lead.status === 'lost' && st.lost)      end = new Date(st.lost).getTime();
  } catch { /* keep now */ }
  return Math.max(0, (end - created) / 86_400_000);
}

export async function analyticsRoutes(app: FastifyInstance) {
  // ── HQ management report ────────────────────────────────────────────────────
  app.get('/hq', { preHandler: requireAuth }, async (req) => {
    const { period = '30' } = req.query as { period?: string };
    const days = Math.min(Math.max(parseInt(period) || 30, 1), 365);
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().replace('T', ' ').slice(0, 19);

    const leads = db.prepare(
      'SELECT id,source,status,manager,stage_times,created_at FROM leads WHERE created_at >= ?'
    ).all(cutoff) as LeadRow[];

    const acts = db.prepare(
      `SELECT la.lead_id, la.type, la.manager FROM lead_activities la
       JOIN leads l ON la.lead_id = l.id WHERE l.created_at >= ?`
    ).all(cutoff) as ActRow[];

    // ── Channel buckets ────────────────────────────────────────────────────────
    type ChBucket = {
      total: number; converted: number; lost: number; days_sum: number;
      funnel: Record<string, number>;
    };
    const chMap: Record<string, ChBucket> = {};
    for (const ch of CHANNELS) {
      chMap[ch] = { total: 0, converted: 0, lost: 0, days_sum: 0,
        funnel: { new: 0, in_progress: 0, meeting: 0, account_opened: 0, converted: 0, lost: 0 } };
    }

    // ── Employee buckets ───────────────────────────────────────────────────────
    type EmpBucket = { leads: number; converted: number; days_sum: number; calls: number; meetings: number; tasks: number };
    const empMap: Record<string, EmpBucket> = {};
    function emp(name: string) {
      if (!empMap[name]) empMap[name] = { leads: 0, converted: 0, days_sum: 0, calls: 0, meetings: 0, tasks: 0 };
      return empMap[name];
    }

    for (const l of leads) {
      const ch = mapCh(l.source);
      const cb = chMap[ch];
      cb.total++;
      const st = l.status as string;
      if (cb.funnel[st] !== undefined) cb.funnel[st]++; else cb.funnel.new++;
      if (st === 'converted') cb.converted++;
      else if (st === 'lost') cb.lost++;
      cb.days_sum += processingDays(l);

      const mgr = l.manager || 'Не назначен';
      const eb = emp(mgr);
      eb.leads++;
      if (st === 'converted') eb.converted++;
      eb.days_sum += processingDays(l);
    }

    for (const a of acts) {
      const mgr = a.manager || 'Не назначен';
      const eb = emp(mgr);
      if (a.type === 'call')    eb.calls++;
      else if (a.type === 'meeting') eb.meetings++;
      else if (a.type === 'task')    eb.tasks++;
    }

    const by_channel = CHANNELS.map(ch => {
      const cb = chMap[ch];
      return {
        channel: ch, total: cb.total, converted: cb.converted, lost: cb.lost,
        active: cb.total - cb.converted - cb.lost,
        conversion_pct: cb.total > 0 ? Math.round((cb.converted / cb.total) * 100) : 0,
        avg_days: cb.total > 0 ? Math.round((cb.days_sum / cb.total) * 10) / 10 : null,
        funnel: cb.funnel,
      };
    });

    const by_employee = Object.entries(empMap)
      .map(([name, eb]) => ({
        name, leads: eb.leads, converted: eb.converted,
        conversion_pct: eb.leads > 0 ? Math.round((eb.converted / eb.leads) * 100) : 0,
        avg_days: eb.leads > 0 ? Math.round((eb.days_sum / eb.leads) * 10) / 10 : null,
        calls: eb.calls, meetings: eb.meetings, tasks: eb.tasks,
      }))
      .sort((a, b) => b.leads - a.leads);

    const total = leads.length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const overall_avg = total > 0
      ? Math.round((leads.reduce((s, l) => s + processingDays(l), 0) / total) * 10) / 10
      : null;

    return { period_days: days, total, converted,
      conversion_pct: total > 0 ? Math.round((converted / total) * 100) : 0,
      avg_days: overall_avg, by_channel, by_employee };
  });

  // ── Lost analytics ───────────────────────────────────────────────────────────
  app.get('/lost', { preHandler: requireAuth }, async () => {
    const total = (db.prepare("SELECT COUNT(*) as c FROM leads WHERE status='lost'").get() as { c: number }).c;

    const thisMonth = (db.prepare(
      "SELECT COUNT(*) as c FROM leads WHERE status='lost' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')"
    ).get() as { c: number }).c;

    const byReason = db.prepare(`
      SELECT
        CASE WHEN lost_reason IS NULL OR lost_reason = '' THEN 'Не указано' ELSE lost_reason END AS reason,
        COUNT(*) AS count
      FROM leads WHERE status = 'lost'
      GROUP BY reason ORDER BY count DESC
    `).all() as { reason: string; count: number }[];

    const bySource = db.prepare(`
      SELECT
        CASE WHEN source IS NULL OR source = '' THEN 'Не указан' ELSE source END AS source,
        COUNT(*) AS count
      FROM leads WHERE status = 'lost'
      GROUP BY source ORDER BY count DESC
    `).all() as { source: string; count: number }[];

    const byManager = db.prepare(`
      SELECT
        CASE WHEN manager IS NULL OR manager = '' THEN 'Не назначен' ELSE manager END AS manager,
        COUNT(*) AS count
      FROM leads WHERE status = 'lost'
      GROUP BY manager ORDER BY count DESC
    `).all() as { manager: string; count: number }[];

    return { total, this_month: thisMonth, by_reason: byReason, by_source: bySource, by_manager: byManager };
  });
}
