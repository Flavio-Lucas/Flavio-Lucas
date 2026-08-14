import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { swaggerUI } from '@hono/swagger-ui';
import { eventsRouter } from './events/index.js';
import { healthRouter } from './health/index.js';
import { checkRateLimit, getClientIP } from './lib/utils.js';

const app = new OpenAPIHono();

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

// Documentação OpenAPI
app.doc('/api/docs', {
  openapi: '3.0.0',
  info: {
    title: 'Portfólio API',
    version: '1.0.0',
    description: 'API para analytics e health check do portfólio',
    contact: {
      name: 'Flavio Lucas',
      url: 'https://flaviolucas.dev',
    },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Desenvolvimento' },
    { url: 'https://api.flaviolucas.dev', description: 'Produção' },
  ],
});

// Swagger UI
app.get('/api/docs/ui', swaggerUI({ url: '/api/docs' }));

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
