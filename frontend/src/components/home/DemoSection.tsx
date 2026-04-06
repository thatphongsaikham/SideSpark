"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Lightbulb, TrendingUp, BarChart3, ArrowRight, CheckCircle2 } from "lucide-react"

export default function DemoSection() {
  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4">ทดลองใช้งานหน้าต่างจำลอง</h2>
        <p className="text-gray-500">สัมผัสประสบการณ์ใช้งานจริงของ SideSpark</p>
      </div>

      <Card className="max-w-4xl mx-auto shadow-2xl border-gray-200/50 dark:border-gray-700/50 rounded-2xl overflow-hidden bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-xl">
        <CardContent className="p-0">
          <Tabs defaultValue="dashboard" className="w-full">
            <div className="px-6 pt-6 border-b border-gray-100 dark:border-gray-800">
              <TabsList className="w-full justify-start h-auto bg-transparent gap-6 p-0">
                <TabsTrigger value="dashboard" className="data-[state=active]:border-b-2 data-[state=active]:border-[#8A2BE2] data-[state=active]:text-[#8A2BE2] rounded-none px-2 py-3 bg-transparent shadow-none">
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="discover" className="data-[state=active]:border-b-2 data-[state=active]:border-[#8A2BE2] data-[state=active]:text-[#8A2BE2] rounded-none px-2 py-3 bg-transparent shadow-none">
                  ค้นหาไอเดีย
                </TabsTrigger>
                <TabsTrigger value="track" className="data-[state=active]:border-b-2 data-[state=active]:border-[#8A2BE2] data-[state=active]:text-[#8A2BE2] rounded-none px-2 py-3 bg-transparent shadow-none">
                  ติดตามรายได้
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 md:p-8">
              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6 m-0 animate-in fade-in-50 duration-500">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="border-none shadow-sm bg-gray-50 dark:bg-gray-800/50">
                    <CardContent className="p-5">
                      <div className="text-sm font-medium text-gray-500 mb-1">รายได้เดือนนี้</div>
                      <div className="text-2xl font-bold text-[#1E293B] dark:text-white">฿12,500</div>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm bg-[#10B981]/10">
                    <CardContent className="p-5">
                      <div className="text-sm font-medium text-[#10B981] mb-1">กำไรสุทธิ</div>
                      <div className="text-2xl font-bold text-[#10B981]">฿8,500</div>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm bg-[#8A2BE2]/10">
                    <CardContent className="p-5">
                      <div className="text-sm font-medium text-[#8A2BE2] mb-1">Streak ทำงาน</div>
                      <div className="text-2xl font-bold text-[#8A2BE2]">7 วัน</div>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-sm bg-[#FFD600]/10">
                    <CardContent className="p-5">
                      <div className="text-sm font-medium text-[#D4B300] dark:text-[#FFD600] mb-1">เป้าหมายสำเร็จ</div>
                      <div className="text-2xl font-bold text-[#D4B300] dark:text-[#FFD600]">3/5</div>
                    </CardContent>
                  </Card>
                </div>
                <Card className="border-none shadow-sm bg-gray-50 dark:bg-gray-800/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[#8A2BE2]" />
                      ภาพรวมการเติบโต
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 flex items-end justify-around gap-4 pt-4">
                      {[40, 60, 45, 80].map((height, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                          <div className="w-full max-w-[4rem] bg-[#8A2BE2]/20 rounded-t-md relative group-hover:bg-[#8A2BE2]/30 transition-colors" style={{ height: '100%' }}>
                            <div
                              className="absolute bottom-0 w-full bg-gradient-to-t from-[#8A2BE2] to-[#A855F7] rounded-t-md transition-all duration-500"
                              style={{ height: `${height}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 font-medium">สัปดาห์ {i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Discover Tab */}
              <TabsContent value="discover" className="space-y-6 m-0 animate-in fade-in-50 duration-500">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                    <Lightbulb className="h-5 w-5 text-[#FFD600]" />
                    ทักษะที่คุณสนใจคืออะไร?
                  </h3>
                  <div className="flex gap-3 flex-wrap">
                    {['การออกแบบ', 'การเขียน', 'เขียนโปรแกรม', 'การตลาด', 'ตัดต่อวิดีโอ'].map((skill, i) => (
                      <Button key={skill} variant={i === 0 ? "default" : "outline"} className={i === 0 ? "bg-[#8A2BE2] hover:bg-[#8A2BE2]/90 text-white rounded-full" : "rounded-full"}>
                        {skill}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">ไอเดียทำเงินที่แนะนำ</h3>
                  {[
                    { title: 'ออกแบบโลโก้สำหรับ SME', price: '฿5,000 - ฿15,000' },
                    { title: 'รับออกแบบ UI/UX เว็บไซต์', price: '฿10,000 - ฿30,000' }
                  ].map((idea, i) => (
                    <div key={i} className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-[#8A2BE2] transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-gray-300 group-hover:text-[#8A2BE2] transition-colors" />
                        <span className="font-medium">{idea.title}</span>
                      </div>
                      <span className="text-[#10B981] font-semibold bg-[#10B981]/10 px-3 py-1 rounded-full text-sm">
                        {idea.price}
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Track Tab */}
              <TabsContent value="track" className="space-y-6 m-0 animate-in fade-in-50 duration-500">
                <div className="bg-gradient-to-br from-[#10B981] to-[#059669] p-8 rounded-2xl text-white shadow-lg shadow-[#10B981]/20">
                  <h3 className="font-medium text-white/80 mb-1">ยอดเงินคงเหลือสุทธิ</h3>
                  <div className="text-4xl font-bold tracking-tight mb-2">฿8,500.00</div>
                  <p className="text-sm text-white/90 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> เติบโตขึ้น 12% จากเดือนที่แล้ว
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 pt-2">รายการล่าสุด</h3>
                  <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-[#10B981]" />
                      </div>
                      <div>
                        <div className="font-medium">ค่าจ้างออกแบบโลโก้</div>
                        <div className="text-xs text-gray-500">วันนี้, 14:30 น.</div>
                      </div>
                    </div>
                    <span className="text-[#10B981] font-bold text-lg">+฿5,000</span>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-red-500 rotate-45" />
                      </div>
                      <div>
                        <div className="font-medium">ค่าบริการซอฟต์แวร์รายเดือน</div>
                        <div className="text-xs text-gray-500">20 มี.ค. 2026</div>
                      </div>
                    </div>
                    <span className="text-red-500 font-bold text-lg">-฿2,000</span>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
