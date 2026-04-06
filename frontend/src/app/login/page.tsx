import { redirect } from 'next/navigation'
import LoginPageClient from './LoginPageClient'

function pickFirst(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0] ?? null
  return null
}

function normalizeRedirectPath(path: string | null): string {
  if (!path) return '/main'

  if (!path.startsWith('/')) return '/main'

  const pathname = path.split(/[?#]/)[0]

  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    return '/main'
  }

  return path
}

type LoginPageProps = {
  searchParams?: {
    registered?: string | string[]
    callbackUrl?: string | string[]
    redirect?: string | string[]
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const registered = pickFirst(searchParams?.registered)
  const rawRedirectUrl = pickFirst(searchParams?.callbackUrl) || pickFirst(searchParams?.redirect)

  if (!rawRedirectUrl) {
    redirect('/login?redirect=%2Fmain')
  }

  const redirectUrl = normalizeRedirectPath(rawRedirectUrl)

  return <LoginPageClient registered={registered} redirectUrl={redirectUrl} />
}
