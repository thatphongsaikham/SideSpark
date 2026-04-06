"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api, handleApiResponse } from "@/lib/api"
import type { IdeaRecommendation } from "@/types"
import { Check, Plus, Lightbulb, Loader2 } from "lucide-react"

function formatIncomeRange(idea: IdeaRecommendation): string {
  return `฿${idea.estimatedIncome.min.toLocaleString()} - ${idea.estimatedIncome.max.toLocaleString()}`
}

export default function MainDashboard() {
  const [recommendations, setRecommendations] = useState<IdeaRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.ideas.getAll()
        const data = await handleApiResponse<IdeaRecommendation[]>(response)
        setRecommendations(data)
      } catch (error) {
        console.error("Failed to fetch ideas", error)
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [])

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-1">
        <Card className="border-none bg-white/60 shadow-sm backdrop-blur-sm dark:bg-gray-800/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Check className="h-5 w-5 text-[#10B981]" /> ทักษะของฉัน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["การออกแบบ", "Canva"].map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-[#8A2BE2]/10 px-3 py-1 text-sm font-medium text-[#8A2BE2]"
                >
                  {skill}
                </span>
              ))}
              <Button variant="outline" size="sm" className="rounded-full border-dashed">
                <Plus className="mr-1 h-3 w-3" /> เพิ่มทักษะ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Lightbulb className="h-5 w-5 text-[#FFD600]" /> ไอเดียที่เหมาะกับคุณ
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#8A2BE2]" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.map((idea) => (
              <Card
                key={idea.id}
                className="group cursor-pointer overflow-hidden transition-all hover:border-[#8A2BE2]"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg transition-colors group-hover:text-[#8A2BE2]">
                      {idea.title}
                    </CardTitle>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase dark:bg-gray-700">
                      {idea.difficulty}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 line-clamp-2 text-sm text-gray-500">{idea.description}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="font-bold text-[#10B981]">{formatIncomeRange(idea)}</span>
                    <Button size="sm" className="bg-[#8A2BE2] hover:bg-[#8A2BE2]/90">
                      เริ่มเลย
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
