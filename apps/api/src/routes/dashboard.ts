import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAuth }, async () => {
    const clientCount   = (db.prepare('SELECT COUNT(*) as c FROM clients').get() as { c: number }).c;
    const activeDeals   = (db.prepare("SELECT COUNT(*) as c FROM pipeline WHERE stage != 'closed'").get() as { c: number }).c;
    const openTasks     = (db.prepare('SELECT COUNT(*) as c FROM tasks WHERE done = 0').get() as { c: number }).c;
    const pipelineTotal = (db.prepare("SELECT COALESCE(SUM(amount_raw),0) as s FROM pipeline WHERE stage != 'closed'").get() as { s: number }).s;
    return {
      clientCount,
      activeDeals,
      openTasks,
      pipelineTotal: pipelineTotal.toFixed(1) + ' млрд',
      myClients:   db.prepare('SELECT * FROM clients ORDER BY last_contact DESC LIMIT 5').all(),
      todayTasks:  db.prepare('SELECT * FROM tasks WHERE done = 0 ORDER BY due ASC LIMIT 5').all(),
      recentComms: db.prepare(`
        SELECT cm.*, c.name as client_name FROM communications cm
        LEFT JOIN clients c ON c.id = cm.client_id
        ORDER BY cm.created_at DESC LIMIT 5
      `).all(),
    };
  });
}
