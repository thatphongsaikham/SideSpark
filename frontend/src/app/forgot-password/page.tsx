import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#1E293B] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-[#1E293B] dark:text-white">
            ลืมรหัสผ่าน
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            ระบบรีเซ็ตรหัสผ่านยังไม่เปิดใช้งานในเวอร์ชันนี้
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            กรุณาติดต่อผู้ดูแลระบบ หรือกลับไปหน้าเข้าสู่ระบบก่อน
          </p>

          <Button asChild className="w-full bg-[#8A2BE2] hover:bg-[#8A2BE2]/90">
            <Link href="/login">กลับไปหน้าเข้าสู่ระบบ</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}