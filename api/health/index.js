import { Hono } from 'hono';
import { getDB } from '../lib/db.js';

export const healthRouter = new Hono();

// GET /api/health - Health check
healthRouter.get('/', async (c) => {
  const startTime = Date.now();

  try {
    // Verificar database
    const db = getDB();
    const dbStart = Date.now();
    await db.execute('SELECT 1');
    const dbLatency = Date.now() - dbStart;

    const latency = Date.now() - startTime;

    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      latency: `${latency}ms`,
      services: {
        database: {
          status: 'connected',
          latency: `${dbLatency}ms`,
        },
        api: {
          status: 'responsive',
        },
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.VERCEL_ENV || 'development',
    });

  } catch (error) {
    console.error('Health check failed:', error);

    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        database: {
          status: 'disconnected',
          error: error.message,
        },
        api: {
          status: 'degraded',
        },
      },
    }, 503);
  }
});

// GET /api/health/check - Verificação detalhada (para o frontend)
healthRouter.get('/check', async (c) => {
  try {
    const db = getDB();
    await db.execute('SELECT 1');

    return c.json({
      available: true,
      message: 'API is operational',
    });

  } catch (error) {
    return c.json({
      available: false,
      message: 'API is temporarily unavailable',
    });
  }
});
