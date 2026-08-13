import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export async function searchRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: requireAuth }, async (req) => {
    const q = '%' + ((req.query as { q?: string }).q ?? '') + '%';
    return {
      clients: db.prepare("SELECT id,name,city,industry FROM clients WHERE name LIKE ? OR inn LIKE ? OR industry LIKE ? LIMIT 6").all(q,q,q),
      tasks:   db.prepare("SELECT id,title,client_name FROM tasks WHERE title LIKE ? LIMIT 4").all(q),
      leads:   db.prepare("SELECT id,name,contact FROM leads WHERE name LIKE ? LIMIT 4").all(q),
    };
  });
}
