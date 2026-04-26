/* eslint-disable react/no-unescaped-entities */
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export default function HeroSection() {
  return (
    <div className="text-center mb-32 max-w-5xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8A2BE2]/10 text-[#8A2BE2] text-sm font-medium mb-6 animate-bounce">
        <Sparkles className="w-4 h-4" />
        <span>Smart Side Hustle Tool for Students</span>
      </div>

      {/* ปรับแก้ส่วน Heading ตรงนี้ */}
      <h1 className="mb-8 text-[clamp(2.5rem,8vw,5.5rem)] font-[900] tracking-tight text-[#0F172A] dark:text-white">
        {/* แยกเป็นบรรทัดแรก */}
        <span className="block mb-2 sm:mb-4">
          เปลี่ยน <span className="text-[#8A2BE2]">เวลาว่าง</span>
        </span>

        {/* บรรทัดที่สอง */}
        <span className="block relative">
          ให้เป็น{" "}
          <span className="relative inline-block">
            <span className="relative z-10 bg-gradient-to-r from-[#10B981] to-[#059669] bg-clip-text text-transparent">
              รายได้ที่ยั่งยืน
            </span>
            <svg
              className="absolute -bottom-2 left-0 w-full h-3 text-[#10B981]/20 -z-0"
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
            >
              <path d="M0 5 Q 25 0 50 5 T 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
            </svg>
          </span>
        </span>
      </h1>

      <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
        แพลตฟอร์มที่ช่วยให้นักศึกษาจัดการงานโปรเจกต์ วางแผนการเงิน
        และค้นหาไอเดียทำเงินจากทักษะที่คุณมี "เริ่มจากศูนย์สู่มือโปร"
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            asChild
            size="lg"
            className="w-full sm:min-w-[200px] text-lg px-10 h-14 rounded-xl shadow-xl transition-all
                      bg-[#8A2BE2] text-white
                      hover:bg-transparent hover:text-[#0F172A] hover:border hover:border-[#0F172A] hover:scale-105
                      dark:bg-white dark:text-[#0F172A] dark:hover:bg-transparent dark:hover:text-white dark:hover:border-white"
          >
            <Link href="/register">เริ่มต้นใช้งานเลย</Link>
          </Button>

          <Button
            size="lg"
            variant="ghost"
            className="w-full sm:min-w-[200px] text-lg px-10 h-14 rounded-xl transition-all
                      bg-transparent text-[#0F172A] border border-[#0F172A]
                      hover:bg-[#8A2BE2] hover:text-white hover:scale-105 hover:border-transparent
                      dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-[#0F172A]"
          >
            ดูวิธีการใช้งาน
          </Button>
        </div>
      </div>
    </div>
  )
}
