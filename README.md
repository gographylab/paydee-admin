# Paydee Admin Control

ระบบสำหรับจัดการหลังบ้าน (Admin Control) ของโปรเจกต์ Paydee

## สิ่งที่ต้องเตรียม (Prerequisites)

- [Node.js](https://nodejs.org/) (เวอร์ชัน 18 หรือสูงกว่า)
- npm, yarn หรือ pnpm

## วิธีติดตั้ง (Installation)

1. Clone โปรเจกต์นี้ลงมาที่เครื่องของคุณ
   ```bash
   git clone <url-ของ-repository>
   ```

2. เข้าไปที่โฟลเดอร์โปรเจกต์
   ```bash
   cd paydee-admin
   ```

3. ติดตั้ง Dependencies ต่างๆ
   ```bash
   npm install
   # หรือ yarn install
   ```

## การตั้งค่า Environment Variables

คัดลอกไฟล์ `.env.example` ไปเป็น `.env` (ถ้ามี) แล้วแก้ไขตั้งค่าต่างๆ ให้ตรงกับระบบของคุณ

```bash
cp .env.example .env
```

## การรันโปรเจกต์ (Running the app)

รันคำสั่งด้านล่างเพื่อเริ่มต้นแอปพลิเคชันในโหมด Development:

```bash
npm run dev
# หรือ yarn dev
```

แอปพลิเคชันจะเปิดขึ้นมาที่ `http://localhost:3000` (หรือตามพอร์ตที่ระบบกำหนดไว้)

## การบิลด์สำหรับ Production (Build)

```bash
npm run build
npm start
```