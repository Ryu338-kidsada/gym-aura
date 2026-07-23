const { getPool } = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  const payload = requireAuth(req, res);
  if (!payload) return;

  const pool = getPool();

  try {
    if (req.method === 'GET') {
      const { rows } = await pool.query(
        'SELECT * FROM workouts WHERE user_id = $1 ORDER BY workout_date DESC, id DESC',
        [payload.userId]
      );
      return res.status(200).json(rows); // ส่งเป็น array ตรงๆ ไม่ wrap ด้วย object
    }

    if (req.method === 'POST') {
      const { title, category, duration, calories, workoutDate, notes } = req.body || {};
      if (!title || !category || !duration || !workoutDate) {
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });
      }
      const { rows } = await pool.query(
        `INSERT INTO workouts (user_id, title, category, duration, calories, workout_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [payload.userId, title, category, duration, calories || 0, workoutDate, notes || null]
      );
      return res.status(201).json({ workout: rows[0] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('workouts index error:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
  }
};
