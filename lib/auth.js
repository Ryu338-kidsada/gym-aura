const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'gymaura_token';
const JWT_SECRET = process.env.JWT_SECRET;

function signToken(payload) {
  if (!JWT_SECRET) throw new Error('Missing JWT_SECRET environment variable');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${isProd ? '; Secure' : ''}`
  );
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}

function getTokenFromReq(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  return match.split('=')[1];
}

// ใช้ตรวจ auth ใน endpoint ที่ต้อง login ก่อน
// return payload ถ้าผ่าน, หรือ response 401 แล้ว return null ถ้าไม่ผ่าน
function requireAuth(req, res) {
  const token = getTokenFromReq(req);
  if (!token) {
    res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    return null;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    return null;
  }
  return payload; // { userId }
}

module.exports = {
  signToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  getTokenFromReq,
  requireAuth,
};
