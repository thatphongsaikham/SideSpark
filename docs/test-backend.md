# เอกสารประกอบการทดสอบระบบส่วนหลัง (Backend Testing Documentation)

เอกสารฉบับนี้อธิบายชุดการทดสอบ (Test Suites) ทั้งหมดที่ใช้สำหรับการตรวจสอบความถูกต้องของระบบส่วนหลัง (Backend) ในโปรเจกต์ SideSpark

## โครงสร้างโฟลเดอร์การทดสอบ

การทดสอบของ Backend จะถูกจัดเก็บอยู่ในโฟลเดอร์ `tests/backend/` โดยแบ่งตามประเภทของการทดสอบดังนี้:
- `unittest/`: สำหรับการทดสอบฟังก์ชันแยกส่วน (Unit Testing)
- `integration/`: สำหรับการทดสอบการทำงานของ API และการเชื่อมต่อฐานข้อมูล
- `e2e/`: สำหรับการทดสอบการเชื่อมต่อตั้งแต่ API ผ่าน middleware ไปจนถึง Database แบบครบวงจร

## การทดสอบระดับกระบวนการร่วม (Integration Tests)

### 1. เส้นทาง API (Routes & API Endpoints)
* **`tests/backend/integration/auth.test.ts`**
  * **รายละเอียด**: ทดสอบเส้นทาง (Routes) API สำหรับระบบการยืนยันตัวตน (Authentication endpoints)
  * **กรณีทดสอบ**:
    * ทดสอบ Endpoint สำหรับพ่นข้อมูลการ Login และรับ Token กลับ
    * ตรวจสอบการตอบสนองข้อผิดพลาดเมื่อรหัสผ่านหรือข้อมูลผู้ใช้ไม่ถูกต้อง
    * ตรวจสอบการทำงานของ Middleware แบบบูรณาการเมื่อเรียก API แบบไร้สิทธิ์

## การทดสอบระดับย่อย (Unit Tests)

### 1. โมดูลและฟังก์ชันสนับสนุน (Library & Utilities)
* **`tests/backend/unittest/lib/auth.test.ts`**
  * **รายละเอียด**: ทดสอบฟังก์ชันย่อยที่จัดการด้านการยืนยันตัวตน
  * **กรณีทดสอบ**:
    * การเข้ารหัสและถอดรหัสรหัสผ่าน (Password hashing)
    * การสร้างและตรวจสอบความถูกต้องของ JWT (JSON Web Tokens)
    * ทิศทางการจัดการข้อมูลผู้ใช้งานแบบจำลอง (Mock data handling)

## คำสั่งที่ใช้ในการรันการทดสอบ 

ที่ root directory หรือ folder `backend/` สามารถรันคำสั่ง:
```bash
# รันการทดสอบ integration อย่างเดียว (อาจต้องต่อ Database จำลอง)
pnpm test:integration

# รัน unit test ใน Backend
pnpm test:unit

# รันการทดสอบทั้งหมด 
pnpm test
```