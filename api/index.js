import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { eventsRouter } from './events/index.js';
import { healthRouter } from './health/index.js';
import { checkRateLimit, getClientIP } from './lib/utils.js';

const app = new Hono();

// Middleware global
app.use('*', logger());
app.use('*', secureHeaders());

// CORS
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400,
}));

// Rate limiting manual
app.use('/api/*', async (c, next) => {
  const ip = getClientIP(c);
  if (!checkRateLimit(ip)) {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }
  await next();
});

// Rotas
app.route('/api/events', eventsRouter);
app.route('/api/health', healthRouter);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
