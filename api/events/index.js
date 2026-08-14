import { Hono } from 'hono';
import { getDB } from '../lib/db.js';
import { hashIP, sanitizeUserAgent, getClientIP, checkRateLimit } from '../lib/utils.js';

export const eventsRouter = new Hono();

// POST /api/events - Registrar evento
eventsRouter.post('/', async (c) => {
  // Verificar se database está configurado
  if (!process.env.TURSO_DATABASE_URL) {
    return c.json({
      error: 'Database not configured',
      message: 'Events API requires TURSO_DATABASE_URL environment variable',
    }, 503);
  }

  try {
    // Rate limit check
    const ip = getClientIP(c);
    if (!checkRateLimit(ip)) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    const body = await c.req.json();

    // Validação básica
    if (!body.event || !body.page) {
      return c.json({ error: 'Missing required fields: event, page' }, 400);
    }

    // Valores permitidos para event
    const allowedEvents = [
      'page_view',
      'section_view',
      'project_click',
      'cv_download',
      'cv_api_fallback'
    ];

    if (!allowedEvents.includes(body.event)) {
      return c.json({ error: 'Invalid event type' }, 400);
    }

    // Sanitizar dados
    const ipHash = hashIP(ip);
    const userAgent = sanitizeUserAgent(c.req.header('user-agent'));

    // Preparar metadata
    const metadata = {};
    if (body.metadata?.screen) metadata.screen = body.metadata.screen;
    if (body.metadata?.language) metadata.language = body.metadata.language;

    // Inserir no database
    const db = getDB();
    await db.execute({
      sql: `INSERT INTO events (event, page, referrer, user_agent, ip_hash, metadata)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        body.event,
        body.page,
        body.referrer || null,
        userAgent,
        ipHash,
        Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : null,
      ],
    });

    return c.json({ success: true }, 201);

  } catch (error) {
    console.error('Error tracking event:', error);
    return c.json({ error: 'Failed to track event' }, 500);
  }
});

// GET /api/events/stats - Estatísticas básicas
eventsRouter.get('/stats', async (c) => {
  // Verificar se database está configurado
  if (!process.env.TURSO_DATABASE_URL) {
    return c.json({
      error: 'Database not configured',
      message: 'Stats API requires TURSO_DATABASE_URL environment variable',
    }, 503);
  }

  try {
    const db = getDB();

    // Total de eventos
    const totalResult = await db.execute('SELECT COUNT(*) as total FROM events');
    const total = totalResult.rows[0]?.total || 0;

    // Eventos por tipo
    const byTypeResult = await db.execute(`
      SELECT event, COUNT(*) as count
      FROM events
      GROUP BY event
      ORDER BY count DESC
    `);

    // Últimas 24 horas
    const last24hResult = await db.execute(`
      SELECT COUNT(*) as count
      FROM events
      WHERE created_at >= datetime('now', '-1 day')
    `);
    const last24h = last24hResult.rows[0]?.count || 0;

    return c.json({
      total,
      last24h,
      byType: byTypeResult.rows,
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});
