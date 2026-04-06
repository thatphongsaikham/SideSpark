'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react'
import { getSession, signIn } from 'next-auth/react'

type LoginPageClientProps = {
  registered: string | null
  redirectUrl: string
}

export default function LoginPageClient({ registered, redirectUrl }: LoginPageClientProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const saveLoginDebug = (payload: Record<string, unknown>) => {
    if (typeof window === 'undefined') return

    sessionStorage.setItem(
      'login-debug',
      JSON.stringify({
        ...payload,
        redirectUrl,
        at: new Date().toISOString(),
      }),
    )
  }

  const waitForSession = async (maxAttempts = 8, intervalMs = 150) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const session = await getSession()

      if (session?.user) {
        return { session, attempt }
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }

    return { session: null, attempt: maxAttempts }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        callbackUrl: redirectUrl,
        redirect: false,
      })

      console.log('[Login] signIn result:', JSON.stringify(result))

      if (result?.error) {
        saveLoginDebug({ stage: 'signIn-error', result })

        if (result.error === 'CredentialsSignin') {
          setErrors({ general: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
        } else {
          setErrors({ general: result.error })
        }
      } else if (result?.ok) {
        const { session, attempt } = await waitForSession()

        saveLoginDebug({
          stage: 'signIn-ok',
          result,
          sessionReady: Boolean(session?.user),
          attempt,
        })

        console.log('[Login] Success, redirecting to:', redirectUrl, 'result.url:', result.url)

        if (!session?.user) {
          setErrors({ general: 'เข้าสู่ระบบสำเร็จ แต่ session ยังไม่พร้อม กรุณาลองใหม่อีกครั้ง' })
          return
        }

        window.location.assign(redirectUrl)
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
            <h1 className="text-3xl font-bold text-[#1E293B] dark:text-white mb-2">เข้าสู่ระบบ</h1>
            <p className="text-gray-600 dark:text-gray-400">ยินดีต้อนรับกลับมา</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {registered && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ
                </p>
              </div>
            )}

            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{errors.general}</p>
              </div>
            )}

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
                  placeholder="•••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={`pl-10 ${errors.password ? 'border-red-500' : ''}`}
                  disabled={loading}
                />
              </div>
              <div className="flex justify-between items-center">
                {errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm text-[#8A2BE2] hover:underline">
                ลืมรหัสผ่าน?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#8A2BE2] hover:bg-[#8A2BE2]/90 h-12"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            ยังไม่มีบัญชี?{' '}
            <Link
              href={`/register${redirectUrl !== '/main' ? `?callbackUrl=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="text-[#8A2BE2] hover:underline font-medium"
            >
              สมัครสมาชิก
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}