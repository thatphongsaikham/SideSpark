## SideSpark
ระบบสำรวจไอเดีย side hustle สำหรับนักศึกษา

**SideSpark** ช่วยนักศึกษาค้นหาไอเดียหารายได้เสริมจากทักษะของตนเอง 
วางแผนโปรเจกต์ และติดตามรายได้อย่างเป็นระบบ

## Features
- Idea Explorer — ค้นหาไอเดีย side hustle ตามทักษะ
- Mini Business Plan — วางแผนธุรกิจขนาดเล็กอย่างเป็นขั้นตอน
- Income Tracker — ติดตามรายได้จากแต่ละโปรเจกต์
- Progress Dashboard — ดูความคืบหน้าและวิเคราะห์รายได้

## Vision & Goals

### Problem Statement
นักศึกษาหลายคนอยากหารายได้เสริมแต่:
1.ไม่รู้ว่ามีทางเลือกอะไรบ้างที่เหมาะกับตัวเอง
2.ไม่รู้จะเริ่มต้นอย่างไร
3.ไม่มีระบบติดตามรายได้และความคืบหน้า

### Solution
แอป SideSpark ช่วยสำรวจไอเดีย side hustle ตามทักษะ วางแผนโปรเจกต์ และติดตามรายได้อย่างเป็นระบบ

### Target Users
- Primary: นักศึกษาที่อยากหารายได้เสริม
- Secondary: คนรุ่นใหม่ที่สนใจเริ่มต้นธุรกิจเล็กๆ

### Success Metrics
| Metric                   | Target              | Current |
|--------------------------|---------------------|---------|
| จำนวนผู้ใช้ต่อเดือน (MAU)     | 300 users           | -       |
| อัตรา retention (7 วัน)    | 40%                 | -       |
| อัตรา Idea → Project (%)  | 30%                 | -       |
| จำนวนโปรเจกต์เฉลี่ยต่อผู้ใช้    | 2 projects/user     | -       |
| รายได้เฉลี่ยต่อผู้ใช้           | 1,000 บาท/เดือน      | -       |

## Roadmap

### Current Sprint (Sprint 2)
| Task                         | Assignee | Status        |
|------------------------------|----------|--------------|
| พัฒนาหน้าสำรวจ                 | thatphong saikham (@thatphongsaikham)| In Progress  |
| พัฒนาหน้าจัดการโปรเจกต์           |thatphong saikham (@thatphongsaikham)| In Progress  |
| พัฒนาหน้าความสำเร็จ              | thatphong saikham (@thatphongsaikham)| In Progress  |
| พัฒนาหน้าแพ็กเกจ + ชำระเงิน       | thatphong saikham (@thatphongsaikham)| In Progress  |
| พัฒนาหน้าโปรไฟล์                | thatphong saikham (@thatphongsaikham)| In Progress  |
| ออกแบบโครงสร้างฐานข้อมูล          | thatphong saikham (@thatphongsaikham)| In Progress  |
| เชื่อมหน้า UI กับข้อมูลจริง          | thatphong saikham (@thatphongsaikham)| In Progress  |
| ตั้งค่า CD                       | Premch Phaosatheanthanon (@Premch504)| In Progress  |
| ทำ Code Review                | Premch Phaosatheanthanon (@Premch504)| In Progress  |
| ตรวจสอบการทำงานของ CI/CD       | Premch Phaosatheanthanon (@Premch504)| In Progress  |

### Milestones
- [x] Sprint 1: Idea Explorer + Basic UI + Project Setup
- [x] Sprint 2: Mini Business Plan + Income Tracker (Core Features)
- [ ] Sprint 3: Progress Dashboard + UX Improvements + Documentation

## Tech Stack

- Frontend: Next.js 14, React 18, Tailwind CSS, NextAuth v4
- Backend: Express.js, TypeScript, Prisma ORM, PostgreSQL, JWT
- Tooling: pnpm workspace, Vitest
- Deployment:
  - แนะนำ: `frontend` บน Vercel และ `backend + PostgreSQL` บน Render
  - รองรับ: deploy ทั้งระบบบน Render ผ่าน [`render.yaml`](render.yaml)

## Project Structure

```text
SideSpark/
|-- backend/               # Express API + Prisma schema + scripts
|-- frontend/              # Next.js frontend
|-- docs/                  # เอกสารแยกตามหัวข้อ
|-- tests/                 # ชุดทดสอบ frontend/backend
|-- package.json           # root workspace scripts
|-- pnpm-workspace.yaml
|-- render.yaml            # Render Blueprint
`-- vitest.config.ts
```

## Local Development

### Prerequisites

- Node.js 18.18+ หรือใหม่กว่า
- pnpm 8+
- PostgreSQL

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set environment variables

สร้างไฟล์ต่อไปนี้จาก example:

- `backend/.env` จาก `backend/.env.example`
- `frontend/.env.local` จาก `frontend/.env.local.example`

ค่าหลักที่ต้องมี:

Backend

- `DATABASE_URL`
- `PORT`
- `NODE_ENV`
- `FRONTEND_URL`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `JWT_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`

Frontend

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_API_URL`

### 3. Prepare database

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm --filter backend run prisma:seed
```

### 4. Start development servers

```bash
pnpm dev
```

URL ระหว่างพัฒนา:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## Common Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm test
pnpm test:frontend
pnpm test:backend
pnpm test:coverage
```

## API Overview

Health endpoints:

- `GET /`
- `GET /health`

Resource groups:

- `/api/auth`
- `/api/skills`
- `/api/ideas`
- `/api/projects`
- `/api/transactions`
- `/api/users`

## Deployment

### Recommended Architecture

- Vercel: `frontend`
- Render: `backend`
- Render PostgreSQL: database

ลำดับ deploy ที่แนะนำ:

1. Deploy PostgreSQL และ `backend` บน Render ก่อน
2. คัดลอก backend URL ไปตั้งเป็น `NEXT_PUBLIC_API_URL` ใน Vercel
3. Deploy `frontend` บน Vercel
4. คัดลอก frontend production URL จาก Vercel กลับไปตั้งเป็น `FRONTEND_URL` ใน Render
5. ตรวจสอบว่า login, session, และ API เรียกข้ามโดเมนได้จริง

### Deploy Frontend on Vercel

ตั้งค่าโปรเจกต์ใน Vercel ดังนี้:

- Framework Preset: `Next.js`
- Root Directory: `frontend`
- Package Manager: `pnpm`

Environment Variables:

- `NEXTAUTH_URL=https://<your-vercel-domain>`
- `NEXTAUTH_SECRET=<random-secret>`
- `NEXT_PUBLIC_API_URL=https://<your-render-backend-domain>`

### Deploy Backend on Render

ถ้าสร้าง service เองแบบ manual:

- Service Type: `Web Service`
- Root Directory: `backend`
- Build Command: `pnpm install --frozen-lockfile --prod=false && pnpm exec prisma migrate deploy && pnpm build`
- Start Command: `pnpm start`
- Node Version: `20` (recommended) หรือ `22`

Environment Variables:

- `NODE_ENV=production`
- `DATABASE_URL=<render-postgres-connection-string>`
- `FRONTEND_URL=https://<your-vercel-domain>`
- `JWT_SECRET=<random-secret>`
- `REFRESH_TOKEN_SECRET=<random-secret>`
- `JWT_EXPIRES_IN=1h`
- `REFRESH_TOKEN_EXPIRES_IN=7d`

ถ้าต้องเปิด CORS ให้หลายโดเมน เช่น Vercel preview deployments:

- `FRONTEND_URLS=https://preview-1.vercel.app,https://preview-2.vercel.app`

### Deploy Both Services on Render

repo นี้มี [`render.yaml`](render.yaml) สำหรับ deploy ทั้ง `frontend`, `backend`, และ PostgreSQL บน Render อยู่แล้ว

วิธีใช้งาน:

1. Push code ขึ้น Git provider
2. ไปที่ Render แล้วเลือก Blueprint deploy
3. ชี้มาที่ repository นี้
4. Review ค่าใน `render.yaml`
5. เปลี่ยน domain/env ตามของจริงก่อนกด deploy

### Self-Deploy Workflow (No Team Review)

1. ใช้ Vercel project และ Render services ของตัวเอง (หรือ environment ที่แยกจาก production ของทีม)
2. ตั้ง auto deploy จาก branch ของตัวเอง เช่น `add-deploy` หรือจาก fork
3. ทดสอบบน URL ของตัวเองให้ครบทั้ง login, session, และ API
4. เปิด PR ให้ทีม review ภายหลัง โดยไม่บล็อกการทดสอบของคุณ

### Deployment Checklist

- `NEXTAUTH_URL` เป็น production URL ของ frontend จริง
- `NEXT_PUBLIC_API_URL` ชี้ไป backend จริง
- `FRONTEND_URL` ฝั่ง backend ตรงกับ frontend domain จริง
- `DATABASE_URL` เป็น production database
- `prisma migrate deploy` ถูกรันก่อน backend start
- `https://<backend-domain>/health` ตอบกลับได้
- Build Command บน Render ไม่ควรมี `corepack enable` (ป้องกัน `EROFS: read-only file system`)
- ให้รัน `pnpm exec prisma migrate deploy` ผ่าน Build Command เสมอ

## Documentation

- [Frontend Docs](docs/frontend.md)
- [Backend Docs](docs/backend.md)
- [Deployment Overview](docs/deployment.md)
- [Render Deployment Guide](docs/render-deployment.md)

## Known Gaps

- flow บางส่วนในหน้า upgrade/checkout ยังเป็น UI prototype
- helper บางตัวใน frontend ยังอ้างถึง route ที่ backend ยังไม่ได้เปิดใช้จริง
- ยังมี lint warnings บางจุดที่ไม่ block deployment

## License

MIT
