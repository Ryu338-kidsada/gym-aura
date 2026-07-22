import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pg from 'pg'

const { Pool } = pg
const app = express()
const port = process.env.PORT || 3000
const secret = process.env.JWT_SECRET || 'change-this-secret-in-production'
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://gymaura:gymaura@localhost:5432/gymaura' })

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }))
app.use(express.json())

function tokenFor(user) { return jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '7d' }) }
function safeUser(user) { return { id: user.id, name: user.name, email: user.email } }
function isValidWorkout(body) { return body.title?.trim() && body.category?.trim() && Number.isFinite(Number(body.duration)) && Number(body.duration) > 0 && Number.isFinite(Number(body.calories)) && Number(body.calories) >= 0 && /^\d{4}-\d{2}-\d{2}$/.test(body.workout_date || '') }
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' })
  try { req.user = jwt.verify(token, secret); next() } catch { res.status(401).json({ message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' }) }
}

app.get('/api/health', async (_req, res) => { await pool.query('SELECT 1'); res.json({ status: 'ok' }) })
app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name?.trim() || !email?.trim() || !password || password.length < 6) return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ และรหัสผ่านอย่างน้อย 6 ตัวอักษร' })
    const hash = await bcrypt.hash(password, 12)
    const result = await pool.query('INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id,name,email', [name.trim(), email.trim().toLowerCase(), hash])
    const user = result.rows[0]
    res.status(201).json({ token: tokenFor(user), user: safeUser(user) })
  } catch (err) { if (err.code === '23505') return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' }); next(err) }
})
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email?.trim().toLowerCase()])
    const user = result.rows[0]
    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
    res.json({ token: tokenFor(user), user: safeUser(user) })
  } catch (err) { next(err) }
})
app.get('/api/workouts', authenticate, async (req, res, next) => { try { const result = await pool.query('SELECT id,title,category,duration,calories,workout_date::text,notes FROM workouts WHERE user_id=$1 ORDER BY workout_date DESC,id DESC', [req.user.id]); res.json(result.rows) } catch (err) { next(err) } })
app.post('/api/workouts', authenticate, async (req, res, next) => { try { if (!isValidWorkout(req.body)) return res.status(400).json({ message: 'ข้อมูลการออกกำลังกายไม่ถูกต้อง' }); const { title, category, duration, calories, workout_date, notes } = req.body; const result = await pool.query('INSERT INTO workouts (user_id,title,category,duration,calories,workout_date,notes) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,title,category,duration,calories,workout_date::text,notes', [req.user.id,title.trim(),category.trim(),duration,calories,workout_date,notes?.trim() || null]); res.status(201).json(result.rows[0]) } catch (err) { next(err) } })
app.put('/api/workouts/:id', authenticate, async (req, res, next) => { try { if (!isValidWorkout(req.body)) return res.status(400).json({ message: 'ข้อมูลการออกกำลังกายไม่ถูกต้อง' }); const { title, category, duration, calories, workout_date, notes } = req.body; const result = await pool.query('UPDATE workouts SET title=$1,category=$2,duration=$3,calories=$4,workout_date=$5,notes=$6,updated_at=now() WHERE id=$7 AND user_id=$8 RETURNING id,title,category,duration,calories,workout_date::text,notes', [title.trim(),category.trim(),duration,calories,workout_date,notes?.trim() || null,req.params.id,req.user.id]); if (!result.rowCount) return res.status(404).json({ message: 'ไม่พบรายการนี้' }); res.json(result.rows[0]) } catch (err) { next(err) } })
app.delete('/api/workouts/:id', authenticate, async (req, res, next) => { try { const result = await pool.query('DELETE FROM workouts WHERE id=$1 AND user_id=$2', [req.params.id,req.user.id]); if (!result.rowCount) return res.status(404).json({ message: 'ไม่พบรายการนี้' }); res.status(204).end() } catch (err) { next(err) } })
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ message: 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง' }) })
app.listen(port, () => console.log(`GYMAURA API listening on ${port}`))
