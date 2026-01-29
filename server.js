const path = require('path');
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://tribute_xk1c_user:gaThenQOgEorYlzWspehJ5dtfd5WUtiM@dpg-d5trnlp4tr6s739isoog-a.ohio-postgres.render.com/tribute_xk1c';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

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

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/api/tributes', async (_req, res) => {
    try {
        const result = await pool.query(
            'SELECT name, relationship, message, created_at FROM tributes ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load tributes.' });
    }
});

app.post('/api/tributes', async (req, res) => {
    const { name, relationship, message } = req.body || {};

    if (!name || !message) {
        res.status(400).json({ error: 'Name and tribute message are required.' });
        return;
    }

    try {
        const result = await pool.query(
            'INSERT INTO tributes (name, relationship, message) VALUES ($1, $2, $3) RETURNING name, relationship, message, created_at',
            [name, relationship || null, message]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save tribute.' });
    }
});

ensureSchema()
    .then(() => {
        app.listen(port, () => {
            console.log(`Tribute server running on http://localhost:${port}`);
        });
    })
    .catch(() => {
        process.exit(1);
    });
