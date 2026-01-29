const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://tribute_xk1c_user:gaThenQOgEorYlzWspehJ5dtfd5WUtiM@dpg-d5trnlp4tr6s739isoog-a.ohio-postgres.render.com/tribute_xk1c';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

let schemaReady;

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tributes (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      relationship TEXT,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function respondJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

module.exports = async (req, res) => {
  try {
    if (!schemaReady) {
      schemaReady = ensureSchema();
    }
    await schemaReady;

    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT name, relationship, message, created_at FROM tributes ORDER BY created_at DESC'
      );
      respondJson(res, 200, result.rows);
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', async () => {
        let payload;
        try {
          payload = body ? JSON.parse(body) : {};
        } catch (error) {
          respondJson(res, 400, { error: 'Invalid JSON payload.' });
          return;
        }

        const { name, relationship, message } = payload || {};
        if (!name || !message) {
          respondJson(res, 400, { error: 'Name and tribute message are required.' });
          return;
        }

        try {
          const result = await pool.query(
            'INSERT INTO tributes (name, relationship, message) VALUES ($1, $2, $3) RETURNING name, relationship, message, created_at',
            [name, relationship || null, message]
          );
          respondJson(res, 201, result.rows[0]);
        } catch (error) {
          respondJson(res, 500, { error: 'Failed to save tribute.' });
        }
      });
      return;
    }

    res.setHeader('Allow', 'GET, POST');
    respondJson(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    respondJson(res, 500, { error: 'Server error.' });
  }
};
