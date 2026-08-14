import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { rateLimiter } from 'hono-rate-limiter';
import { eventsRouter } from './events/index.js';
import { healthRouter } from './health/index.js';

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

// Rate limiting
app.use('/api/*', rateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por IP
  keyGenerator: (c) => {
    // Usar X-Forwarded-For em produção, fallback para header
    return c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  },
  handler: (c) => {
    return c.json({ error: 'Rate limit exceeded' }, 429);
  },
}));

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
