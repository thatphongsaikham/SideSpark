// components/main/SuccessPage.tsx
"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  TrendingUp, TrendingDown, BarChart2, Flame, Trophy,
  Target, CheckSquare, FolderKanban, Star, Zap, Award,
  Calendar, ArrowUp,
} from "lucide-react"
import { Project } from "@/types/project"

// ─── Mock Data (same projects as ProjectsPage) ────────────────────────────────
const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    name: "รับทำพรีเซนต์ Canva",
    description: "รับทำสไลด์สัมมนาและงานกลุ่มให้นักศึกษา",
    initialCost: 0,
    incomeGoal: 5000,
    createdAt: "2026-03-01",
    streak: 12,
    todos: [
      { id: "t1", text: "ออกแบบ Template ใหม่", done: true, createdAt: "2026-03-05" },
      { id: "t2", text: "โพสต์โฆษณาใน Facebook Group", done: false, createdAt: "2026-03-06" },
      { id: "t3", text: "เตรียม Portfolio", done: false, createdAt: "2026-03-07" },
    ],
    transactions: [
      { id: "tx1", type: "income", label: "งาน: สไลด์สัมมนา", amount: 800, date: "2026-03-10" },
      { id: "tx2", type: "income", label: "งาน: Pitch Deck", amount: 1500, date: "2026-03-17" },
      { id: "tx3", type: "expense", label: "ซื้อ Canva Pro", amount: 500, date: "2026-03-01" },
      { id: "tx4", type: "income", label: "งาน: รายงาน", amount: 600, date: "2026-03-24" },
      { id: "tx5", type: "income", label: "งาน: สไลด์คลาส", amount: 400, date: "2026-03-31" },
    ],
    milestones: [
      { id: "m1", label: "รายได้ครบ ฿1,000", targetAmount: 1000, reached: true, reachedAt: "2026-03-10" },
      { id: "m2", label: "รายได้ครบ ฿3,000", targetAmount: 3000, reached: true, reachedAt: "2026-03-24" },
      { id: "m3", label: "รายได้ครบ ฿5,000", targetAmount: 5000, reached: false },
    ],
  },
  {
    id: "2",
    name: "ถ่ายรูปสินค้า Shopee",
    description: "รับถ่ายภาพสินค้าสำหรับร้านค้าออนไลน์",
    initialCost: 2000,
    incomeGoal: 10000,
    createdAt: "2026-03-10",
    streak: 5,
    todos: [
      { id: "t1", text: "ซื้ออุปกรณ์พร็อพถ่ายภาพ", done: true, createdAt: "2026-03-10" },
      { id: "t2", text: "ติดต่อร้านค้า 5 ร้าน", done: false, createdAt: "2026-03-11" },
    ],
    transactions: [
      { id: "tx1", type: "expense", label: "ซื้ออุปกรณ์", amount: 2000, date: "2026-03-10" },
      { id: "tx2", type: "income", label: "งาน: ร้าน ABC", amount: 1500, date: "2026-03-20" },
      { id: "tx3", type: "income", label: "งาน: ร้าน XYZ", amount: 2000, date: "2026-03-27" },
    ],
    milestones: [
      { id: "m1", label: "คืนทุนแล้ว", targetAmount: 2000, reached: true, reachedAt: "2026-03-20" },
      { id: "m2", label: "รายได้ครบ ฿5,000", targetAmount: 5000, reached: false },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function totalIncome(projects: Project[]) {
  return projects.flatMap((p) => p.transactions).filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
}
function totalExpense(projects: Project[]) {
  return projects.flatMap((p) => p.transactions).filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0) +
    projects.reduce((s, p) => s + p.initialCost, 0)
}
function totalNet(projects: Project[]) { return totalIncome(projects) - totalExpense(projects) }
function maxStreak(projects: Project[]) { return Math.max(0, ...projects.map((p) => p.streak)) }
function totalMilestones(projects: Project[]) { return projects.flatMap((p) => p.milestones).filter((m) => m.reached).length }
function totalTodos(projects: Project[]) { return projects.flatMap((p) => p.todos).filter((t) => t.done).length }

// Group all income by month across projects
const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
function incomeByMonth(projects: Project[]): { label: string; value: number }[] {
  const map: Record<string, number> = {}
  projects.flatMap((p) => p.transactions).filter((t) => t.type === "income").forEach((t) => {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    map[key] = (map[key] ?? 0) + t.amount
  })
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const [, month] = key.split("-")
      return { label: THAI_MONTHS[parseInt(month)], value }
    })
}

// Income per project
function incomeByProject(projects: Project[]): { name: string; income: number; goal: number }[] {
  return projects.map((p) => ({
    name: p.name,
    income: p.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    goal: p.incomeGoal,
  }))
}

// ─── Achievement definitions ──────────────────────────────────────────────────
type Achievement = {
  id: string
  icon: React.ReactNode
  label: string
  desc: string
  unlocked: boolean
  color: string
  bg: string
}

function buildAchievements(projects: Project[]): Achievement[] {
  const income = totalIncome(projects)
  const streak = maxStreak(projects)
  const ms = totalMilestones(projects)
  const todos = totalTodos(projects)
  const projectCount = projects.length

  return [
    {
      id: "first_project",
      icon: <FolderKanban className="w-5 h-5" />,
      label: "เริ่มต้นแล้ว!",
      desc: "สร้างโปรเจกต์แรก",
      unlocked: projectCount >= 1,
      color: "text-[#534AB7]",
      bg: "bg-[#EEEDFE]",
    },
    {
      id: "first_income",
      icon: <TrendingUp className="w-5 h-5" />,
      label: "รายได้แรก",
      desc: "บันทึกรายรับครั้งแรก",
      unlocked: income > 0,
      color: "text-[#1D9E75]",
      bg: "bg-[#E1F5EE]",
    },
    {
      id: "income_1k",
      icon: <Star className="w-5 h-5" />,
      label: "หมื่นแรก",
      desc: "รายได้รวมถึง ฿1,000",
      unlocked: income >= 1000,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      id: "income_5k",
      icon: <Zap className="w-5 h-5" />,
      label: "ห้าพันสตางค์",
      desc: "รายได้รวมถึง ฿5,000",
      unlocked: income >= 5000,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      id: "streak_7",
      icon: <Flame className="w-5 h-5" />,
      label: "ไม่หยุดพัก",
      desc: "Streak ต่อเนื่อง 7 วัน",
      unlocked: streak >= 7,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      id: "streak_30",
      icon: <Flame className="w-5 h-5" />,
      label: "นักสู้ตัวจริง",
      desc: "Streak ต่อเนื่อง 30 วัน",
      unlocked: streak >= 30,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      id: "milestone_1",
      icon: <Trophy className="w-5 h-5" />,
      label: "Milestone แรก",
      desc: "บรรลุ Milestone ครั้งแรก",
      unlocked: ms >= 1,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      id: "milestone_5",
      icon: <Award className="w-5 h-5" />,
      label: "นักสะสม",
      desc: "บรรลุ Milestone 5 ครั้ง",
      unlocked: ms >= 5,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      id: "todo_10",
      icon: <CheckSquare className="w-5 h-5" />,
      label: "ขยันจริง",
      desc: "ทำ To-Do สำเร็จ 10 อย่าง",
      unlocked: todos >= 10,
      color: "text-[#534AB7]",
      bg: "bg-[#EEEDFE]",
    },
    {
      id: "multi_project",
      icon: <FolderKanban className="w-5 h-5" />,
      label: "หลายสายงาน",
      desc: "มีโปรเจกต์พร้อมกัน 3 อย่าง",
      unlocked: projectCount >= 3,
      color: "text-[#1D9E75]",
      bg: "bg-[#E1F5EE]",
    },
    {
      id: "profitable",
      icon: <BarChart2 className="w-5 h-5" />,
      label: "ติดบวก",
      desc: "กำไรรวมเป็นบวก",
      unlocked: totalNet(projects) > 0,
      color: "text-[#1D9E75]",
      bg: "bg-[#E1F5EE]",
    },
    {
      id: "goal_reached",
      icon: <Target className="w-5 h-5" />,
      label: "ถึงเป้าแล้ว!",
      desc: "บรรลุเป้าหมายรายได้ของโปรเจกต์",
      unlocked: projects.some((p) => {
        const inc = p.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
        return p.incomeGoal > 0 && inc >= p.incomeGoal
      }),
      color: "text-[#534AB7]",
      bg: "bg-[#EEEDFE]",
    },
  ]
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0)
    return <p className="text-sm text-gray-400 text-center py-10">ยังไม่มีข้อมูลรายได้</p>
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <span className="text-[10px] text-gray-400">{value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}</span>
          <div className="w-full rounded-t-md bg-[#7F77DD]/10 flex items-end overflow-hidden" style={{ height: "80px" }}>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-[#534AB7] to-[#AFA9EC] transition-all duration-700"
              style={{ height: max > 0 ? `${(value / max) * 80}px` : "0px" }}
            />
          </div>
          <span className="text-[10px] text-gray-500 truncate w-full text-center">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string
}) {
  return (
    <Card className="border-gray-200 dark:border-gray-800 rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
        </div>
        <p className="text-2xl font-bold text-[#0F172A] dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SuccessPage() {
  const projects = MOCK_PROJECTS
  const [achievementFilter, setAchievementFilter] = useState<"all" | "unlocked" | "locked">("all")

  const income = useMemo(() => totalIncome(projects), [projects])
  const expense = useMemo(() => totalExpense(projects), [projects])
  const net = income - expense
  const streak = maxStreak(projects)
  const msCount = totalMilestones(projects)
  const todoCount = totalTodos(projects)
  const monthData = useMemo(() => incomeByMonth(projects), [projects])
  const projectData = useMemo(() => incomeByProject(projects), [projects])
  const achievements = useMemo(() => buildAchievements(projects), [projects])

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const filteredAchievements = achievements.filter((a) =>
    achievementFilter === "all" ? true : achievementFilter === "unlocked" ? a.unlocked : !a.unlocked
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#0F172A] dark:text-white mb-1">ความสำเร็จ 🏆</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">ภาพรวมทุกโปรเจกต์และความก้าวหน้าของคุณ</p>
      </div>

      {/* ── KPI Overview ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          icon={<TrendingUp className="w-4 h-4 text-[#534AB7]" />}
          label="รายได้รวม"
          value={`฿${income.toLocaleString()}`}
          sub="ทุกโปรเจกต์"
          color="bg-[#EEEDFE]"
        />
        <KpiCard
          icon={<TrendingDown className="w-4 h-4 text-red-500" />}
          label="รายจ่ายรวม"
          value={`฿${expense.toLocaleString()}`}
          sub="รวมต้นทุน"
          color="bg-red-50 dark:bg-red-900/20"
        />
        <KpiCard
          icon={<BarChart2 className={`w-4 h-4 ${net >= 0 ? "text-[#1D9E75]" : "text-red-500"}`} />}
          label={net >= 0 ? "กำไรสุทธิ" : "ขาดทุน"}
          value={`${net >= 0 ? "+" : ""}฿${net.toLocaleString()}`}
          color={net >= 0 ? "bg-[#E1F5EE]" : "bg-red-50 dark:bg-red-900/20"}
        />
        <KpiCard
          icon={<Flame className="w-4 h-4 text-orange-500" />}
          label="Streak สูงสุด"
          value={`${streak} วัน`}
          color="bg-orange-50 dark:bg-orange-900/20"
        />
        <KpiCard
          icon={<Trophy className="w-4 h-4 text-yellow-600" />}
          label="Milestones"
          value={`${msCount} รายการ`}
          sub="บรรลุแล้ว"
          color="bg-yellow-50 dark:bg-yellow-900/20"
        />
        <KpiCard
          icon={<CheckSquare className="w-4 h-4 text-[#534AB7]" />}
          label="To-Do สำเร็จ"
          value={`${todoCount} งาน`}
          color="bg-[#EEEDFE]"
        />
      </div>

      {/* ── Charts Row ────────────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Monthly Income Chart */}
        <Card className="border-gray-200 dark:border-gray-800 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-[#7F77DD]" />
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">รายได้รายเดือน (ทุกโปรเจกต์)</p>
            </div>
            <BarChart data={monthData} />
          </CardContent>
        </Card>

        {/* Per-Project Comparison */}
        <Card className="border-gray-200 dark:border-gray-800 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUp className="w-4 h-4 text-[#7F77DD]" />
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">รายได้แต่ละโปรเจกต์ vs เป้าหมาย</p>
            </div>
            <div className="space-y-4">
              {projectData.map(({ name, income: inc, goal }) => {
                const pct = goal > 0 ? Math.min(100, Math.round((inc / goal) * 100)) : 0
                return (
                  <div key={name}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm text-[#0F172A] dark:text-white font-medium truncate max-w-[60%]">{name}</span>
                      <span className="text-xs text-gray-400 shrink-0">
                        ฿{inc.toLocaleString()} / ฿{goal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#7F77DD] to-[#AFA9EC] transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-[#534AB7] dark:text-[#AFA9EC] w-9 text-right shrink-0">
                        {pct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── All Milestones ────────────────────────────────────────────────────── */}
      <Card className="border-gray-200 dark:border-gray-800 rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Milestones ทั้งหมด</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {projects.flatMap((p) =>
              p.milestones.map((ms) => (
                <div
                  key={`${p.id}-${ms.id}`}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    ms.reached
                      ? "bg-[#EAF3DE] dark:bg-[#27500A]/20 border-[#97C459] dark:border-[#3B6D11]"
                      : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800"
                  }`}
                >
                  <Trophy className={`w-4 h-4 mt-0.5 shrink-0 ${ms.reached ? "text-[#3B6D11]" : "text-gray-300"}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${ms.reached ? "text-[#27500A] dark:text-[#C0DD97]" : "text-[#0F172A] dark:text-white"}`}>
                      {ms.label}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{p.name}</p>
                    {ms.reached && ms.reachedAt && (
                      <p className="text-[11px] text-[#1D9E75] mt-0.5">
                        ✓ {new Date(ms.reachedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Achievements ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#7F77DD]" />
            <h2 className="text-lg font-bold text-[#0F172A] dark:text-white">Achievements</h2>
            <span className="text-xs bg-[#EEEDFE] text-[#534AB7] font-semibold px-2.5 py-1 rounded-full">
              {unlockedCount}/{achievements.length}
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {(["all", "unlocked", "locked"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setAchievementFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  achievementFilter === f
                    ? "bg-[#7F77DD] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {f === "all" ? "ทั้งหมด" : f === "unlocked" ? "ได้แล้ว" : "ยังไม่ได้"}
              </button>
            ))}
          </div>
        </div>

        {/* Achievement Progress Bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>ความก้าวหน้า</span>
            <span>{unlockedCount} / {achievements.length} รายการ</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7F77DD] to-[#AFA9EC] transition-all duration-700"
              style={{ width: `${achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAchievements.map((a) => (
            <div
              key={a.id}
              className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                a.unlocked
                  ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-sm"
                  : "bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 opacity-50 grayscale"
              }`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${a.unlocked ? a.bg : "bg-gray-100 dark:bg-gray-800"}`}>
                <span className={a.unlocked ? a.color : "text-gray-400"}>{a.icon}</span>
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${a.unlocked ? "text-[#0F172A] dark:text-white" : "text-gray-400"}`}>
                  {a.label}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{a.desc}</p>
                {a.unlocked && (
                  <span className="inline-block mt-1.5 text-[10px] bg-[#E1F5EE] text-[#1D9E75] font-semibold px-2 py-0.5 rounded-full">
                    ✓ ปลดล็อกแล้ว
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}