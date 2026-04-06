"use client"
import React, { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Zap, ShieldCheck, Users } from "lucide-react"

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true)

  const { data: session } = useSession()
  const isLoggedIn = !!session

  // ── Route map: plan → upgrade route ──────────────────────────────────────
  const UPGRADE_ROUTES: Record<string, string> = {
    pro: "/upgrade/pro",
    family: "/upgrade/family",
  }

  /**
   * ถ้า login แล้ว → ไป /upgrade/pro หรือ /upgrade/family ตรงๆ
   * ถ้ายังไม่ login → ไป /register?redirect=/upgrade/pro (หรือ family)
   * หลังสมัครสำเร็จ NextAuth จะ redirect กลับมาที่ upgrade route นั้น
   */
  const getUpgradeLink = (plan: string) => {
    const targetUrl = UPGRADE_ROUTES[plan]
    return isLoggedIn
      ? targetUrl
      : `/register?callbackUrl=${encodeURIComponent(targetUrl)}`
}

  const pricing = {
    pro:    { monthly: 99,  annual: 990  },
    family: { monthly: 149, annual: 1490 },
  }

  return (
    <section className="py-16 md:py-16 max-w-6xl mx-auto px-4 mt-8 md:mt-12">
      <div className="text-center mb-10 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 md:mb-6 text-[#0F172A] dark:text-white">
          เลือกแผนที่เหมาะกับเป้าหมายของคุณ
        </h2>

        {/* Toggle Switch */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <span className={`text-sm font-medium ${!isAnnual ? "text-[#8A2BE2]" : "text-gray-500"}`}>รายเดือน</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 bg-gray-200 dark:bg-gray-800 rounded-full transition-colors focus:outline-none shrink-0"
            >
              <div className={`absolute top-1 left-1 w-5 h-5 bg-white dark:bg-[#8A2BE2] rounded-full transition-transform duration-300 ${isAnnual ? "translate-x-7" : ""}`} />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? "text-[#8A2BE2]" : "text-gray-500"}`}>รายปี</span>
          </div>
          <span className="bg-[#10B981]/10 text-[#10B981] text-[10px] md:text-xs font-bold px-3 py-1 rounded-full border border-[#10B981]/20">
            ประหยัดค่าใช้จ่าย 2 เดือน ✨
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-md md:max-w-3xl lg:max-w-none mx-auto">

        {/* FREE PLAN */}
        <Card className="flex flex-col border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/40">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-base">📦</div>
              Free
            </CardTitle>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl md:text-4xl font-bold text-[#0F172A] dark:text-white">฿0</span>
            </div>
            <CardDescription className="min-h-[40px] mt-2 text-sm md:text-base">
              เหมาะสำหรับเริ่มต้นเรียนรู้และทดลองไอเดีย
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" /> ฟีเจอร์จัดการพื้นฐาน</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" /> บันทึกได้สูงสุด 3 โปรเจกต์</li>
              <li className="flex items-center gap-3 text-gray-400"><CheckCircle2 className="w-4 h-4 opacity-20 shrink-0" /> ไม่มีระบบวิเคราะห์ AI</li>
            </ul>
          </CardContent>
          <CardFooter>
            {/* Free plan → register หรือ /main ถ้า login แล้ว */}
            <Link href={isLoggedIn ? "/main" : "/register"} className="w-full">
              <Button variant="outline" className="w-full rounded-xl py-5 md:py-6 transition-transform active:scale-95 hover:bg-gray-50 dark:hover:bg-gray-800">
                สมัครเลย เริ่มต้นฟรี
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* PRO PLAN */}
        <Card className="flex flex-col relative border-[#8A2BE2] shadow-xl md:shadow-2xl shadow-[#8A2BE2]/10 bg-white dark:bg-gray-900 transition-all lg:scale-105 z-10 md:order-first lg:order-none">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#8A2BE2] text-white text-[10px] md:text-xs font-extrabold px-3 py-1 rounded-full uppercase whitespace-nowrap">
            Most Popular
          </div>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-[#8A2BE2]">
              <div className="p-2 rounded-lg bg-[#8A2BE2]/10 text-[#8A2BE2]"><Zap className="w-5 h-5 fill-current" /></div>
              Pro
            </CardTitle>
            <div className="mt-4 flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl md:text-4xl font-bold text-[#0F172A] dark:text-white">
                  ฿{isAnnual ? pricing.pro.annual : pricing.pro.monthly}
                </span>
                <span className="text-gray-500 text-sm">/{isAnnual ? "ปี" : "เดือน"}</span>
              </div>
              {isAnnual && (
                <span className="text-[#10B981] text-xs font-medium mt-1">เฉลี่ยเพียง ฿{Math.floor(pricing.pro.annual / 12)} /เดือน</span>
              )}
            </div>
            <CardDescription className="min-h-[40px] mt-2 text-sm md:text-base">
              ปลดล็อกพลัง AI และเครื่องมือวิเคราะห์แบบจัดเต็ม
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3 text-sm text-[#0F172A] dark:text-gray-300">
              <li className="flex items-center gap-3 font-medium"><CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" /> <b>ไม่จำกัด</b> จำนวนโปรเจกต์</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" /> ระบบ AI แนะนำไอเดียทำเงิน</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" /> ดู Analytics รายรับ-รายจ่ายเชิงลึก</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" /> ไม่มีโฆษณารบกวน</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href={getUpgradeLink("pro")} className="w-full">
              <Button className="w-full py-5 md:py-6 rounded-xl bg-[#8A2BE2] hover:bg-[#8A2BE2]/90 text-md shadow-lg shadow-[#8A2BE2]/20 transition-transform active:scale-95 text-white">
                เริ่มต้นกับแผน Pro
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* FAMILY PLAN */}
        <Card className="flex flex-col border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/40 hover:border-[#10B981]/50 transition-all md:col-span-2 lg:col-span-1 md:max-w-md md:mx-auto lg:max-w-none w-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#10B981]/10 text-[#10B981]"><Users className="w-5 h-5" /></div>
              Family
            </CardTitle>
            <div className="mt-4 flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl md:text-4xl font-bold text-[#0F172A] dark:text-white">
                  ฿{isAnnual ? pricing.family.annual : pricing.family.monthly}
                </span>
                <span className="text-gray-500 text-sm">/{isAnnual ? "ปี" : "เดือน"}</span>
              </div>
              {isAnnual && (
                <span className="text-[#10B981] text-xs font-medium mt-1">เฉลี่ยเพียง ฿{Math.floor(pricing.family.annual / 12)} /เดือน</span>
              )}
            </div>
            <CardDescription className="min-h-[40px] mt-2 text-sm md:text-base">
              คุ้มที่สุดสำหรับกลุ่มเพื่อนที่อยากสร้างรายได้ไปด้วยกัน
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-3 font-medium"><CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" /> ครอบคลุม <b>3-4 บัญชี</b> ใช้งานแยกกัน</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" /> ฟีเจอร์ Pro ทั้งหมดทุกบัญชี</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" /> ระบบแชร์ไอเดียและงานภายในทีม</li>
              <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" /> ประหยัดสูงสุด 40% ต่อคน</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href={getUpgradeLink("family")} className="w-full">
              <Button variant="outline" className="w-full py-5 md:py-6 rounded-xl border-2 hover:bg-[#10B981]/5 hover:border-[#10B981]/50 text-[#10B981] transition-transform active:scale-95">
                เริ่มต้นกับแผน ครอบครัว
              </Button>
            </Link>
          </CardFooter>
        </Card>

      </div>

      <div className="mt-10 md:mt-12 text-center p-4 md:p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl mx-auto max-w-md md:max-w-3xl lg:max-w-none">
        <p className="text-xs md:text-sm text-gray-500 flex flex-col md:flex-row items-center justify-center gap-2">
          <ShieldCheck className="w-5 h-5 md:w-4 md:h-4 text-green-500 md:text-gray-500" />
          ชำระเงินปลอดภัยด้วยระบบมาตรฐาน SSL พร้อมการันตีคืนเงินภายใน 7 วัน
        </p>
      </div>
    </section>
  )
}