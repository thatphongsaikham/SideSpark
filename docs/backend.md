# SideSpark Backend

> Stack: Express.js + TypeScript + Prisma ORM + PostgreSQL + JWT

## ภาพรวม

Backend รับผิดชอบเรื่องต่อไปนี้:

- REST API ภายใต้ prefix `/api`
- การสมัครสมาชิกและเข้าสู่ระบบด้วย email/password
- Access token + refresh token
- CRUD สำหรับ projects, tasks และ transactions
- การอ่านข้อมูล skills, ideas และ profile ผู้ใช้
- Prisma schema, migrations และ seed data

Server ใช้ middleware หลักดังนี้:

- `helmet`
- `cors`
- `express.json()`
- `morgan`
- `express-rate-limit` ที่ `/api/*` จำนวน 100 requests ต่อ 15 นาที

## Environment Variables

ตัวแปรที่ใช้จริงในโค้ดตอนนี้มีดังนี้:

- `DATABASE_URL`
- `PORT` ค่า default คือ `5000`
- `NODE_ENV`
- `FRONTEND_URL` ใช้กับ CORS
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `REFRESH_TOKEN_EXPIRES_IN`

หมายเหตุสำคัญ:

- access token หมดอายุที่ 1 ชั่วโมงแบบ hard-coded ใน `src/lib/auth.ts`
- `REFRESH_TOKEN_EXPIRES_IN` ถูก parse เป็นจำนวนวัน
- `backend/.env.example` ยังมี `JWT_EXPIRES_IN` และตัวแปร SMTP อยู่ แต่ route ที่ใช้งานจริงไม่ได้ใช้ค่าเหล่านี้

## คำสั่งที่ใช้บ่อย

```bash
pnpm --filter backend dev
pnpm --filter backend build
pnpm --filter backend start
pnpm --filter backend run test:run
pnpm --filter backend run test:coverage
pnpm --filter backend run prisma:generate
pnpm --filter backend run prisma:migrate
pnpm --filter backend run prisma:seed
```

## โครงสร้างข้อมูลหลัก

Prisma models ที่มีอยู่:

- `User`
- `Skill`
- `UserSkill`
- `Idea`
- `Project`
- `Task`
- `Transaction`
- `Milestone`
- `RefreshToken`

จุดสำคัญของ schema:

- table ใน database map เป็น snake_case ผ่าน `@@map(...)` และ `@map(...)`
- `UserSkill` เป็น junction table ระหว่าง `User` และ `Skill`
- `Project` มี `Task[]` และ `Transaction[]`
- `Milestone` มีอยู่ใน schema แต่ยังไม่มี CRUD route แยกใน backend ตอนนี้
- seed script จะเพิ่ม skill catalog และ idea catalog เริ่มต้นให้ระบบ

## Authentication

รูปแบบ auth ปัจจุบัน:

- `POST /api/auth/login` คืน `accessToken`, `refreshToken`, และข้อมูล `user`
- access token ใช้ Bearer token
- refresh token ถูกเก็บในตาราง `refresh_tokens`
- route ที่ต้องล็อกอินส่วนใหญ่ใช้ `authMiddleware`
- route public บางตัว เช่น skills และ ideas ใช้ `optionalAuthMiddleware`

ข้อสังเกต:

- `GET /api/auth/me` ตรวจ Bearer token ภายใน route โดยตรง ไม่ได้ใช้ `authMiddleware`

## API Endpoints

### Health

- `GET /`
  คืนข้อมูล API แบบง่าย
- `GET /health`
  คืน `{ status: "ok", message: "SideSpark API is running" }`

### Auth (`/api/auth`)

- `POST /register`
  Body: `{ username, email, password, confirmPassword }`
- `POST /login`
  Body: `{ email, password }`
- `POST /refresh`
  Body: `{ refreshToken }`
- `POST /logout`
  Body: `{ refreshToken }`
- `GET /me`
  ต้องส่ง `Authorization: Bearer <token>`

พฤติกรรมปัจจุบัน:

- ไม่มี email verification flow
- ไม่มี forgot password flow
- ไม่มี OAuth flow

### Skills (`/api/skills`)

- `GET /`
  รองรับ `?category=creative|tech|business|education|language`
  ถ้าส่ง token มาด้วย response จะมี `userSkills`
- `GET /:id`
- `POST /:id/add`
  ต้องล็อกอิน
- `DELETE /:id/remove`
  ต้องล็อกอิน

### Ideas (`/api/ideas`)

- `GET /`
  รองรับ `?skills=<name>&difficulty=easy|medium|hard`
- `GET /:id`

หมายเหตุ:

- route รับ `category` จาก query ไว้ในโค้ด แต่ยังไม่ได้ใช้ filter จริง

### Projects (`/api/projects`)

ทุก route ในกลุ่มนี้ต้องล็อกอิน

- `GET /`
  รองรับ `?status=active|paused|completed`
  คืนรายการ project พร้อม `tasks`, 5 รายการล่าสุดของ `transactions`, `_count`, และ `progress`
- `GET /:id`
  คืน project เดี่ยวพร้อม `tasks`, `transactions` และ `progress`
- `POST /`
  Body: `{ name, description?, initialCost?, monthlyGoal?, tasks?: string[] }`
- `PUT /:id`
  Body: `{ name?, description?, initialCost?, monthlyGoal?, status? }`
- `DELETE /:id`

Task sub-routes:

- `POST /:id/tasks`
  Body: `{ text, order? }`
- `PUT /:id/tasks/:taskId`
  Body: `{ completed?, text?, order? }`
- `DELETE /:id/tasks/:taskId`

### Transactions (`/api/transactions`)

ทุก route ในกลุ่มนี้ต้องล็อกอิน

- `GET /`
  รองรับ `?projectId=&type=income|expense&startDate=&endDate=&limit=`
- `GET /:id`
- `POST /`
  Body: `{ projectId?, type, amount, description?, date? }`
- `PUT /:id`
  Body: `{ projectId?, type?, amount?, description?, date? }`
- `DELETE /:id`
- `GET /summary/stats`
  รองรับ `?startDate=&endDate=`

response ของ summary stats ตอนนี้ประกอบด้วย:

- `totalIncome`
- `totalExpense`
- `netProfit`
- `incomeByProject`
- `monthlyData`
- `goalsProgress`
- `milestonesCompleted`
- `streak`

หมายเหตุ:

- `streak` ยังเป็น placeholder และถูกส่งกลับเป็น `0`

### Users (`/api/users`)

ทุก route ในกลุ่มนี้ต้องล็อกอิน

- `GET /me`
  คืน profile ของผู้ใช้ปัจจุบันพร้อม skills และ `_count`
- `PUT /me`
  Body: `{ name? }`
- `GET /:id`
  คืน public profile ของผู้ใช้พร้อม skills, projects ล่าสุด 10 รายการ และ `_count`

## Tests

Vitest config ของ backend ชี้มาที่:

- `tests/backend/unittest/**/*.test.ts`
- `tests/backend/integration/**/*.test.ts`
- `tests/backend/e2e/**/*.test.ts`

ตอนนี้มี test หลักอยู่ใน:

- `tests/backend/unittest/lib/auth.test.ts`
- `tests/backend/integration/auth.test.ts`

## Known Gaps

- ไม่มี route สำหรับ email verification, resend verification หรือ forgot password
- ไม่มี CRUD route สำหรับ milestones โดยตรง แม้ model จะมีอยู่ใน Prisma schema
- `category` filter ของ ideas ยังไม่ถูก implement จริง
- summary stats ยังไม่คำนวณ streak จริง
