import { serve } from '@hono/node-server';
import app from './index.js';

const port = process.env.PORT || 3000;

console.log(`
🚀 API running at http://localhost:${port}

📖 Documentação:
   Swagger UI:  http://localhost:${port}/api/docs/ui
   OpenAPI JSON: http://localhost:${port}/api/docs

📊 Health check: http://localhost:${port}/api/health
`);

serve({
  fetch: app.fetch,
  port,
});
