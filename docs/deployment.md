# Deployment Overview

เอกสารนี้สรุปทางเลือก deployment ของ SideSpark และชี้ไปยังคู่มือที่ละเอียดกว่า

## Supported Deployment Modes

### 1. Recommended: Vercel + Render

ใช้เมื่อ:

- ต้องการให้ frontend ทำงานบน Vercel
- ต้องการให้ backend และ PostgreSQL อยู่บน Render

โครงสร้าง:

- `frontend` -> Vercel
- `backend` -> Render Web Service
- Database -> Render PostgreSQL

ข้อดี:

- Next.js เหมาะกับ Vercel โดยตรง
- Backend และ database อยู่ในแพลตฟอร์มเดียวกัน
- แยก scale และ deploy ของ frontend/backend ได้

ค่าหลักที่ต้องตั้ง:

- Vercel:
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
  - `NEXT_PUBLIC_API_URL`
- Render backend:
  - `DATABASE_URL`
  - `FRONTEND_URL`
  - `JWT_SECRET`
  - `REFRESH_TOKEN_SECRET`
  - `JWT_EXPIRES_IN`
  - `REFRESH_TOKEN_EXPIRES_IN`

ลำดับ deploy:

1. Deploy database บน Render
2. Deploy backend บน Render
3. Deploy frontend บน Vercel
4. อัปเดต `FRONTEND_URL` ใน Render ให้เป็นโดเมนจริงของ Vercel

## 2. Full Render Deployment

ใช้เมื่อ:

- ต้องการ deploy ทั้ง frontend และ backend บน Render
- ต้องการใช้ Blueprint จากไฟล์ `render.yaml`

โครงสร้าง:

- `frontend` -> Render Web Service
- `backend` -> Render Web Service
- Database -> Render PostgreSQL

ไฟล์ที่เกี่ยวข้อง:

- [`render.yaml`](../render.yaml)
- [`docs/render-deployment.md`](./render-deployment.md)

## Build Commands

### Frontend

- Root Directory: `frontend`
- Build: `corepack enable && pnpm install --frozen-lockfile && pnpm build`
- Start: `pnpm start`

### Backend

- Root Directory: `backend`
- Build: `corepack enable && pnpm install --frozen-lockfile && pnpm build`
- Pre-Deploy: `pnpm exec prisma migrate deploy`
- Start: `pnpm start`

## Important Environment Variables

### Frontend

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_API_URL`

### Backend

- `NODE_ENV`
- `DATABASE_URL`
- `FRONTEND_URL`
- `FRONTEND_URLS` (optional, comma-separated)
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `JWT_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`

## Verification Checklist

- Frontend build ผ่าน
- Backend build ผ่าน
- `pnpm test` ผ่าน
- Backend endpoint `/health` ตอบกลับได้
- Login ผ่าน frontend แล้วเรียก backend API ได้จริง
- CORS อนุญาตเฉพาะ frontend domain ที่ต้องใช้

## Detailed Guides

- [README deployment section](../README.md)
- [Render Deployment Guide](./render-deployment.md)
