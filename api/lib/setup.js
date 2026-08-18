import { createClient } from '@libsql/client';

// Script para setup do database (desenvolvimento)
async function setup() {
  console.log('Setting up database...');

  const db = createClient({
    url: 'file:./local.db',
  });

  // Criar tabelas
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

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_events_page ON events(page)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_events_event ON events(event)
  `);

  console.log('✓ Database setup complete');
  console.log('✓ Local database created: ./local.db');

  process.exit(0);
}

setup().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
