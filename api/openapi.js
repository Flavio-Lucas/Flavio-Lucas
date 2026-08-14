import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';

const app = new OpenAPIHono();

// Schema de Evento
const EventSchema = z.object({
  event: z.enum(['page_view', 'section_view', 'project_click', 'cv_download', 'cv_api_fallback'])
    .openapi({ example: 'page_view', description: 'Tipo do evento' }),
  page: z.string().openapi({ example: '/', description: 'Página visitada' }),
  referrer: z.string().optional().openapi({ example: 'https://google.com', description: 'Referrer URL' }),
  metadata: z.object({
    screen: z.string().optional().openapi({ example: '1920x1080' }),
    language: z.string().optional().openapi({ example: 'pt-BR' }),
  }).optional(),
});

const EventResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
});

const ErrorResponseSchema = z.object({
  error: z.string().openapi({ example: 'Rate limit exceeded' }),
});

const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']).openapi({ example: 'healthy' }),
  timestamp: z.string().openapi({ example: '2026-08-14T10:30:00Z' }),
  latency: z.string().openapi({ example: '15ms' }),
  services: z.object({
    database: z.object({
      status: z.string().openapi({ example: 'connected' }),
      latency: z.string().openapi({ example: '5ms' }),
    }),
    api: z.object({
      status: z.string().openapi({ example: 'responsive' }),
    }),
  }),
  version: z.string().openapi({ example: '1.0.0' }),
  environment: z.string().openapi({ example: 'development' }),
});

const HealthCheckSchema = z.object({
  available: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: 'API is operational' }),
});

const StatsResponseSchema = z.object({
  total: z.number().openapi({ example: 142 }),
  last24h: z.number().openapi({ example: 23 }),
  byType: z.array(z.object({
    event: z.string(),
    count: z.number(),
  })),
});

// Rota: Registrar Evento
const postEventRoute = createRoute({
  method: 'post',
  path: '/api/events',
  tags: ['Events'],
  summary: 'Registrar um evento',
  description: 'Registra um evento de visitação no portfólio. Rate limit de 100 requests por minuto por IP.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: EventSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: EventResponseSchema } },
      description: 'Evento registrado com sucesso',
    },
    400: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Dados inválidos',
    },
    429: {
      content: { 'application/json': { schema: ErrorResponseSchema } },
      description: 'Rate limit excedido',
    },
  },
});

// Rota: Health Check
const getHealthRoute = createRoute({
  method: 'get',
  path: '/api/health',
  tags: ['Health'],
  summary: 'Verificar status da API',
  description: 'Retorna o status completo da API incluindo latência e status do database.',
  responses: {
    200: {
      content: { 'application/json': { schema: HealthResponseSchema } },
      description: 'API saudável',
    },
    503: {
      content: { 'application/json': { schema: HealthResponseSchema } },
      description: 'API com problemas',
    },
  },
});

// Rota: Health Check Simples
const getHealthCheckRoute = createRoute({
  method: 'get',
  path: '/api/health/check',
  tags: ['Health'],
  summary: 'Verificação simples de saúde',
  description: 'Verificação simplificada para uso do frontend. Retorna apenas se a API está disponível.',
  responses: {
    200: {
      content: { 'application/json': { schema: HealthCheckSchema } },
      description: 'Status da API',
    },
  },
});

// Rota: Estatísticas
const getStatsRoute = createRoute({
  method: 'get',
  path: '/api/events/stats',
  tags: ['Events'],
  summary: 'Obter estatísticas',
  description: 'Retorna estatísticas básicas dos eventos registrados.',
  responses: {
    200: {
      content: { 'application/json': { schema: StatsResponseSchema } },
      description: 'Estatísticas retornadas',
    },
  },
});

// Registrar rotas (implementação será feita nos arquivos separados)
app.openapi(postEventRoute, async (c) => {
  // Será implementado no events/index.js
  return c.json({ success: true }, 201);
});

app.openapi(getHealthRoute, async (c) => {
  // Será implementado no health/index.js
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    latency: '0ms',
    services: {
      database: { status: 'connected', latency: '0ms' },
      api: { status: 'responsive' },
    },
    version: '1.0.0',
    environment: 'development',
  });
});

app.openapi(getHealthCheckRoute, async (c) => {
  return c.json({ available: true, message: 'API is operational' });
});

app.openapi(getStatsRoute, async (c) => {
  return c.json({ total: 0, last24h: 0, byType: [] });
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

export { app as openApiApp };
export { postEventRoute, getHealthRoute, getHealthCheckRoute, getStatsRoute };
