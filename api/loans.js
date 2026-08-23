// Vercel serverless function: /api/loans
// Persists the entire loan book to a Turso (libSQL) database.
//
// Requires these environment variables to be set in your Vercel project:
//   TURSO_DATABASE_URL   e.g. libsql://your-db-name-yourusername.turso.io
//   TURSO_AUTH_TOKEN     the auth token for that database

const { createClient } = require('@libsql/client');

let clientReady;

function getClient() {
  if (!clientReady) {
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    clientReady = client
      .execute(
        `CREATE TABLE IF NOT EXISTS kv_store (
           key TEXT PRIMARY KEY,
           value TEXT NOT NULL,
           updated_at TEXT
         )`
      )
      .then(() => client);
  }
  return clientReady;
}

module.exports = async (req, res) => {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    res.status(500).json({
      error:
        'Missing TURSO_DATABASE_URL / TURSO_AUTH_TOKEN environment variables. Set them in your Vercel project settings.',
    });
    return;
  }

  try {
    const client = await getClient();

    if (req.method === 'GET') {
      const result = await client.execute({
        sql: 'SELECT value FROM kv_store WHERE key = ?',
        args: ['loans'],
      });
      const loans = result.rows.length ? JSON.parse(result.rows[0].value) : [];
      res.status(200).json({ loans });
      return;
    }

    if (req.method === 'POST') {
      const loans = Array.isArray(req.body?.loans) ? req.body.loans : [];
      await client.execute({
        sql: `INSERT INTO kv_store (key, value, updated_at) VALUES ('loans', ?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        args: [JSON.stringify(loans), new Date().toISOString()],
      });
      res.status(200).json({ ok: true, count: loans.length });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
};
