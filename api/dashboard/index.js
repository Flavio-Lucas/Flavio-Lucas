import { Hono } from 'hono';
import { getDB } from '../lib/db.js';

export const dashboardRouter = new Hono();

// GET /api/dashboard - Métricas agregadas
dashboardRouter.get('/', async (c) => {
  try {
    const db = getDB();
    
    // Total de eventos
    const totalResult = await db.execute('SELECT COUNT(*) as total FROM events');
    const total = Number(totalResult.rows[0]?.total) || 0;
    
    // Últimas 24 horas
    const last24hResult = await db.execute(`
      SELECT COUNT(*) as count FROM events
      WHERE created_at >= datetime('now', '-1 day')
    `);
    const last24h = Number(last24hResult.rows[0]?.count) || 0;
    
    // Últimos 7 dias
    const last7dResult = await db.execute(`
      SELECT COUNT(*) as count FROM events
      WHERE created_at >= datetime('now', '-7 days')
    `);
    const last7d = Number(last7dResult.rows[0]?.count) || 0;
    
    // Visitantes únicos (por IP hash)
    const uniqueResult = await db.execute(`
      SELECT COUNT(DISTINCT ip_hash) as count FROM events
      WHERE created_at >= datetime('now', '-7 days')
    `);
    const uniqueVisitors = Number(uniqueResult.rows[0]?.count) || 0;
    
    // Eventos por tipo
    const byTypeResult = await db.execute(`
      SELECT event, COUNT(*) as count
      FROM events
      GROUP BY event
      ORDER BY count DESC
    `);
    
    // Top páginas
    const topPagesResult = await db.execute(`
      SELECT page, COUNT(*) as count
      FROM events
      WHERE event = 'page_view'
      GROUP BY page
      ORDER BY count DESC
      LIMIT 10
    `);
    
    // Últimos 7 dias por dia
    const dailyResult = await db.execute(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM events
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    // Referrers
    const referrersResult = await db.execute(`
      SELECT referrer, COUNT(*) as count
      FROM events
      WHERE referrer IS NOT NULL AND referrer != ''
      GROUP BY referrer
      ORDER BY count DESC
      LIMIT 10
    `);
    
    return c.json({
      summary: {
        total,
        last24h,
        last7d,
        uniqueVisitors,
      },
      byType: byTypeResult.rows,
      topPages: topPagesResult.rows,
      daily: dailyResult.rows,
      referrers: referrersResult.rows,
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({ error: 'Failed to fetch dashboard data' }, 500);
  }
});

// GET /api/dashboard/daily - Métricas por dia
dashboardRouter.get('/daily', async (c) => {
  try {
    const db = getDB();
    const days = Number(c.req.query('days')) || 30;
    
    const result = await db.execute({
      sql: `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM events
        WHERE created_at >= datetime('now', '-' || ? || ' days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,
      args: [days],
    });
    
    return c.json({ daily: result.rows });
    
  } catch (error) {
    console.error('Daily error:', error);
    return c.json({ error: 'Failed to fetch daily data' }, 500);
  }
});

// GET /api/dashboard/pages - Métricas por página
dashboardRouter.get('/pages', async (c) => {
  try {
    const db = getDB();
    
    const result = await db.execute(`
      SELECT page, COUNT(*) as count
      FROM events
      WHERE event = 'page_view'
      GROUP BY page
      ORDER BY count DESC
    `);
    
    return c.json({ pages: result.rows });
    
  } catch (error) {
    console.error('Pages error:', error);
    return c.json({ error: 'Failed to fetch pages data' }, 500);
  }
});
