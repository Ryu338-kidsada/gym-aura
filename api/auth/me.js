const { getPool } = require('../../lib/db');
const { requireAuth } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  const payload = requireAuth(req, res);
  if (!payload) return; // requireAuth ส่ง response 401 ให้แล้ว

  try {
    const pool = getPool();
    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [
      payload.userId,
    ]);

    if (!rows[0]) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    }

    return res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.error('me error:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
  }
};
