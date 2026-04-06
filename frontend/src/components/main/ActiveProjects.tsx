"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target, CheckCircle2, Circle, Plus, Wallet, TrendingUp } from "lucide-react"

export default function ActiveProjects() {
  return (
    <div className="space-y-6">
      {/* ส่วนที่ 1: โปรเจกต์ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-[#0F172A] dark:text-white">
            <Target className="w-5 h-5 text-[#8A2BE2]" /> กำลังทำอยู่
          </h2>
        </div>
        
        <div className="space-y-4">
          <Card className="border-gray-200 dark:border-gray-700 shadow-sm hover:border-[#8A2BE2]/50 transition-colors">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-[#0F172A] dark:text-white">พรีเซนต์ด้วย Canva</h3>
                  <p className="text-xs text-gray-500 mt-1">เป้าหมาย: ฿5,000</p>
                </div>
                <span className="bg-[#10B981]/10 text-[#10B981] text-[10px] font-bold px-2 py-1 rounded-full uppercase">Active</span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
                  <span>ความคืบหน้า</span>
                  <span>50%</span>
                </div>
                <Progress value={50} className="h-2 bg-gray-100 dark:bg-gray-800" />
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                <p className="text-xs font-semibold text-gray-500 mb-2">To-do list</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-400 line-through">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> ร่างโครงสร้างสไลด์
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Circle className="w-4 h-4 text-gray-300" /> ส่งดราฟต์แรกให้ลูกค้า
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700 bg-transparent shadow-none hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex flex-col items-center justify-center py-6 cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
              <Plus className="w-5 h-5 text-gray-400 group-hover:text-[#8A2BE2]" />
            </div>
            <p className="font-medium text-sm text-gray-600 dark:text-gray-400 group-hover:text-[#8A2BE2]">เริ่มโปรเจกต์ใหม่</p>
          </Card>
        </div>
      </div>

      {/* ส่วนที่ 2: Income Tracker */}
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2 text-[#0F172A] dark:text-white mb-4 mt-8">
          <Wallet className="w-5 h-5 text-[#10B981]" /> รายการล่าสุด
        </h2>
        <Card className="border-none shadow-sm bg-white/80 dark:bg-gray-800/80 backdrop-blur">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">ค่าจ้างพรีเซนต์</p>
                    <p className="text-[10px] text-gray-500">วันนี้, 14:00 น.</p>
                  </div>
                </div>
                <span className="font-bold text-[#10B981] text-sm">+ ฿1,500</span>
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <TrendingUp className="w-4 h-4 rotate-180" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Canva Pro</p>
                    <p className="text-[10px] text-gray-500">เมื่อวาน</p>
                  </div>
                </div>
                <span className="font-bold text-red-500 text-sm">- ฿250</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}