import { Hono } from 'hono';
import { getDB } from '../lib/db.js';

export const healthRouter = new Hono();

// Inicializar tabelas se necessário
async function initTables(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event TEXT NOT NULL,
      page TEXT NOT NULL,
      referrer TEXT,
      user_agent TEXT,
      ip_hash TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_events_page ON events(page)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_events_event ON events(event)`);
}

// GET /api/health - Health check
healthRouter.get('/', async (c) => {
  const startTime = Date.now();
  const services = {
    api: { status: 'responsive' },
    database: { status: 'not_configured' },
  };

  // Verificar database apenas se configurado
  if (process.env.TURSO_DATABASE_URL) {
    try {
      const db = getDB();
      const dbStart = Date.now();
      await db.execute('SELECT 1');
      await initTables(db);
      const dbLatency = Date.now() - dbStart;
      services.database = {
        status: 'connected',
        latency: `${dbLatency}ms`,
      };
    } catch (error) {
      services.database = {
        status: 'disconnected',
        error: error.message,
      };
    }
  }

  const latency = Date.now() - startTime;

  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    latency: `${latency}ms`,
    services,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.VERCEL_ENV || 'development',
  });
});

// GET /api/health/check - Verificação simplificada (para o frontend)
healthRouter.get('/check', async (c) => {
  // API sempre está disponível (database é opcional)
  return c.json({
    available: true,
    message: 'API is operational',
    database: process.env.TURSO_DATABASE_URL ? 'configured' : 'not_configured',
  });
});
