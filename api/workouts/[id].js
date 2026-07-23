const { getPool } = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  const payload = requireAuth(req, res);
  if (!payload) return;

  const { id } = req.query;
  const pool = getPool();

  try {
    if (req.method === 'GET') {
      const { rows } = await pool.query(
        'SELECT * FROM workouts WHERE id = $1 AND user_id = $2',
        [id, payload.userId]
      );
      if (!rows[0]) return res.status(404).json({ error: 'ไม่พบรายการ' });
      return res.status(200).json({ workout: rows[0] });
    }

    if (req.method === 'PUT') {
      const { title, category, duration, calories, workoutDate, notes } = req.body || {};
      const { rows } = await pool.query(
        `UPDATE workouts
         SET title = $1, category = $2, duration = $3, calories = $4,
             workout_date = $5, notes = $6, updated_at = NOW()
         WHERE id = $7 AND user_id = $8
         RETURNING *`,
        [title, category, duration, calories, workoutDate, notes, id, payload.userId]
      );
      if (!rows[0]) return res.status(404).json({ error: 'ไม่พบรายการ' });
      return res.status(200).json({ workout: rows[0] });
    }

    if (req.method === 'DELETE') {
      const { rowCount } = await pool.query(
        'DELETE FROM workouts WHERE id = $1 AND user_id = $2',
        [id, payload.userId]
      );
      if (rowCount === 0) return res.status(404).json({ error: 'ไม่พบรายการ' });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('workouts [id] error:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
  }
};
