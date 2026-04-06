"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, TrendingUp, Flame, Target } from "lucide-react"

export default function DashboardStats() {
  const stats = [
    { label: "รายได้เดือนนี้", value: "฿3,500", icon: Wallet, color: "text-[#10B981]", bg: "bg-[#10B981]/10" },
    { label: "กำไรสุทธิ", value: "฿2,800", icon: TrendingUp, color: "text-[#8A2BE2]", bg: "bg-[#8A2BE2]/10" },
    { label: "ทำต่อเนื่อง (Streak)", value: "5 วัน", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "เป้าหมายที่สำเร็จ", value: "1/3", icon: Target, color: "text-[#D4B300] dark:text-[#FFD600]", bg: "bg-[#FFD600]/10" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <Card key={i} className="border-none shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur">
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-[#0F172A] dark:text-white">{stat.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}