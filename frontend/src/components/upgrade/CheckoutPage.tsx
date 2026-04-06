// components/upgrade/CheckoutPage.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft, CreditCard, Smartphone, Wallet,
  Lock, Check, Zap, Users, ChevronRight, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PlanId } from "./UpgradePage"

// ─── Plan Meta ────────────────────────────────────────────────────────────────
const PLAN_META: Record<
  Exclude<PlanId, "free">,
  { name: string; monthlyPrice: number; annualPrice: number; icon: React.ReactNode; color: string; bg: string }
> = {
  pro: {
    name: "Pro",
    monthlyPrice: 99,
    annualPrice: 990,
    icon: <Zap className="w-4 h-4" />,
    color: "text-[#534AB7]",
    bg: "bg-[#EEEDFE]",
  },
  family: {
    name: "Family",
    monthlyPrice: 199,
    annualPrice: 1990,
    icon: <Users className="w-4 h-4" />,
    color: "text-[#085041]",
    bg: "bg-[#E1F5EE]",
  },
}

type PaymentMethod = "card" | "promptpay" | "truemoney"

// ─── Success Screen ────────────────────────────────────────────────────────────
function SuccessScreen({ planName, onBack }: { planName: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in-95 duration-500 px-4">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-[#E1F5EE] flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#1D9E75] flex items-center justify-center animate-in zoom-in duration-300 delay-200">
            <Check className="w-8 h-8 text-white stroke-[3]" />
          </div>
        </div>
        <div className="absolute inset-0 rounded-full bg-[#1D9E75]/20 animate-ping" />
      </div>

      <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">ชำระเงินสำเร็จ!</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-1">
        คุณได้อัปเกรดเป็นแผน{" "}
        <span className="font-semibold text-[#534AB7]">{planName}</span> เรียบร้อยแล้ว
      </p>
      <p className="text-sm text-gray-400 mb-8">ระบบจะส่งใบเสร็จไปยังอีเมลของคุณ</p>

      <Button
        onClick={onBack}
        className="bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-xl font-semibold px-8"
      >
        กลับหน้า Upgrade
      </Button>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  planId: Exclude<PlanId, "free">
}

export default function CheckoutPage({ planId }: Props) {
  const router = useRouter()
  const plan = PLAN_META[planId]

  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")
  const [method, setMethod] = useState<PaymentMethod>("card")
  const [step, setStep] = useState<"form" | "processing" | "success">("form")

  // Card
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  // QR-based
  const [phone, setPhone] = useState("")
  const [formError, setFormError] = useState("")

  const price = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice
  const displayPrice = billing === "monthly" ? plan.monthlyPrice : Math.round(plan.annualPrice / 12)

  const handleCardNumber = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 16)
    setCardNumber(d.replace(/(.{4})/g, "$1 ").trim())
  }

  const handleExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4)
    setExpiry(d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d)
  }

  const validate = (): boolean => {
    if (method === "card") {
      if (cardNumber.replace(/\s/g, "").length < 16) { setFormError("กรุณากรอกหมายเลขบัตรให้ครบ 16 หลัก"); return false }
      if (!cardName.trim()) { setFormError("กรุณากรอกชื่อบนบัตร"); return false }
      if (expiry.length < 5) { setFormError("กรุณากรอกวันหมดอายุให้ถูกต้อง"); return false }
      if (cvv.length < 3) { setFormError("กรุณากรอก CVV ให้ครบ"); return false }
    } else {
      if (phone.replace(/\D/g, "").length < 10) { setFormError("กรุณากรอกเบอร์โทรให้ครบ 10 หลัก"); return false }
    }
    setFormError("")
    return true
  }

  const handlePay = () => {
    if (!validate()) return
    setStep("processing")
    setTimeout(() => setStep("success"), 2000)
  }

  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto py-8">
        <SuccessScreen planName={plan.name} onBack={() => router.push("/upgrade")} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">

      {/* Back */}
      <button
        onClick={() => router.push("/upgrade")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#534AB7] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> กลับหน้า Upgrade
      </button>

      <div className="grid md:grid-cols-5 gap-6">

        {/* ── Left: Form (3/5) ──────────────────────────────────────────────── */}
        <div className="md:col-span-3 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-1">ชำระเงิน</h1>
            <p className="text-sm text-gray-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> ระบบชำระเงินปลอดภัย SSL
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
            {(["monthly", "annual"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                  billing === b
                    ? "bg-white dark:bg-gray-900 text-[#0F172A] dark:text-white shadow-sm"
                    : "text-gray-500"
                )}
              >
                {b === "monthly" ? "รายเดือน" : (
                  <>รายปี <span className="text-[10px] bg-[#1D9E75] text-white font-bold px-1.5 py-0.5 rounded-full">-17%</span></>
                )}
              </button>
            ))}
          </div>

          {/* Payment Method */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">วิธีชำระเงิน</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "card" as PaymentMethod, label: "บัตรเครดิต/เดบิต", icon: <CreditCard className="w-5 h-5" /> },
                { id: "promptpay" as PaymentMethod, label: "PromptPay", icon: <Smartphone className="w-5 h-5" /> },
                { id: "truemoney" as PaymentMethod, label: "TrueMoney", icon: <Wallet className="w-5 h-5" /> },
              ]).map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => { setMethod(id); setFormError("") }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-center transition-all",
                    method === id
                      ? "border-[#7F77DD] bg-[#EEEDFE] text-[#534AB7]"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"
                  )}
                >
                  {icon}
                  <span className="text-[11px] font-semibold leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
            {method === "card" ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">ข้อมูลบัตร</p>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-500">หมายเลขบัตร</label>
                  <div className="relative">
                    <Input
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => handleCardNumber(e.target.value)}
                      maxLength={19}
                      className="rounded-xl bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 pr-10 font-mono tracking-widest text-[#0F172A] dark:text-white placeholder:font-sans placeholder:tracking-normal focus-visible:ring-[#7F77DD]"
                    />
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-500">ชื่อบนบัตร</label>
                  <Input
                    placeholder="FIRST LAST"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    className="rounded-xl bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 tracking-widest text-[#0F172A] dark:text-white placeholder:tracking-normal focus-visible:ring-[#7F77DD]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-500">วันหมดอายุ</label>
                    <Input
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => handleExpiry(e.target.value)}
                      maxLength={5}
                      className="rounded-xl bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 font-mono tracking-widest text-[#0F172A] dark:text-white placeholder:font-sans placeholder:tracking-normal focus-visible:ring-[#7F77DD]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-500">CVV</label>
                    <Input
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      type="password"
                      maxLength={4}
                      className="rounded-xl bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-[#0F172A] dark:text-white focus-visible:ring-[#7F77DD]"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {method === "promptpay" ? "PromptPay" : "TrueMoney Wallet"}
                </p>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-40 h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="grid grid-cols-5 gap-0.5">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-5 h-5 rounded-[2px]",
                            [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24,7,12,17].includes(i)
                              ? "bg-[#0F172A] dark:bg-white"
                              : "bg-white dark:bg-gray-800"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    หรือกรอกหมายเลขโทรศัพท์ที่ผูก{method === "promptpay" ? "PromptPay" : "TrueMoney"}
                  </p>
                  <div className="w-full space-y-1.5">
                    <label className="block text-xs font-medium text-slate-500">หมายเลขโทรศัพท์</label>
                    <Input
                      placeholder="08X-XXX-XXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="rounded-xl bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 font-mono tracking-widest text-[#0F172A] dark:text-white focus-visible:ring-[#7F77DD]"
                    />
                  </div>
                </div>
              </>
            )}
            {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}
          </div>

          {/* Pay Button */}
          <Button
            onClick={handlePay}
            disabled={step === "processing"}
            className="w-full h-12 bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-xl font-bold text-base shadow-lg shadow-[#7F77DD]/30 active:scale-[0.98] disabled:opacity-70"
          >
            {step === "processing" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> กำลังดำเนินการ...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                ชำระเงิน ฿{price.toLocaleString()} / {billing === "monthly" ? "เดือน" : "ปี"}
                <ChevronRight className="w-4 h-4 ml-auto" />
              </span>
            )}
          </Button>

          <p className="text-center text-xs text-gray-400">
            โดยการชำระเงิน คุณยอมรับ{" "}
            <span className="text-[#7F77DD] cursor-pointer hover:underline">ข้อกำหนดการใช้งาน</span>
            {" "}และ{" "}
            <span className="text-[#7F77DD] cursor-pointer hover:underline">นโยบายความเป็นส่วนตัว</span>
          </p>
        </div>

        {/* ── Right: Order Summary (2/5) ─────────────────────────────────────── */}
        <div className="md:col-span-2">
          <div className="sticky top-24 space-y-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">สรุปคำสั่งซื้อ</p>
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className={cn("p-2.5 rounded-xl", plan.bg)}>
                  <span className={plan.color}>{plan.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-[#0F172A] dark:text-white">SideSpark {plan.name}</p>
                  <p className="text-xs text-gray-400">{billing === "monthly" ? "รายเดือน" : "รายปี"}</p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ราคา</span>
                  <span className="font-medium text-[#0F172A] dark:text-white">
                    ฿{displayPrice.toLocaleString()} / เดือน
                  </span>
                </div>
                {billing === "annual" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ส่วนลดรายปี</span>
                    <span className="text-[#1D9E75] font-medium">
                      -฿{(plan.monthlyPrice * 12 - plan.annualPrice).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">ภาษีมูลค่าเพิ่ม (7%)</span>
                  <span className="font-medium text-[#0F172A] dark:text-white">
                    ฿{Math.round(price * 0.07).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-gray-100 dark:border-gray-800">
                <span className="font-bold text-[#0F172A] dark:text-white">รวมทั้งหมด</span>
                <span className="text-xl font-bold text-[#534AB7]">
                  ฿{Math.round(price * 1.07).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-2.5">
              {[
                { icon: <Lock className="w-3.5 h-3.5 text-[#1D9E75]" />, text: "ชำระเงินปลอดภัย 256-bit SSL" },
                { icon: <Check className="w-3.5 h-3.5 text-[#1D9E75]" />, text: "ยกเลิกได้ทุกเมื่อ ไม่มีค่าปรับ" },
                { icon: <Check className="w-3.5 h-3.5 text-[#1D9E75]" />, text: "คืนเงินภายใน 7 วันถ้าไม่พอใจ" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <div className="shrink-0">{icon}</div>
                  <span className="text-xs text-gray-500">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}