// components/upgrade/UpgradePage.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Zap, Users, Sparkles, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
export type PlanId = "free" | "pro" | "family"

type Plan = {
  id: PlanId
  name: string
  price: number
  priceAnnual: number
  tagline: string
  icon: React.ReactNode
  color: string
  bg: string
  highlight: boolean
  features: string[]
  limit: string
  route: string   // route ที่จะ push ไปเมื่อเลือก
}

// ─── Plans Config ─────────────────────────────────────────────────────────────
const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceAnnual: 0,
    tagline: "เริ่มต้นสำรวจไอเดีย",
    icon: <Sparkles className="w-5 h-5" />,
    color: "text-gray-600 dark:text-gray-300",
    bg: "bg-gray-100 dark:bg-gray-800",
    highlight: false,
    limit: "1 โปรเจกต์",
    route: "/main",
    features: [
      "สำรวจไอเดีย Side Hustle ได้ไม่จำกัด",
      "สร้างโปรเจกต์ได้ 1 โปรเจกต์",
      "To-Do list พื้นฐาน",
      "บันทึกรายรับ-รายจ่าย",
      "ดูกราฟรายได้",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    priceAnnual: 990,
    tagline: "สำหรับคนจริงจัง",
    icon: <Zap className="w-5 h-5" />,
    color: "text-[#534AB7]",
    bg: "bg-[#EEEDFE]",
    highlight: true,
    limit: "ไม่จำกัดโปรเจกต์",
    route: "/upgrade/pro",
    features: [
      "ทุกอย่างใน Free",
      "สร้างโปรเจกต์ได้ไม่จำกัด",
      "Milestones & Achievements ครบทุกรายการ",
      "กราฟรายได้รายสัปดาห์/เดือน",
      "Streak Tracker",
      "Export รายงาน (CSV)",
      "Priority Support",
    ],
  },
  {
    id: "family",
    name: "Family",
    price: 199,
    priceAnnual: 1990,
    tagline: "แชร์กับคนในครอบครัว",
    icon: <Users className="w-5 h-5" />,
    color: "text-[#085041]",
    bg: "bg-[#E1F5EE]",
    highlight: false,
    limit: "สูงสุด 5 บัญชี",
    route: "/upgrade/family",
    features: [
      "ทุกอย่างใน Pro",
      "เพิ่มสมาชิกได้สูงสุด 5 บัญชี",
      "แดชบอร์ดครอบครัว",
      "จัดการสมาชิกได้ (เพิ่ม/ลบ)",
      "รายงานรวมทุกสมาชิก",
      "Dedicated Support",
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  currentPlan?: PlanId
}

export default function UpgradePage({ currentPlan = "free" }: Props) {
  const router = useRouter()
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")

  const handleSelect = (plan: Plan) => {
    if (plan.id === currentPlan) return
    router.push(plan.route)
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">

      {/* Header */}
      <div className="text-center max-w-xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 bg-[#EEEDFE] text-[#534AB7] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <Crown className="w-3.5 h-3.5" /> อัปเกรดแผนของคุณ
        </div>
        <h1 className="text-3xl font-bold text-[#0F172A] dark:text-white mb-3">
          เลือกแผนที่ใช่สำหรับคุณ
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          เริ่มต้นฟรี อัปเกรดเมื่อพร้อม ยกเลิกได้ทุกเมื่อ
        </p>
      </div>

      {/* Current Plan Badge */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-[#1D9E75]" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            แผนปัจจุบัน:{" "}
            <span className="font-semibold text-[#0F172A] dark:text-white capitalize">
              {currentPlan}
            </span>
          </span>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
              billing === "monthly"
                ? "bg-white dark:bg-gray-900 text-[#0F172A] dark:text-white shadow-sm"
                : "text-gray-500"
            )}
          >
            รายเดือน
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
              billing === "annual"
                ? "bg-white dark:bg-gray-900 text-[#0F172A] dark:text-white shadow-sm"
                : "text-gray-500"
            )}
          >
            รายปี
            <span className="text-[10px] bg-[#1D9E75] text-white font-bold px-1.5 py-0.5 rounded-full">
              -17%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map((plan) => {
          const price = billing === "monthly" ? plan.price : Math.round(plan.priceAnnual / 12)
          const isCurrent = plan.id === currentPlan
          const isDowngrade =
            (currentPlan === "pro" && plan.id === "free") ||
            (currentPlan === "family" && plan.id !== "family")

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border-2 bg-white dark:bg-gray-900 p-6 transition-all duration-300",
                plan.highlight
                  ? "border-[#7F77DD] shadow-xl shadow-[#7F77DD]/10 scale-[1.02]"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                isCurrent && "ring-2 ring-[#1D9E75] ring-offset-2"
              )}
            >
              {/* Popular Badge */}
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#7F77DD] text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    ยอดนิยม
                  </span>
                </div>
              )}

              {/* Current Badge */}
              {isCurrent && (
                <div className="absolute -top-3.5 right-4">
                  <span className="bg-[#1D9E75] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    แผนของคุณ
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-5">
                <div className={cn("inline-flex p-2.5 rounded-xl mb-3", plan.bg)}>
                  <span className={plan.color}>{plan.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-[#0F172A] dark:text-white">{plan.name}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{plan.tagline}</p>
              </div>

              {/* Price */}
              <div className="mb-5 pb-5 border-b border-gray-100 dark:border-gray-800">
                {plan.price === 0 ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-[#0F172A] dark:text-white">ฟรี</span>
                    <span className="text-gray-400 text-sm">ตลอดไป</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-[#0F172A] dark:text-white">
                        ฿{price.toLocaleString()}
                      </span>
                      <span className="text-gray-400 text-sm">/ เดือน</span>
                    </div>
                    {billing === "annual" && (
                      <p className="text-xs text-[#1D9E75] mt-1 font-medium">
                        เรียกเก็บ ฿{plan.priceAnnual.toLocaleString()} / ปี
                      </p>
                    )}
                  </>
                )}
                <p className="text-xs text-gray-400 mt-2 font-medium">{plan.limit}</p>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className={cn("w-4 h-4 mt-0.5 shrink-0", plan.highlight ? "text-[#7F77DD]" : "text-[#1D9E75]")} />
                    <span className="text-sm text-gray-600 dark:text-gray-300 leading-snug">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                onClick={() => handleSelect(plan)}
                disabled={isCurrent || isDowngrade}
                className={cn(
                  "w-full rounded-xl font-semibold transition-all",
                  isCurrent
                    ? "bg-[#E1F5EE] text-[#1D9E75] cursor-default hover:bg-[#E1F5EE]"
                    : isDowngrade
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                      : plan.id === "free"
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-200 hover:bg-gray-200"
                        : plan.highlight
                          ? "bg-[#7F77DD] hover:bg-[#534AB7] text-white shadow-md shadow-[#7F77DD]/30"
                          : "bg-[#0F172A] dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-[#0F172A]"
                )}
              >
                {isCurrent
                  ? "✓ แผนปัจจุบัน"
                  : isDowngrade
                    ? "ติดต่อฝ่ายสนับสนุน"
                    : plan.id === "free"
                      ? "ใช้แบบฟรี"
                      : `เลือกแผน ${plan.name} →`}
              </Button>
            </div>
          )
        })}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto pt-4 pb-8 space-y-4">
        <h2 className="text-lg font-bold text-center text-[#0F172A] dark:text-white mb-6">
          คำถามที่พบบ่อย
        </h2>
        {[
          { q: "ยกเลิกได้ตอนไหน?", a: "ยกเลิกได้ทุกเมื่อก่อนรอบบิลถัดไป ข้อมูลจะยังคงอยู่ครบถ้วน" },
          { q: "ชำระเงินด้วยอะไรได้บ้าง?", a: "รองรับบัตรเครดิต/เดบิต, PromptPay และ TrueMoney Wallet" },
          { q: "Family Plan แชร์กับใครได้บ้าง?", a: "เพิ่มได้สูงสุด 5 บัญชี โดยสมาชิกแต่ละคนมีข้อมูลแยกส่วนตัว" },
          { q: "ข้อมูลจะหายไหมถ้า downgrade?", a: "ข้อมูลจะยังอยู่ครบ แต่โปรเจกต์เกิน 1 อันจะ read-only จนกว่าจะอัปเกรดกลับ" },
        ].map(({ q, a }) => (
          <div key={q} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <p className="text-sm font-semibold text-[#0F172A] dark:text-white mb-1.5">{q}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a}</p>
          </div>
        ))}
      </div>

    </div>
  )
}