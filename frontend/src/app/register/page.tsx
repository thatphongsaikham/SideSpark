'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { signIn } from 'next-auth/react' 

function RegisterPageContent() {
  const searchParams = useSearchParams()
  const targetUrl = searchParams.get('callbackUrl') || searchParams.get('redirect') || '/main'
  return <RegisterPageView redirectUrl={targetUrl} />
}

function RegisterPageView({ redirectUrl }: { redirectUrl: string }) {
  const router = useRouter()
  
  // ดึงค่า redirect จาก URL (ถ้าไม่มีให้กลับไปที่หน้าแรก '/')

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      // 1. เรียก API สมัครสมาชิก
      const response = await api.register(formData)
      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่' })
        return
      }

      // 2. เมื่อสมัครสำเร็จ ทำการ Auto-login ด้วย NextAuth
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        // ส่ง callbackUrl ต่อไปให้หน้า Login
        router.push(`/login?registered=1&callbackUrl=${encodeURIComponent(redirectUrl)}`)
      } else if (result?.ok) {
        // ถ้า auto-login สำเร็จ ให้พุ่งไป URL ที่ตั้งใจไว้เลย!
        window.location.href = redirectUrl
      }
    } catch {
      setErrors({ general: 'เกิดข้อผิดพลาด กรุณาลองใหม่' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#1E293B] p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-[#1E293B] dark:text-white mb-2">
              สมัครสมาชิก
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              เริ่มต้นใช้งาน SideSpark ฟรีวันนี้
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{errors.general}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="ตัวอย่าง: somchai123"
                  value={formData.username}
                  onChange={handleChange}
                  className={`pl-10 ${errors.username ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.username && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  value={formData.password}
                  onChange={handleChange}
                  className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#8A2BE2] hover:bg-[#8A2BE2]/90 h-12"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังดำเนินการ...
                </>
              ) : (
                'สมัครสมาชิก'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            มีบัญชีแล้ว?{' '}
            {/* ส่งค่า redirect กลับไปที่หน้า Login ด้วย เผื่อผู้ใช้เปลี่ยนใจไปกดเข้าสู่ระบบแทน */}
            <Link 
              href={`/login${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`} 
              className="text-[#8A2BE2] hover:underline font-medium"
            >
              เข้าสู่ระบบ
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageView redirectUrl="/" />}>
      <RegisterPageContent />
    </Suspense>
  )
}
