import Fastify from 'fastify';
import cors      from '@fastify/cors';
import helmet    from '@fastify/helmet';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import { createWriteStream, mkdirSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });
import { authRoutes }   from './routes/auth.js';
import { clientRoutes } from './routes/clients.js';
import { taskRoutes }   from './routes/tasks.js';
import { leadRoutes }   from './routes/leads.js';
import { pipelineRoutes } from './routes/pipeline.js';
import { userRoutes }   from './routes/users.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { searchRoutes }   from './routes/search.js';
import { campaignRoutes } from './routes/campaigns.js';
import { slaRoutes }        from './routes/sla.js';
import { analyticsRoutes }  from './routes/analytics.js';
import { productCatalogRoutes } from './routes/product-catalog.js';

const app = Fastify({ logger: { level: 'info' } });

await app.register(cors, { origin: true, credentials: true });
await app.register(helmet, { contentSecurityPolicy: false });
await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } }); // 50 MB
await app.register(staticFiles, { root: UPLOADS_DIR, prefix: '/api/uploads/' });

// Routes
await app.register(authRoutes,      { prefix: '/api/auth' });
await app.register(clientRoutes,    { prefix: '/api/clients' });
await app.register(taskRoutes,      { prefix: '/api/tasks' });
await app.register(leadRoutes,      { prefix: '/api/leads' });
await app.register(pipelineRoutes,  { prefix: '/api/pipeline' });
await app.register(userRoutes,      { prefix: '/api/users' });
await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
await app.register(searchRoutes,    { prefix: '/api/search' });
await app.register(campaignRoutes,  { prefix: '/api/campaigns' });
await app.register(slaRoutes,       { prefix: '/api/sla' });
await app.register(analyticsRoutes,     { prefix: '/api/analytics' });
await app.register(productCatalogRoutes, { prefix: '/api/product-catalog' });

app.get('/api/health', async () => ({ ok: true, ts: new Date().toISOString() }));

const PORT = Number(process.env.PORT) || 3001;
await app.listen({ port: PORT, host: '0.0.0.0' });
console.log(`\n  API ready → http://localhost:${PORT}\n`);
