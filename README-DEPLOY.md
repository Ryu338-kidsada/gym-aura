# วิธีติดตั้งไฟล์ชุดนี้เข้า repo gym-aura

## 1. Copy โฟลเดอร์ไปวางที่ root ของ repo
คัดลอกโฟลเดอร์ `api/` และ `lib/` ทั้งหมด ไปวางที่ **root** ของโปรเจกต์
(ระดับเดียวกับ `package.json`, `src/`, `Dockerfile`) โครงสร้างสุดท้ายจะเป็น:

```
gym-aura/
├── api/              ← ใหม่
│   ├── auth/
│   │   ├── login.js
│   │   ├── register.js
│   │   ├── logout.js
│   │   └── me.js
│   └── workouts/
│       ├── index.js
│       └── [id].js
├── lib/              ← ใหม่
│   ├── db.js
│   └── auth.js
├── db/
├── server/           ← ของเดิม ยังเก็บไว้ได้ ไม่กระทบ (ใช้กับ Docker ต่อได้)
├── src/
├── package.json
└── ...
```

## 2. เพิ่ม dependencies
```bash
npm install pg bcryptjs jsonwebtoken --save
```
(ดูรายละเอียดใน `package-additions.json`)

## 3. ตั้งค่า Environment Variables บน Vercel

Vercel Dashboard → โปรเจกต์ → **Settings → Environment Variables** เพิ่ม:

| ชื่อ | ค่า |
|---|---|
| `DATABASE_URL` | connection string จาก Supabase (แบบ pooled ก็ได้) |
| `JWT_SECRET` | ค่าเดียวกับที่ตั้งใน `.env` สำหรับ Docker (หรือสุ่มใหม่ก็ได้ ถ้ายังไม่มีคนใช้งานจริง) |

## 4. รัน init.sql เข้า Supabase (ถ้ายังไม่ได้ทำ)
เข้า Supabase → SQL Editor → paste เนื้อหา `db/init.sql` (หรือชื่อไฟล์จริงในโฟลเดอร์ `db/`) → Run

## 5. ปรับโค้ด Frontend (สำคัญ — ต้องเช็ค 2 จุดนี้)

### 5.1 การเรียก fetch/axios ต้องส่ง cookie ไปด้วย
เพราะระบบใหม่นี้เก็บ token ใน **httpOnly cookie** ไม่ใช่ localStorage
ทุกจุดที่เรียก API เกี่ยวกับ auth หรือ workouts ต้องมี `credentials: 'include'`:

```js
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',   // ← ต้องมีบรรทัดนี้
  body: JSON.stringify({ email, password }),
});
```

ถ้าโค้ด frontend เดิมใช้ `axios` ให้ตั้ง:
```js
axios.defaults.withCredentials = true;
```

### 5.2 ถ้า frontend เดิมเก็บ token เองใน localStorage แล้วแปะ Authorization header
ระบบใหม่นี้ไม่ต้องทำแบบนั้นแล้ว (cookie จัดการให้อัตโนมัติ) ลบโค้ดส่วนที่จัดการ token เองออกได้เลย
แต่ถ้าอยากคงพฤติกรรมเดิมไว้ (ส่ง Bearer token) บอกผมได้ ผมจะปรับ `lib/auth.js` ให้รองรับทั้ง 2 แบบ

## 6. Commit + Push
```bash
git add api lib package.json package-lock.json
git commit -m "fix: add Vercel serverless API endpoints for auth and workouts"
git push
```

Vercel จะ auto-deploy ทันทีที่ push (ถ้าเชื่อม GitHub integration ไว้แล้ว)

## 7. ทดสอบ
เปิด `https://gym-aura-five.vercel.app` → เปิด F12 → Network tab → ลอง login
ควรเห็น `POST /api/auth/login` **status 200** (ไม่ใช่ 404 แล้ว)

---

## หมายเหตุสำคัญ
- โฟลเดอร์ `server/` เดิมไม่ต้องลบ ยังใช้กับ `docker compose up` ได้ตามปกติสำหรับตอน dev เครื่อง
- ไฟล์ชุดนี้เขียนตาม schema ใน `init.sql` ที่มี (users, workouts) ถ้า field ไหนในฟอร์ม frontend เดิมชื่อไม่ตรงกับที่ endpoint คาดหวัง (เช่น `workoutDate` vs `workout_date`) แจ้งมาได้ จะปรับให้ตรง
