import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-800/50 bg-[#F8FAFC]/80 dark:bg-[#1E293B]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center hover:opacity-90 transition-opacity cursor-pointer">
          <img
            src="/images/logo.jpg"
            alt="SideSpark Logo"
            width="120"
            className="rounded mix-blend-multiply border-t-[5px] border-white dark:border-transparent dark:mix-blend-normal"
          />
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost" className="hover:text-[#8A2BE2] font-medium transition-colors">
              เข้าสู่ระบบ
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-[#8A2BE2] hover:bg-[#8A2BE2]/90 text-white shadow-md">
              เริ่มต้นใช้งาน
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}