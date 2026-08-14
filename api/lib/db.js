import { createClient } from '@libsql/client';

let db = null;

// Remove BOM (Byte Order Mark) se presente
function stripBOM(str) {
  if (!str) return str;
  return str.replace(/^\uFEFF/, '');
}

export function getDB() {
  if (db) return db;

  // Em produção, usar Turso
  const tursoUrl = stripBOM(process.env.TURSO_DATABASE_URL);
  if (tursoUrl) {
    db = createClient({
      url: tursoUrl,
      authToken: stripBOM(process.env.TURSO_AUTH_TOKEN),
    });
  } else {
    // Em desenvolvimento, usar SQLite local
    db = createClient({
      url: 'file:./local.db',
    });
  }

  return db;
}

export async function initDB() {
  const db = getDB();

  // Criar tabelas se não existirem
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

  // Índices para consultas rápidas
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_events_page ON events(page)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_events_event ON events(event)
  `);

  console.log('Database initialized');
}
