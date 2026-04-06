# SideSpark Frontend

> Stack: Next.js 14 (App Router) + React 18 + Tailwind CSS + shadcn/ui + NextAuth v4

## ภาพรวม

Frontend ในสถานะปัจจุบันแบ่งได้เป็น 3 ส่วน:

- หน้า marketing และ landing page
- flow สมัครสมาชิกและเข้าสู่ระบบที่เชื่อมกับ backend จริง
- หน้าหลังบ้านหลายหน้าที่ยังเน้น UI prototype และ mock data

ดังนั้นเอกสารนี้จะแยกให้ชัดระหว่างส่วนที่เชื่อม backend แล้ว กับส่วนที่ยังเป็น prototype

## Environment Variables

ค่าที่ frontend ใช้จริง:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_API_URL`

ไฟล์ตัวอย่างอยู่ที่ `frontend/.env.local.example`

## Route Map

### Public routes

- `/`
  Landing page ที่รวม `HeroSection`, `FeaturesSection`, `DemoSection` และ `PricingSection`
- `/login`
  หน้าเข้าสู่ระบบด้วย NextAuth credentials
- `/register`
  หน้าสมัครสมาชิก
- `/api/auth/[...nextauth]`
  NextAuth handler
- `/api/auth/error`
  หน้าแสดง auth error

### Protected routes

route เหล่านี้ใช้ `getServerSession()` เพื่อตรวจ session ก่อน render

- `/main`
  หน้า idea explorer สำหรับผู้ใช้ที่ล็อกอินแล้ว
- `/main/projects`
  หน้า project management
- `/main/success`
  หน้า progress / achievements
- `/upgrade`
  หน้าเลือกแพ็กเกจ
- `/upgrade/pro`
  หน้า checkout ของแพ็กเกจ Pro
- `/upgrade/family`
  หน้า checkout ของแพ็กเกจ Family

## Middleware Behavior

`src/middleware.ts` ทำงานเฉพาะกับ route ต่อไปนี้:

- `/`
- `/login`

พฤติกรรม:

- ถ้าผู้ใช้ล็อกอินแล้วและเข้า `/` จะ rewrite ไป `/main`
- ถ้าผู้ใช้ล็อกอินแล้วและเข้า `/login` จะ redirect กลับ `/`

## Authentication Flow

flow ที่เชื่อม backend จริงในตอนนี้:

- `/register`
  เรียก `api.register()` ไปที่ `POST /api/auth/register`
- หลังสมัครสำเร็จ หน้า register จะพยายาม auto-login ผ่าน `signIn("credentials")`
- `/login`
  ใช้ `signIn("credentials")` เพื่อเรียก backend login
- เมื่อ login สำเร็จ จะ redirect ไป `callbackUrl`, `redirect` หรือ `/`

NextAuth implementation ปัจจุบัน:

- `src/app/api/auth/[...nextauth]/route.ts`
  runtime handler ที่ frontend ใช้งานจริง
- `src/app/api/auth/[...nextauth]/options.ts`
  export config สำหรับ callback tests และ logic ที่แชร์ในการทดสอบ

สิ่งที่ `options.ts` ตั้งใจจะส่งต่อใน session/JWT:

- `user.id`
- `user.email`
- `user.name`
- `user.username`
- `accessToken`
- `refreshToken` ใน token callback

ข้อควรระวัง:

- `route.ts` ยังไม่ได้ reuse `authOptions` จาก `options.ts`
- basic credentials login ยังทำงานได้ แต่การส่งต่อ field เพิ่มเติมอย่าง `accessToken` ไปยัง session ยังไม่ควรถูกมองว่า stable จนกว่าจะรวม config ให้เป็นชุดเดียวกัน

`Providers` จะห่อแอปด้วย:

- `SessionProvider`
- `AuthProvider`

`AuthContext` expose:

- `user`
- `loading`
- `accessToken`
- `login(email, password)`
- `logout()`

## API Client

ไฟล์ `src/lib/api.ts` เป็น typed wrapper สำหรับ backend resources:

- `register`
- `getMe`
- `projects.*`
- `transactions.*`
- `skills.*`
- `users.*`
- `ideas.*`

พฤติกรรมของ `apiRequest()`:

- อ่าน session ผ่าน `getSession()`
- แนบ `Authorization: Bearer <token>` อัตโนมัติถ้ามี token
- ถ้าได้ `401` บนฝั่ง browser จะ redirect ไป `/login`

หมายเหตุ:

- `verifyEmail()` และ `resendVerification()` ยังอยู่ใน `api.ts` แต่ backend ไม่มี route เหล่านี้แล้ว
- `apiRequest()` คาดหวังว่า session จะมี `accessToken` แต่ความสามารถนี้ยังขึ้นกับการทำให้ `route.ts` และ `options.ts` สอดคล้องกันก่อน

## สถานะของแต่ละหน้าหลัก

### เชื่อม backend จริงแล้ว

- `/register`
  เรียก backend จริง
- `/login`
  เรียก backend จริงผ่าน NextAuth

### ยังเป็น mock / prototype เป็นหลัก

- `/main`
  ใช้ `ExploreIdeas` ที่จัดการข้อมูล idea ผ่าน local state และ mock data
- `/main/projects`
  ใช้ `ProjectsPage` ที่สร้าง/แก้ไข/ลบ project ใน local state
- `/main/success`
  ใช้ mock project data เพื่อคำนวณ progress และ achievements
- `/upgrade`
  เป็นหน้าเปรียบเทียบแพ็กเกจ
- `/upgrade/pro`
  checkout simulation เท่านั้น
- `/upgrade/family`
  checkout simulation เท่านั้น

กล่าวอีกแบบคือ auth เชื่อม backend แล้ว แต่ product pages หลักยังไม่ได้ bind กับ API ทั้งหมด

## Components ที่เกี่ยวข้อง

โฟลเดอร์สำคัญ:

- `src/app/`
  app router pages
- `src/components/layout/`
  navbar, footer
- `src/components/home/`
  sections ของ landing page
- `src/components/main/`
  หน้า product ฝั่งผู้ใช้
- `src/components/upgrade/`
  pricing และ checkout UI
- `src/components/ui/`
  shadcn-style reusable components
- `src/context/`
  auth context
- `src/lib/`
  API helpers และ utility functions

## Tests

Vitest config ของ frontend ใช้:

- `jsdom`
- React Testing Library
- `tests/frontend/unittest/**/*`
- `tests/frontend/integration/**/*`
- `tests/frontend/e2e/**/*`

test ที่มีอยู่ตอนนี้อยู่ใน:

- `tests/frontend/unittest/auth/options.test.ts`
- `tests/frontend/unittest/components/Button.test.tsx`
- `tests/frontend/unittest/lib/api.test.ts`
- `tests/frontend/unittest/lib/api.auth.test.ts`

## Known Gaps

- `/login` ยังลิงก์ไป `/forgot-password` แต่ route นี้ยังไม่มี
- หน้า `/main`, `/main/projects`, `/main/success` และ `/upgrade/*` ยังไม่ผูกกับ backend ครบถ้วน
- flow subscription และ payment ยังเป็น UI simulation
- มีทั้ง `route.ts` และ `options.ts` สำหรับ NextAuth และ runtime ยังไม่ได้ใช้ config ชุดเดียวกัน
