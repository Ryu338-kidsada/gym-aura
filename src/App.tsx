import { useEffect, useMemo, useState } from 'react'
import { Activity, CalendarDays, ChevronRight, Dumbbell, Flame, LogOut, Pencil, Plus, Trash2, X } from 'lucide-react'
import { api } from './api'
import type { User, Workout } from './types'

type Form = Omit<Workout, 'id'>
const today = new Date().toISOString().slice(0, 10)
const emptyForm: Form = { title: '', category: 'เวทเทรนนิ่ง', duration: 45, calories: 250, workout_date: today, notes: '' }
const categories = ['เวทเทรนนิ่ง', 'คาร์ดิโอ', 'โยคะ', 'พิลาทิส', 'กีฬา']

function Auth({ onAuthenticated }: { onAuthenticated: (user: User, token: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('demo@gymaura.com')
  const [password, setPassword] = useState('demo1234')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try { const result = mode === 'login' ? await api.login(email, password) : await api.register(name, email, password); onAuthenticated(result.user, result.token) }
    catch (err) { setError(err instanceof Error ? err.message : 'ไม่สามารถเข้าสู่ระบบได้') }
    finally { setLoading(false) }
  }
  return <main className="auth-page"><section className="auth-intro"><div className="brand"><span className="brand-mark"><Dumbbell size={22}/></span> GYMAURA</div><div><p className="eyebrow">MOVE WITH PURPOSE</p><h1>ทุกการขยับ<br/>คือพลังของคุณ</h1><p className="intro-copy">บันทึกทุกการออกกำลังกาย และเห็นความสม่ำเสมอของตัวเองได้ง่าย ๆ ในที่เดียว</p></div><div className="quote">“Small steps every day.”</div></section><section className="auth-panel"><form onSubmit={submit} className="auth-form"><div><p className="eyebrow">WELCOME TO GYMAURA</p><h2>{mode === 'login' ? 'ยินดีต้อนรับกลับ' : 'เริ่มต้นวันนี้'}</h2><p className="muted">{mode === 'login' ? 'เข้าสู่ระบบเพื่อดูความก้าวหน้าของคุณ' : 'สร้างบัญชีเพื่อเริ่มบันทึกการออกกำลังกาย'}</p></div>{mode === 'register' && <label>ชื่อที่แสดง<input required value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อของคุณ" /></label>}<label>อีเมล<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@email.com" /></label><label>รหัสผ่าน<input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร" /></label>{error && <p className="error">{error}</p>}<button className="primary" disabled={loading}>{loading ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}<ChevronRight size={18}/></button><p className="switch">{mode === 'login' ? 'ยังไม่มีบัญชี?' : 'มีบัญชีอยู่แล้ว?'} <button type="button" onClick={() => {setMode(mode === 'login' ? 'register' : 'login'); setError('')}}>{mode === 'login' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</button></p><p className="demo-note">ทดลองใช้: demo@gymaura.com / demo1234</p></form></section></main>
}

function WorkoutModal({ workout, onClose, onSave }: { workout: Workout | null; onClose: () => void; onSave: (data: Form) => Promise<void> }) {
  const [form, setForm] = useState<Form>(workout ? { ...workout } : emptyForm); const [loading, setLoading] = useState(false)
  const update = <K extends keyof Form>(key: K, value: Form[K]) => setForm(prev => ({...prev, [key]: value}))
  async function submit(e: React.FormEvent) { e.preventDefault(); setLoading(true); try { await onSave(form) } finally { setLoading(false) } }
  return <div className="modal-backdrop"><form onSubmit={submit} className="modal"><div className="modal-head"><div><p className="eyebrow">WORKOUT LOG</p><h2>{workout ? 'แก้ไขรายการ' : 'บันทึกการออกกำลังกาย'}</h2></div><button type="button" className="icon-button" onClick={onClose}><X/></button></div><label>ชื่อกิจกรรม<input autoFocus required value={form.title} onChange={e => update('title', e.target.value)} placeholder="เช่น Upper body workout" /></label><label>ประเภท<select value={form.category} onChange={e => update('category', e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><div className="form-grid"><label>ระยะเวลา (นาที)<input required min="1" type="number" value={form.duration} onChange={e => update('duration', Number(e.target.value))}/></label><label>แคลอรี (kcal)<input required min="0" type="number" value={form.calories} onChange={e => update('calories', Number(e.target.value))}/></label></div><label>วันที่<input required type="date" value={form.workout_date} onChange={e => update('workout_date', e.target.value)} /></label><label>โน้ต <span className="optional">(ไม่บังคับ)</span><textarea value={form.notes || ''} onChange={e => update('notes', e.target.value)} placeholder="วันนี้รู้สึกอย่างไรบ้าง?" rows={3}/></label><button className="primary" disabled={loading}>{loading ? 'กำลังบันทึก...' : 'บันทึกรายการ'}</button></form></div>
}

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [editing, setEditing] = useState<Workout | null | undefined>(undefined)
  const load = async () => { try { setLoading(true); setWorkouts(await api.workouts()) } catch (e) { setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ') } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  const stats = useMemo(() => ({ count: workouts.length, minutes: workouts.reduce((s,w) => s+w.duration,0), calories: workouts.reduce((s,w) => s+w.calories,0) }), [workouts])
  const save = async (data: Form) => { try { editing ? await api.updateWorkout(editing.id, data) : await api.createWorkout(data); setEditing(undefined); await load() } catch (e) { alert(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ') } }
  const remove = async (id: number) => { if (!confirm('ต้องการลบรายการนี้ใช่หรือไม่?')) return; try { await api.deleteWorkout(id); await load() } catch (e) { alert(e instanceof Error ? e.message : 'ลบไม่สำเร็จ') } }
  return <main className="dashboard"><header><div className="brand"><span className="brand-mark"><Dumbbell size={20}/></span> GYMAURA</div><div className="user-nav"><span>สวัสดี, <b>{user.name}</b></span><button className="logout" onClick={onLogout} title="ออกจากระบบ"><LogOut size={19}/></button></div></header><section className="dashboard-content"><div className="hero"><div><p className="eyebrow">YOUR FITNESS JOURNEY</p><h1>สวัสดี, {user.name.split(' ')[0]} <span>✦</span></h1><p>ดูแลตัวเองอย่างต่อเนื่อง แล้วคุณจะเห็นการเปลี่ยนแปลง</p></div><button className="primary" onClick={() => setEditing(null)}><Plus size={19}/> เพิ่มรายการ</button></div><section className="stats"><article><span className="stat-icon green"><Activity/></span><div><p>ออกกำลังกาย</p><strong>{stats.count} <small>ครั้ง</small></strong></div></article><article><span className="stat-icon orange"><Flame/></span><div><p>เผาผลาญทั้งหมด</p><strong>{stats.calories.toLocaleString()} <small>kcal</small></strong></div></article><article><span className="stat-icon blue"><CalendarDays/></span><div><p>เวลาออกกำลังกาย</p><strong>{stats.minutes.toLocaleString()} <small>นาที</small></strong></div></article></section><section className="log-section"><div className="section-head"><div><p className="eyebrow">ACTIVITY LOG</p><h2>การออกกำลังกายของฉัน</h2></div></div>{loading ? <div className="empty">กำลังโหลดข้อมูล...</div> : error ? <div className="empty error">{error}</div> : workouts.length === 0 ? <div className="empty"><Dumbbell size={34}/><h3>ยังไม่มีรายการออกกำลังกาย</h3><p>เริ่มบันทึกกิจกรรมแรกของคุณได้เลย</p><button className="text-button" onClick={() => setEditing(null)}>เพิ่มรายการแรก</button></div> : <div className="workout-list">{workouts.map(w => <article className="workout" key={w.id}><div className="workout-symbol"><Dumbbell size={20}/></div><div className="workout-main"><h3>{w.title}</h3><p>{w.category} · {new Intl.DateTimeFormat('th-TH', { day:'numeric', month:'short', year:'numeric' }).format(new Date(`${w.workout_date}T00:00:00`))}</p>{w.notes && <small>{w.notes}</small>}</div><div className="workout-metric"><strong>{w.duration}</strong><span>นาที</span></div><div className="workout-metric flame"><strong>{w.calories}</strong><span>kcal</span></div><div className="actions"><button className="icon-button" onClick={() => setEditing(w)} aria-label="แก้ไข"><Pencil size={17}/></button><button className="icon-button delete" onClick={() => void remove(w.id)} aria-label="ลบ"><Trash2 size={17}/></button></div></article>)}</div>}</section></section>{editing !== undefined && <WorkoutModal workout={editing} onClose={() => setEditing(undefined)} onSave={save}/>}</main>
}

export default function App() {
  const storedUser = localStorage.getItem('gymaura_user'); const [user, setUser] = useState<User | null>(storedUser ? JSON.parse(storedUser) : null)
  const authenticated = (nextUser: User, token: string) => { localStorage.setItem('gymaura_token', token); localStorage.setItem('gymaura_user', JSON.stringify(nextUser)); setUser(nextUser) }
  const logout = () => { localStorage.removeItem('gymaura_token'); localStorage.removeItem('gymaura_user'); setUser(null) }
  return user ? <Dashboard user={user} onLogout={logout} /> : <Auth onAuthenticated={authenticated}/>
}
