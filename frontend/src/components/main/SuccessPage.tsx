"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { api, handleApiResponse } from "@/lib/api"
import type { Milestone, Project, Statistics } from "@/types"
import {
  ArrowUp,
  Award,
  BarChart2,
  Calendar,
  CheckSquare,
  Flame,
  FolderKanban,
  Loader2,
  Plus,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Trash2,
  Zap,
} from "lucide-react"
import { normalizeProjects, type ProjectRecord } from "./projectTypes"

type AchievementFilter = "all" | "unlocked" | "locked"
type ChartView = "month" | "week"

type Achievement = {
  id: string
  icon: React.ReactNode
  label: string
  desc: string
  unlocked: boolean
  color: string
  bg: string
}

type ProfitPoint = {
  label: string
  value: number
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallbackMessage
}

function calculateGoalProgress(currentIncome: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(100, Math.round((currentIncome / goal) * 100))
}

function formatMonthLabel(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number)
  if (!year || !monthIndex) return month

  return new Date(year, monthIndex - 1, 1).toLocaleDateString("th-TH", {
    month: "short",
  })
}

function formatWeekLabel(week: string): string {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return week

  return `W${match[2]}`
}

function buildAchievements(projects: ProjectRecord[], stats: Statistics, completedTasks: number): Achievement[] {
  const projectCount = projects.length
  const totalIncome = stats.totalIncome
  const maxStreak = stats.maxStreak
  const milestones = stats.milestonesCompleted
  const reachedGoal = stats.goalsProgress.some((goal) => goal.goal > 0 && goal.current >= goal.goal)

  return [
    {
      id: "first_project",
      icon: <FolderKanban className="h-5 w-5" />,
      label: "เริ่มต้นแล้ว",
      desc: "มีโปรเจกต์แรกในระบบ",
      unlocked: projectCount >= 1,
      color: "text-[#534AB7]",
      bg: "bg-[#EEEDFE]",
    },
    {
      id: "first_income",
      icon: <TrendingUp className="h-5 w-5" />,
      label: "รายได้แรก",
      desc: "มีรายรับเข้าอย่างน้อย 1 ครั้ง",
      unlocked: totalIncome > 0,
      color: "text-[#1D9E75]",
      bg: "bg-[#E1F5EE]",
    },
    {
      id: "income_1k",
      icon: <Star className="h-5 w-5" />,
      label: "ครบ 1,000",
      desc: "รายได้รวมแตะ 1,000 บาท",
      unlocked: totalIncome >= 1000,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      id: "income_5k",
      icon: <Zap className="h-5 w-5" />,
      label: "ครบ 5,000",
      desc: "รายได้รวมแตะ 5,000 บาท",
      unlocked: totalIncome >= 5000,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      id: "streak_7",
      icon: <Flame className="h-5 w-5" />,
      label: "ต่อเนื่อง 7 วัน",
      desc: "Streak ถึง 7 วัน",
      unlocked: maxStreak >= 7,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      id: "milestone_1",
      icon: <Trophy className="h-5 w-5" />,
      label: "Milestone แรก",
      desc: "ทำ milestone สำเร็จอย่างน้อย 1 รายการ",
      unlocked: milestones >= 1,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      id: "todo_10",
      icon: <CheckSquare className="h-5 w-5" />,
      label: "งานเดินหน้า",
      desc: "ทำ task สำเร็จครบ 10 งาน",
      unlocked: completedTasks >= 10,
      color: "text-[#534AB7]",
      bg: "bg-[#EEEDFE]",
    },
    {
      id: "multi_project",
      icon: <FolderKanban className="h-5 w-5" />,
      label: "หลายโปรเจกต์",
      desc: "มีโปรเจกต์พร้อมกันอย่างน้อย 3 โปรเจกต์",
      unlocked: projectCount >= 3,
      color: "text-[#1D9E75]",
      bg: "bg-[#E1F5EE]",
    },
    {
      id: "profitable",
      icon: <BarChart2 className="h-5 w-5" />,
      label: "กำไรรวมเป็นบวก",
      desc: "รายได้รวมมากกว่ารายจ่ายรวม",
      unlocked: stats.netProfit > 0,
      color: "text-[#1D9E75]",
      bg: "bg-[#E1F5EE]",
    },
    {
      id: "goal_reached",
      icon: <Target className="h-5 w-5" />,
      label: "ถึงเป้าแล้ว",
      desc: "มีอย่างน้อย 1 โปรเจกต์ที่ถึงเป้ารายเดือน",
      unlocked: reachedGoal,
      color: "text-[#534AB7]",
      bg: "bg-[#EEEDFE]",
    },
  ]
}

function BarChart({ data, emptyLabel }: { data: ProfitPoint[]; emptyLabel: string }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-400">{emptyLabel}</p>
  }

  const maxAbs = Math.max(...data.map((item) => Math.abs(item.value)))

  return (
    <div className="flex h-36 items-end gap-2">
      {data.map(({ label, value }) => (
        <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <span className={`text-[10px] ${value >= 0 ? "text-gray-400" : "text-red-400"}`}>
            {value > 0 ? "+" : ""}
            {value >= 1000 || value <= -1000 ? `${(value / 1000).toFixed(1)}k` : value}
          </span>
          <div className="relative flex h-24 w-full items-center overflow-hidden">
            <div className="absolute inset-x-0 top-1/2 h-px bg-gray-200 dark:bg-gray-700" />
            <div
              className={`absolute left-0 w-full transition-all duration-700 ${
                value >= 0
                  ? "bottom-1/2 rounded-t-md bg-gradient-to-t from-[#534AB7] to-[#AFA9EC]"
                  : "top-1/2 rounded-b-md bg-gradient-to-b from-[#F87171] to-[#FCA5A5]"
              }`}
              style={{ height: maxAbs > 0 ? `${(Math.abs(value) / maxAbs) * 48}px` : "0px" }}
            />
          </div>
          <span className="w-full truncate text-center text-[10px] text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className={`rounded-xl p-2 ${color}`}>{icon}</div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
        </div>
        <p className="text-2xl font-bold text-[#0F172A] dark:text-white">{value}</p>
        {sub ? <p className="mt-1 text-xs text-gray-400">{sub}</p> : null}
      </CardContent>
    </Card>
  )
}

export default function SuccessPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [stats, setStats] = useState<Statistics | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [achievementFilter, setAchievementFilter] = useState<AchievementFilter>("all")
  const [chartView, setChartView] = useState<ChartView>("month")
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    target: "",
    description: "",
  })
  const [milestoneError, setMilestoneError] = useState<string | null>(null)
  const [isMilestoneCreating, setIsMilestoneCreating] = useState(false)
  const [milestoneBusyId, setMilestoneBusyId] = useState<string | null>(null)

  async function loadData() {
    setIsLoading(true)

    try {
      const [projectsResponse, statsResponse, milestonesResponse] = await Promise.all([
        api.projects.getAll(),
        api.transactions.getSummary(),
        api.milestones.getAll(),
      ])

      const [projectsData, statsData, milestonesData] = await Promise.all([
        handleApiResponse<Project[]>(projectsResponse),
        handleApiResponse<Statistics>(statsResponse),
        handleApiResponse<Milestone[]>(milestonesResponse),
      ])

      setProjects(normalizeProjects(projectsData as unknown as ProjectRecord[]))
      setStats(statsData)
      setMilestones(milestonesData)
      setError(null)
    } catch (loadError) {
      setProjects([])
      setStats(null)
      setMilestones([])
      setError(getErrorMessage(loadError, "โหลดข้อมูลความสำเร็จไม่สำเร็จ"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const completedTasks = useMemo(
    () => projects.reduce((sum, project) => sum + project.tasks.filter((task) => task.completed).length, 0),
    [projects]
  )

  const monthData = useMemo<ProfitPoint[]>(
    () => (stats?.monthlyData ?? []).map((item) => ({ label: formatMonthLabel(item.month), value: item.profit })),
    [stats]
  )

  const weekData = useMemo<ProfitPoint[]>(
    () => (stats?.weeklyData ?? []).map((item) => ({ label: formatWeekLabel(item.week), value: item.profit })),
    [stats]
  )

  const projectData = useMemo(
    () => projects.map((project) => {
      const goalProgress = stats?.goalsProgress.find((goal) => goal.projectId === project.id)
      const incomeByProject = stats?.incomeByProject.find((item) => item.projectId === project.id)
      const goal = goalProgress?.goal ?? project.monthlyGoal
      const income = incomeByProject?.total ?? goalProgress?.current ?? 0

      return {
        id: project.id,
        name: project.name,
        income,
        goal,
        progress: calculateGoalProgress(income, goal),
      }
    }),
    [projects, stats]
  )

  const achievements = useMemo(
    () => (stats ? buildAchievements(projects, stats, completedTasks) : []),
    [completedTasks, projects, stats]
  )

  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length
  const filteredAchievements = achievements.filter((achievement) =>
    achievementFilter === "all"
      ? true
      : achievementFilter === "unlocked"
        ? achievement.unlocked
        : !achievement.unlocked
  )

  async function handleCreateMilestone() {
    const title = milestoneForm.title.trim()
    const target = milestoneForm.target.trim()
    const description = milestoneForm.description.trim()

    if (!title || !target) {
      setMilestoneError("กรุณากรอกชื่อ milestone และเป้าหมาย")
      return
    }

    setIsMilestoneCreating(true)

    try {
      const response = await api.milestones.create({
        title,
        target,
        description: description || undefined,
      })

      await handleApiResponse(response)
      setMilestoneForm({ title: "", target: "", description: "" })
      setMilestoneError(null)
      await loadData()
    } catch (createError) {
      setMilestoneError(getErrorMessage(createError, "สร้าง milestone ไม่สำเร็จ"))
    } finally {
      setIsMilestoneCreating(false)
    }
  }

  async function handleToggleMilestone(milestone: Milestone) {
    setMilestoneBusyId(milestone.id)

    try {
      const response = await api.milestones.update(milestone.id, {
        achieved: !milestone.achieved,
      })

      await handleApiResponse(response)
      setMilestoneError(null)
      await loadData()
    } catch (updateError) {
      setMilestoneError(getErrorMessage(updateError, "อัปเดต milestone ไม่สำเร็จ"))
    } finally {
      setMilestoneBusyId(null)
    }
  }

  async function handleDeleteMilestone(milestoneId: string) {
    setMilestoneBusyId(milestoneId)

    try {
      const response = await api.milestones.delete(milestoneId)

      if (!response.ok) {
        await handleApiResponse(response)
      }

      setMilestoneError(null)
      await loadData()
    } catch (deleteError) {
      setMilestoneError(getErrorMessage(deleteError, "ลบ milestone ไม่สำเร็จ"))
    } finally {
      setMilestoneBusyId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        กำลังโหลดหน้าความสำเร็จ...
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
        <p>{error ?? "โหลดข้อมูลไม่สำเร็จ"}</p>
        <Button className="mt-3 rounded-xl" variant="outline" onClick={() => void loadData()}>
          ลองใหม่
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="mb-1 text-3xl font-bold text-[#0F172A] dark:text-white">ความสำเร็จ</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          ภาพรวมผลลัพธ์ของทุกโปรเจกต์จากข้อมูลจริงในระบบ
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          icon={<TrendingUp className="h-4 w-4 text-[#534AB7]" />}
          label="รายได้รวม"
          value={`฿${stats.totalIncome.toLocaleString()}`}
          sub="ทุกโปรเจกต์"
          color="bg-[#EEEDFE]"
        />
        <KpiCard
          icon={<TrendingDown className="h-4 w-4 text-red-500" />}
          label="รายจ่ายรวม"
          value={`฿${stats.totalExpense.toLocaleString()}`}
          sub="จากรายการ expense"
          color="bg-red-50 dark:bg-red-900/20"
        />
        <KpiCard
          icon={<BarChart2 className={`h-4 w-4 ${stats.netProfit >= 0 ? "text-[#1D9E75]" : "text-red-500"}`} />}
          label={stats.netProfit >= 0 ? "กำไรสุทธิ" : "ขาดทุนสุทธิ"}
          value={`${stats.netProfit >= 0 ? "+" : ""}฿${stats.netProfit.toLocaleString()}`}
          color={stats.netProfit >= 0 ? "bg-[#E1F5EE]" : "bg-red-50 dark:bg-red-900/20"}
        />
        <KpiCard
          icon={<Flame className="h-4 w-4 text-orange-500" />}
          label="Streak"
          value={`${stats.streak} วัน`}
          sub="ความต่อเนื่องล่าสุด"
          color="bg-orange-50 dark:bg-orange-900/20"
        />
        <KpiCard
          icon={<Award className="h-4 w-4 text-amber-600" />}
          label="Max Streak"
          value={`${stats.maxStreak} วัน`}
          sub="สถิติสูงสุดที่ทำได้"
          color="bg-amber-50 dark:bg-amber-900/20"
        />
        <KpiCard
          icon={<Trophy className="h-4 w-4 text-yellow-600" />}
          label="Milestones"
          value={`${stats.milestonesCompleted} รายการ`}
          sub="ทำสำเร็จแล้ว"
          color="bg-yellow-50 dark:bg-yellow-900/20"
        />
        <KpiCard
          icon={<CheckSquare className="h-4 w-4 text-[#534AB7]" />}
          label="Task สำเร็จ"
          value={`${completedTasks} งาน`}
          sub={`${projects.length} โปรเจกต์`}
          color="bg-[#EEEDFE]"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#7F77DD]" />
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                  {chartView === "month" ? "กำไรสุทธิรายเดือน" : "กำไรสุทธิรายสัปดาห์"}
                </p>
              </div>

              <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                {(["month", "week"] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setChartView(view)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      chartView === view
                        ? "bg-[#7F77DD] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    {view === "month" ? "รายเดือน" : "รายสัปดาห์"}
                  </button>
                ))}
              </div>
            </div>
            <BarChart
              data={chartView === "month" ? monthData : weekData}
              emptyLabel={chartView === "month" ? "ยังไม่มีข้อมูลรายเดือน" : "ยังไม่มีข้อมูลรายสัปดาห์"}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <ArrowUp className="h-4 w-4 text-[#7F77DD]" />
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">รายได้ต่อโปรเจกต์เทียบเป้ารายเดือน</p>
            </div>
            <div className="space-y-4">
              {projectData.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400">ยังไม่มีโปรเจกต์</p>
              ) : (
                projectData.map(({ id, name, income, goal, progress }) => (
                  <div key={id}>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <span className="max-w-[60%] truncate text-sm font-medium text-[#0F172A] dark:text-white">{name}</span>
                      <span className="shrink-0 text-xs text-gray-400">
                        ฿{income.toLocaleString()} / ฿{goal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#7F77DD] to-[#AFA9EC] transition-all duration-700"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right text-[11px] font-semibold text-[#534AB7] dark:text-[#AFA9EC]">
                        {progress}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-[#7F77DD]" />
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">สถานะเป้ารายเดือนของโปรเจกต์</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projectData.length === 0 ? (
              <p className="text-sm text-gray-400">ยังไม่มีข้อมูลโปรเจกต์</p>
            ) : (
              projectData.map(({ id, name, income, goal, progress }) => (
                <div key={id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
                  <p className="truncate text-sm font-semibold text-[#0F172A] dark:text-white">{name}</p>
                  <p className="mt-1 text-[11px] text-gray-400">เป้ารายเดือน ฿{goal.toLocaleString()}</p>
                  <p className="mt-2 text-sm font-bold text-[#534AB7] dark:text-[#AFA9EC]">ทำได้ ฿{income.toLocaleString()}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-[#7F77DD]"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-gray-500">{progress}%</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-200 dark:border-gray-800">
        <CardContent className="space-y-5 p-5">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#7F77DD]" />
            <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">Milestones</h2>
            <span className="rounded-full bg-[#EEEDFE] px-2.5 py-1 text-xs font-semibold text-[#534AB7]">
              {stats.milestonesCompleted}/{milestones.length}
            </span>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_1.4fr]">
            <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
              <Input
                placeholder="เช่น รายได้ครบ 1,000 บาท"
                value={milestoneForm.title}
                onChange={(event) => {
                  setMilestoneForm((current) => ({ ...current, title: event.target.value }))
                  setMilestoneError(null)
                }}
                className="rounded-xl bg-white dark:bg-gray-950"
              />
              <Input
                placeholder="เช่น ปิดงานแรกให้ได้ภายในเดือนนี้"
                value={milestoneForm.target}
                onChange={(event) => {
                  setMilestoneForm((current) => ({ ...current, target: event.target.value }))
                  setMilestoneError(null)
                }}
                className="rounded-xl bg-white dark:bg-gray-950"
              />
              <Textarea
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                value={milestoneForm.description}
                onChange={(event) => {
                  setMilestoneForm((current) => ({ ...current, description: event.target.value }))
                  setMilestoneError(null)
                }}
                rows={3}
                className="resize-none rounded-xl bg-white dark:bg-gray-950"
              />
              {milestoneError ? <p className="text-sm text-red-500">{milestoneError}</p> : null}
              <Button
                type="button"
                onClick={() => void handleCreateMilestone()}
                disabled={isMilestoneCreating}
                className="w-full gap-2 rounded-xl bg-[#7F77DD] text-white hover:bg-[#534AB7]"
              >
                {isMilestoneCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                เพิ่ม milestone
              </Button>
            </div>

            <div className="space-y-3">
              {milestones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-400 dark:border-gray-800">
                  ยังไม่มี milestone
                </div>
              ) : (
                milestones.map((milestone) => {
                  const isBusy = milestoneBusyId === milestone.id

                  return (
                    <div
                      key={milestone.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        milestone.achieved
                          ? "border-[#5DCAA5] bg-[#EAF8F2] dark:border-[#1D9E75]/60 dark:bg-[#0E2D22]"
                          : "border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{milestone.title}</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{milestone.target}</p>
                          {milestone.description ? (
                            <p className="mt-2 text-xs leading-relaxed text-gray-400">{milestone.description}</p>
                          ) : null}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            milestone.achieved
                              ? "bg-[#1D9E75] text-white"
                              : "bg-[#EEEDFE] text-[#534AB7]"
                          }`}
                        >
                          {milestone.achieved ? "สำเร็จแล้ว" : "กำลังทำ"}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          disabled={isBusy}
                          aria-label={`${milestone.achieved ? "ยกเลิกสำเร็จ" : "ทำสำเร็จ"} ${milestone.title}`}
                          onClick={() => void handleToggleMilestone(milestone)}
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : milestone.achieved ? (
                            "ยกเลิกสำเร็จ"
                          ) : (
                            "ทำสำเร็จ"
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl text-red-500 hover:text-red-600"
                          disabled={isBusy}
                          aria-label={`ลบ milestone ${milestone.title}`}
                          onClick={() => void handleDeleteMilestone(milestone.id)}
                        >
                          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#7F77DD]" />
            <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">Achievements</h2>
            <span className="rounded-full bg-[#EEEDFE] px-2.5 py-1 text-xs font-semibold text-[#534AB7]">
              {unlockedCount}/{achievements.length}
            </span>
          </div>

          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            {(["all", "unlocked", "locked"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setAchievementFilter(filter)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  achievementFilter === filter
                    ? "bg-[#7F77DD] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {filter === "all" ? "ทั้งหมด" : filter === "unlocked" ? "ได้แล้ว" : "ยังไม่ได้"}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="mb-1.5 flex justify-between text-xs text-gray-400">
            <span>ความก้าวหน้า</span>
            <span>{unlockedCount} / {achievements.length} รายการ</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7F77DD] to-[#AFA9EC] transition-all duration-700"
              style={{ width: `${achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`flex items-start gap-3 rounded-2xl border p-4 transition-all ${
                achievement.unlocked
                  ? "border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
                  : "border-gray-100 bg-gray-50 opacity-50 grayscale dark:border-gray-800 dark:bg-gray-800/40"
              }`}
            >
              <div className={`shrink-0 rounded-xl p-2.5 ${achievement.unlocked ? achievement.bg : "bg-gray-100 dark:bg-gray-800"}`}>
                <span className={achievement.unlocked ? achievement.color : "text-gray-400"}>{achievement.icon}</span>
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${achievement.unlocked ? "text-[#0F172A] dark:text-white" : "text-gray-400"}`}>
                  {achievement.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-gray-400">{achievement.desc}</p>
                {achievement.unlocked ? (
                  <span className="mt-1.5 inline-block rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[10px] font-semibold text-[#1D9E75]">
                    ปลดล็อกแล้ว
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
