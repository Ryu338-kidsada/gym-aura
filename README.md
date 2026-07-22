# GYMAURA

เว็บบันทึกการออกกำลังกายหน้าเดียว พร้อม Login และ CRUD สำหรับรายการออกกำลังกาย

## เริ่มใช้งานด้วย Docker

1. คัดลอก `.env.example` เป็น `.env` และกำหนด `JWT_SECRET` ที่ปลอดภัย
2. รัน `docker compose up --build`
3. เปิด http://localhost:8080

บัญชีตัวอย่างจะถูกสร้างเมื่อผู้ใช้สมัครครั้งแรก: `demo@gymaura.com` / `demo1234`

## รันสำหรับพัฒนา

ต้องมี PostgreSQL ที่ `localhost:5432` พร้อมฐานข้อมูลและข้อมูลเชื่อมต่อตามค่าเริ่มต้นใน `server/src/index.js`

```powershell
npm install
cd server; npm install
# terminal 1
cd server; npm run dev
# terminal 2
npm run dev
```

หน้าเว็บ dev server คือ http://localhost:5173 และ API คือ http://localhost:3000
