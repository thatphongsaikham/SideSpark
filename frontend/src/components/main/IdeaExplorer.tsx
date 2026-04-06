"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lightbulb, ChevronRight } from "lucide-react"

export default function IdeaExplorer() {
  const ideas = [
    {
      title: "รับถ่ายรูปสินค้าลง Shopee/TikTok",
      description: "รับถ่ายภาพสินค้าจัดเซตสวยๆ สำหรับร้านค้าออนไลน์ขนาดเล็ก ใช้แค่มือถือและจัดแสงธรรมชาติ",
      difficulty: "เริ่มต้นง่าย",
      income: "฿500 - ฿3,000",
      color: "text-[#D4B300] dark:text-[#FFD600]",
      bg: "bg-[#FFD600]/10",
      match: true
    },
    {
      title: "รับวาด Digital Portrait",
      description: "วาดภาพเหมือนสไตล์การ์ตูนเพื่อเป็นของขวัญวันเกิด ปริญญา หรือทำสติ๊กเกอร์ไลน์",
      difficulty: "ปานกลาง",
      income: "฿200 - ฿2,000",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      match: false
    },
    {
      title: "เขียนบทความลง Blockdit/Medium",
      description: "สรุปความรู้หรือรีวิวสินค้าลงแพลตฟอร์มบทความ สร้างรายได้จากยอดอ่าน",
      difficulty: "เริ่มต้นง่าย",
      income: "฿1,000 - ฿5,000",
      color: "text-[#D4B300] dark:text-[#FFD600]",
      bg: "bg-[#FFD600]/10",
      match: false
    },
    {
      title: "ออกแบบโลโก้สำหรับ SME",
      description: "รับจ้างออกแบบโลโก้สำหรับร้านค้าเล็กและธุรกิจ SME ที่เพิ่งเริ่มต้น",
      difficulty: "ยาก",
      income: "฿5,000 - ฿15,000",
      color: "text-red-500",
      bg: "bg-red-500/10",
      match: true
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-[#0F172A] dark:text-white">
          <Lightbulb className="w-5 h-5 text-[#FFD600]" /> จุดประกายไอเดีย
        </h2>
        <div className="flex gap-2">
          <span className="text-sm text-gray-500 hidden md:inline-flex items-center mr-2">ทักษะของคุณ:</span>
          <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium">#วาดรูป</span>
          <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium">#ถ่ายรูป</span>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {ideas.map((idea, idx) => (
          <Card key={idx} className="border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-[#8A2BE2]/50 transition-all cursor-pointer group flex flex-col">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start mb-2">
                <span className={`${idea.bg} ${idea.color} text-[10px] font-bold px-2 py-1 rounded-full uppercase`}>
                  {idea.difficulty}
                </span>
                {idea.match && (
                  <span className="text-[10px] font-bold text-white bg-[#8A2BE2] px-2 py-1 rounded-full shadow-sm">
                    ✨ ตรงกับทักษะ
                  </span>
                )}
              </div>
              <CardTitle className="text-base group-hover:text-[#8A2BE2] transition-colors leading-tight">
                {idea.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1 flex flex-col">
              <p className="text-xs text-gray-500 mb-4 line-clamp-2 flex-1">
                {idea.description}
              </p>
              <div className="flex items-end justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                <div>
                  <p className="text-[10px] text-gray-400">รายได้ประเมิน</p>
                  <p className="text-sm font-bold text-[#10B981]">{idea.income}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full bg-[#8A2BE2]/5 text-[#8A2BE2] group-hover:bg-[#8A2BE2] group-hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}