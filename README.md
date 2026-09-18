# 🐶 Simple Vue 3 + Dog CEO API (Dockerized)

โปรเจกต์เว็บแอปพลิเคชันอย่างง่ายด้วย Vue 3 สำหรับสุ่มดูรูปน้องหมาผ่าน [Dog CEO API](https://dog.ceo/dog-api/) พร้อมตั้งค่า Dockerfile แบบ Multi-stage และ Docker Compose

---

## 🚀 วิธีการรันโปรเจกต์

### ทางเลือกที่ 1: รันด้วย Docker (แนะนำ 🐳)

ไม่ต้องติดตั้ง Node.js ในเครื่อง เพียงแค่เปิด Docker แล้วรันคำสั่ง:

```bash
# สั่ง build และ start container
docker compose up --build -d
```

เปิดเบราว์เซอร์แล้วเข้าใช้งานได้ที่: **[http://localhost:8088](http://localhost:8088)**

หากต้องการหยุดการทำงาน:
```bash
docker compose down
```

---

### ทางเลือกที่ 2: รันด้วย Docker คำสั่งมาตรฐาน (docker build / run)

```bash
# 1. Build Docker image
docker build -t simple-dog-vue .

# 2. รัน container
docker run -d -p 8088:80 --name dog-app simple-dog-vue
```

---

### ทางเลือกที่ 3: รันในเครื่องด้วย Node.js / Vite (Local Dev)

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. เริ่ม dev server
npm run dev
```

เปิดเบราว์เซอร์ตามลิงก์ที่แสดงใน terminal (ปกติคือ `http://localhost:5173`)

---

## 📁 โครงสร้างโปรเจกต์

```text
├── index.html           # HTML Entry point
├── package.json         # กำหนด dependencies (Vue 3, Vite)
├── vite.config.js       # Vite configuration
├── src/
│   ├── App.vue          # ส่วนแสดงผลหลัก + เรียก Dog CEO API
│   └── main.js          # Mount Vue เข้ากับ DOM
├── Dockerfile           # Multi-stage (Node.js build -> Nginx serve)
├── nginx.conf           # การตั้งค่า Web Server Nginx
├── docker-compose.yml   # รันสะดวกผ่าน docker compose
└── .dockerignore        # กำหนดไฟล์ที่ไม่ต้องส่งเข้า Docker context
```
