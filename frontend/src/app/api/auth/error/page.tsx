'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Home, ArrowLeft } from 'lucide-react'

function AuthErrorContent() {
  const searchParams = useSearchParams()

  return <AuthErrorView error={searchParams.get('error')} />
}

function AuthErrorView({ error }: { error: string | null }) {

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'EmailCreateAccount':
        return 'เกิดข้อผิดในการสร้างบัญชีด้วยอีเมล'
      case 'EmailSignin':
        return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      case 'CredentialsSignin':
        return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      case 'SessionRequired':
        return 'คุณต้องเข้าสู่ระบบก่อน'
      case 'AccessDenied':
        return 'การเข้าถึงระบบถูกปฏิเสธ'
      case 'Verification':
        return 'การยืนยันล้มเหตุ'
      default:
        return error || 'เกิดข้อผิดพลาดที่ไม่ทราบรู้'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#1E293B] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-center text-2xl text-red-600 dark:text-red-400">
              เกิดข้อผิดพลาด
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              {getErrorMessage(error)}
            </p>
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Error code: {error}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full h-12"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับไปหน้าก่อนหน้า
            </Button>

            <Button
              onClick={() => window.location.href = '/'}
              variant="ghost"
              className="w-full h-12"
            >
              <Home className="mr-2 h-4 w-4" />
              ไปหน้าหลัก
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-[#1E293B] text-gray-600 dark:text-gray-400">
                หรือ
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full h-12">
                ไปหน้าเข้าสู่ระบบ
              </Button>
            </Link>
            <Link href="/register" className="block">
              <Button className="w-full bg-[#8A2BE2] hover:bg-[#8A2BE2]/90 h-12">
                สมัครสมาชิก
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={<AuthErrorView error={null} />}>
      <AuthErrorContent />
    </Suspense>
  )
}
