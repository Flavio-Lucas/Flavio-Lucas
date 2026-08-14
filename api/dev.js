import { serve } from '@hono/node-server';
import app from './index.js';

const port = process.env.PORT || 3000;

console.log(`🚀 API running at http://localhost:${port}`);
console.log(`📊 Health check: http://localhost:${port}/api/health`);
console.log(`📝 Events: POST http://localhost:${port}/api/events`);

serve({
  fetch: app.fetch,
  port,
});
