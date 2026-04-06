// components/main/ProjectDetail.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  X, CheckSquare, Square, Plus, Trash2, TrendingUp, TrendingDown,
  Target, Flame, Trophy, Pencil, Check, BarChart2,
} from "lucide-react"
import { Project, TodoItem, Transaction, Milestone } from "@/types/project"

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "overview" | "todo" | "finance" | "chart" | "milestones"

interface Props {
  project: Project
  onClose: () => void
  onUpdate: (updated: Project) => void
}

const DRAWER_INSET = 16
const NAVBAR_FALLBACK_HEIGHT = 64

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0]
}

function calcIncome(project: Project): number {
  return project.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
}

function calcExpense(project: Project): number {
  return project.initialCost + project.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
}

// Group transactions by ISO week (YYYY-Www)
function groupByWeek(transactions: Transaction[]): Record<string, number> {
  const result: Record<string, number> = {}
  transactions.filter((t) => t.type === "income").forEach((t) => {
    const d = new Date(t.date)
    const jan4 = new Date(d.getFullYear(), 0, 4)
    const week = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
    const key = `W${String(week).padStart(2, "0")}`
    result[key] = (result[key] ?? 0) + t.amount
  })
  return result
}

// Group transactions by month (YYYY-MM → "ม.ค.", ...)
const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
function groupByMonth(transactions: Transaction[]): Record<string, number> {
  const result: Record<string, number> = {}
  transactions.filter((t) => t.type === "income").forEach((t) => {
    const d = new Date(t.date)
    const key = THAI_MONTHS[d.getMonth()]
    result[key] = (result[key] ?? 0) + t.amount
  })
  return result
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function BarChart({ data, label }: { data: Record<string, number>; label: string }) {
  const entries = Object.entries(data)
  if (entries.length === 0)
    return <p className="text-sm text-gray-400 text-center py-8">ยังไม่มีข้อมูลรายได้</p>

  const max = Math.max(...entries.map(([, v]) => v))

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <div className="flex items-end gap-2 h-28">
        {entries.map(([k, v]) => (
          <div key={k} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <span className="text-[9px] text-gray-400 truncate">{v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}</span>
            <div className="w-full rounded-t-md bg-[#7F77DD]/20 flex items-end overflow-hidden" style={{ height: "80px" }}>
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-[#534AB7] to-[#AFA9EC] transition-all duration-500"
                style={{ height: max > 0 ? `${(v / max) * 80}px` : "0px" }}
              />
            </div>
            <span className="text-[9px] text-gray-400 truncate">{k}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProjectDetail({ project, onClose, onUpdate }: Props) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)
  const [navbarBottom, setNavbarBottom] = useState(NAVBAR_FALLBACK_HEIGHT)
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  // Edit project info
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [editName, setEditName] = useState(project.name)
  const [editDesc, setEditDesc] = useState(project.description)
  const [editCost, setEditCost] = useState(String(project.initialCost))
  const [editGoal, setEditGoal] = useState(String(project.incomeGoal))

  // Todo
  const [newTodo, setNewTodo] = useState("")

  // Transaction
  const [txType, setTxType] = useState<"income" | "expense">("income")
  const [txLabel, setTxLabel] = useState("")
  const [txAmount, setTxAmount] = useState("")
  const [txDate, setTxDate] = useState(todayISO())

  // Milestone
  const [newMsLabel, setNewMsLabel] = useState("")
  const [newMsTarget, setNewMsTarget] = useState("")

  // Chart view
  const [chartView, setChartView] = useState<"week" | "month">("week")

  // ── Computed ────────────────────────────────────────────────────────────────
  const income = useMemo(() => calcIncome(project), [project])
  const expense = useMemo(() => calcExpense(project), [project])
  const net = income - expense
  const goalPct = project.incomeGoal > 0 ? Math.min(100, Math.round((income / project.incomeGoal) * 100)) : 0
  const doneTodos = project.todos.filter((t) => t.done).length
  const weekData = useMemo(() => groupByWeek(project.transactions), [project.transactions])
  const monthData = useMemo(() => groupByMonth(project.transactions), [project.transactions])

  // ── Handlers ────────────────────────────────────────────────────────────────
  const update = (patch: Partial<Project>) => onUpdate({ ...project, ...patch })

  const saveInfo = () => {
    update({
      name: editName.trim() || project.name,
      description: editDesc.trim(),
      initialCost: parseFloat(editCost) || 0,
      incomeGoal: parseFloat(editGoal) || 0,
    })
    setIsEditingInfo(false)
  }

  const addTodo = () => {
    if (!newTodo.trim()) return
    const item: TodoItem = { id: uid(), text: newTodo.trim(), done: false, createdAt: todayISO() }
    update({ todos: [...project.todos, item] })
    setNewTodo("")
  }

  const toggleTodo = (id: string) => {
    update({ todos: project.todos.map((t) => t.id === id ? { ...t, done: !t.done } : t) })
  }

  const deleteTodo = (id: string) => {
    update({ todos: project.todos.filter((t) => t.id !== id) })
  }

  const addTransaction = () => {
    if (!txLabel.trim() || !txAmount) return
    const tx: Transaction = { id: uid(), type: txType, label: txLabel.trim(), amount: parseFloat(txAmount), date: txDate }
    const updatedTxs = [...project.transactions, tx]

    // auto-check milestones
    const newIncome = updatedTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const updatedMs = project.milestones.map((m) =>
      !m.reached && newIncome >= m.targetAmount ? { ...m, reached: true, reachedAt: todayISO() } : m
    )

    update({ transactions: updatedTxs, milestones: updatedMs })
    setTxLabel("")
    setTxAmount("")
    setTxDate(todayISO())
  }

  const deleteTransaction = (id: string) => {
    update({ transactions: project.transactions.filter((t) => t.id !== id) })
  }

  const addMilestone = () => {
    if (!newMsLabel.trim() || !newMsTarget) return
    const ms: Milestone = { id: uid(), label: newMsLabel.trim(), targetAmount: parseFloat(newMsTarget), reached: false }
    update({ milestones: [...project.milestones, ms] })
    setNewMsLabel("")
    setNewMsTarget("")
  }

  const deleteMilestone = (id: string) => {
    update({ milestones: project.milestones.filter((m) => m.id !== id) })
  }

  // ── Tabs config ─────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "ภาพรวม" },
    { id: "todo", label: `To-Do (${doneTodos}/${project.todos.length})` },
    { id: "finance", label: "รายรับ-รายจ่าย" },
    { id: "chart", label: "กราฟ" },
    { id: "milestones", label: "Milestones" },
  ]

  // ─── Render ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    setPortalRoot(document.body)

    const bodyStyle = document.body.style
    const previousOverflow = bodyStyle.overflow
    bodyStyle.overflow = "hidden"

    const navbar = document.querySelector<HTMLElement>("[data-user-navbar]")
    const syncNavbarBottom = () => {
      const nextBottom = navbar?.getBoundingClientRect().bottom ?? NAVBAR_FALLBACK_HEIGHT
      setNavbarBottom(Math.max(NAVBAR_FALLBACK_HEIGHT, Math.round(nextBottom)))
    }

    syncNavbarBottom()
    window.addEventListener("resize", syncNavbarBottom)

    const resizeObserver = typeof ResizeObserver !== "undefined" && navbar
      ? new ResizeObserver(syncNavbarBottom)
      : null

    if (resizeObserver && navbar) {
      resizeObserver.observe(navbar)
    }

    return () => {
      bodyStyle.overflow = previousOverflow
      window.removeEventListener("resize", syncNavbarBottom)
      resizeObserver?.disconnect()
    }
  }, [])

  const overlayTop = `${navbarBottom}px`
  const drawerTop = `${navbarBottom + DRAWER_INSET}px`

  if (!portalRoot) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-x-0 bottom-0 bg-black/40 dark:bg-black/60 z-[60] animate-in fade-in duration-200"
        style={{ top: overlayTop }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed left-4 right-4 bottom-4 z-[70] flex flex-col bg-[#F8FAFC] dark:bg-[#1E293B] rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300"
        style={{ top: drawerTop }}
      >

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Drawer Header */}
        <div className="flex items-start justify-between px-5 pt-2 pb-3 shrink-0 border-b border-gray-200 dark:border-gray-800">
          {isEditingInfo ? (
            <div className="flex-1 space-y-3 mr-4">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-lg font-bold rounded-xl bg-white dark:bg-gray-800 border-[#7F77DD]/50 focus-visible:ring-[#7F77DD]"
              />
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="คำอธิบายโปรเจกต์..."
                rows={2}
                className="rounded-xl bg-white dark:bg-gray-800 resize-none text-sm border-gray-200 dark:border-gray-700 focus-visible:ring-[#7F77DD]"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">ต้นทุน (฿)</label>
                  <Input type="number" value={editCost} onChange={(e) => setEditCost(e.target.value)} className="mt-1 rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-[#7F77DD]" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">เป้าหมาย (฿)</label>
                  <Input type="number" value={editGoal} onChange={(e) => setEditGoal(e.target.value)} className="mt-1 rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-[#7F77DD]" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveInfo} className="bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-xl gap-1">
                  <Check className="w-3.5 h-3.5" /> บันทึก
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingInfo(false)} className="rounded-xl">
                  ยกเลิก
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0 mr-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#0F172A] dark:text-white truncate">{project.name}</h2>
                <button
                  onClick={() => setIsEditingInfo(true)}
                  className="p-1 rounded-lg text-gray-400 hover:text-[#7F77DD] hover:bg-[#EEEDFE] dark:hover:bg-[#3C3489]/30 transition-colors shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
              {project.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{project.description}</p>
              )}
              <div className="flex gap-3 mt-2">
                <span className="text-[11px] text-gray-400">ต้นทุน ฿{project.initialCost.toLocaleString()}</span>
                <span className="text-[11px] text-[#7F77DD]">เป้าหมาย ฿{project.incomeGoal.toLocaleString()}</span>
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors shrink-0"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 pb-0 overflow-x-auto shrink-0 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[#7F77DD] text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "รายได้รวม", value: `฿${income.toLocaleString()}`, icon: TrendingUp, color: "text-[#534AB7]" },
                  { label: "รายจ่ายรวม", value: `฿${expense.toLocaleString()}`, icon: TrendingDown, color: "text-red-500" },
                  { label: net >= 0 ? "กำไร" : "ขาดทุน", value: `${net >= 0 ? "+" : ""}฿${net.toLocaleString()}`, icon: BarChart2, color: net >= 0 ? "text-[#1D9E75]" : "text-red-500" },
                  { label: "Streak", value: `${project.streak} วัน 🔥`, icon: Flame, color: "text-orange-500" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <Section key={label}>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Icon className="w-3 h-3" /> {label}
                    </p>
                    <p className={`text-base font-bold ${color}`}>{value}</p>
                  </Section>
                ))}
              </div>

              {/* Goal Progress */}
              <Section>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-[#0F172A] dark:text-white flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-[#7F77DD]" /> เป้าหมายรายได้
                  </p>
                  <span className="text-sm font-bold text-[#534AB7]">{goalPct}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#7F77DD] to-[#AFA9EC] transition-all duration-700"
                    style={{ width: `${goalPct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[11px] text-gray-400">฿{income.toLocaleString()}</span>
                  <span className="text-[11px] text-gray-400">เป้า ฿{project.incomeGoal.toLocaleString()}</span>
                </div>
              </Section>

              {/* Recent Transactions */}
              <Section>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white mb-3">รายการล่าสุด</p>
                {project.transactions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีรายการ</p>
                ) : (
                  <div className="space-y-2">
                    {[...project.transactions].reverse().slice(0, 5).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[#0F172A] dark:text-white">{tx.label}</p>
                          <p className="text-[11px] text-gray-400">{new Date(tx.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</p>
                        </div>
                        <span className={`text-sm font-semibold ${tx.type === "income" ? "text-[#1D9E75]" : "text-red-500"}`}>
                          {tx.type === "income" ? "+" : "-"}฿{tx.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </>
          )}

          {/* ── TODO ──────────────────────────────────────────────────────────── */}
          {activeTab === "todo" && (
            <>
              <Section>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">เพิ่ม To-Do</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="งานที่ต้องทำ..."
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTodo()}
                    className="flex-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-[#7F77DD]"
                  />
                  <Button onClick={addTodo} className="bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-xl shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </Section>

              <Section>
                {project.todos.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">ยังไม่มี To-Do</p>
                ) : (
                  <div className="space-y-2">
                    {project.todos.map((todo) => (
                      <div key={todo.id} className="flex items-center gap-3 group">
                        <button onClick={() => toggleTodo(todo.id)} className="shrink-0 text-gray-300 hover:text-[#7F77DD] transition-colors">
                          {todo.done
                            ? <CheckSquare className="w-5 h-5 text-[#7F77DD]" />
                            : <Square className="w-5 h-5" />}
                        </button>
                        <span className={`flex-1 text-sm ${todo.done ? "line-through text-gray-400" : "text-[#0F172A] dark:text-white"}`}>
                          {todo.text}
                        </span>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {project.todos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                      <span>ความคืบหน้า</span>
                      <span>{doneTodos}/{project.todos.length}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#7F77DD] transition-all duration-500"
                        style={{ width: project.todos.length > 0 ? `${(doneTodos / project.todos.length) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                )}
              </Section>
            </>
          )}

          {/* ── FINANCE ───────────────────────────────────────────────────────── */}
          {activeTab === "finance" && (
            <>
              <Section>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">บันทึกรายการ</p>
                <div className="space-y-3">
                  {/* Type Toggle */}
                  <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                    {(["income", "expense"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTxType(t)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                          txType === t
                            ? t === "income" ? "bg-[#1D9E75] text-white shadow-sm" : "bg-red-500 text-white shadow-sm"
                            : "text-gray-500"
                        }`}
                      >
                        {t === "income" ? "รายรับ" : "รายจ่าย"}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="รายละเอียด..."
                      value={txLabel}
                      onChange={(e) => setTxLabel(e.target.value)}
                      className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-[#7F77DD]"
                    />
                    <Input
                      type="number"
                      placeholder="จำนวน (฿)"
                      min={0}
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-[#7F77DD]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="flex-1 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-[#7F77DD]"
                    />
                    <Button onClick={addTransaction} className="bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-xl shrink-0 gap-1">
                      <Plus className="w-4 h-4" /> บันทึก
                    </Button>
                  </div>
                </div>
              </Section>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "รายรับ", value: `฿${income.toLocaleString()}`, color: "text-[#1D9E75]" },
                  { label: "รายจ่าย", value: `฿${expense.toLocaleString()}`, color: "text-red-500" },
                  { label: net >= 0 ? "กำไร" : "ขาดทุน", value: `${net >= 0 ? "+" : ""}฿${net.toLocaleString()}`, color: net >= 0 ? "text-[#534AB7]" : "text-red-500" },
                ].map(({ label, value, color }) => (
                  <Section key={label}>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className={`text-sm font-bold ${color}`}>{value}</p>
                  </Section>
                ))}
              </div>

              {/* Transaction List */}
              <Section>
                <p className="text-sm font-semibold text-[#0F172A] dark:text-white mb-3">รายการทั้งหมด</p>
                {project.transactions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">ยังไม่มีรายการ</p>
                ) : (
                  <div className="space-y-2">
                    {[...project.transactions].reverse().map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between group py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                        <div>
                          <p className="text-sm text-[#0F172A] dark:text-white">{tx.label}</p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(tx.date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-semibold ${tx.type === "income" ? "text-[#1D9E75]" : "text-red-500"}`}>
                            {tx.type === "income" ? "+" : "-"}฿{tx.amount.toLocaleString()}
                          </span>
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </>
          )}

          {/* ── CHART ─────────────────────────────────────────────────────────── */}
          {activeTab === "chart" && (
            <>
              {/* View Toggle */}
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                {(["week", "month"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setChartView(v)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      chartView === v ? "bg-[#7F77DD] text-white shadow-sm" : "text-gray-500"
                    }`}
                  >
                    {v === "week" ? "รายสัปดาห์" : "รายเดือน"}
                  </button>
                ))}
              </div>

              <Section>
                <BarChart
                  data={chartView === "week" ? weekData : monthData}
                  label={chartView === "week" ? "รายได้รายสัปดาห์ (฿)" : "รายได้รายเดือน (฿)"}
                />
              </Section>

              {/* Income vs Goal */}
              <Section>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">เปรียบเทียบกับเป้าหมาย</p>
                <div className="space-y-3">
                  {[
                    { label: "รายได้จริง", value: income, color: "bg-[#7F77DD]", max: project.incomeGoal },
                    { label: "เป้าหมาย", value: project.incomeGoal, color: "bg-gray-200 dark:bg-gray-700", max: project.incomeGoal },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-semibold text-[#0F172A] dark:text-white">฿{value.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${color} transition-all duration-700`}
                          style={{ width: project.incomeGoal > 0 ? `${Math.min(100, (value / project.incomeGoal) * 100)}%` : "0%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* ── MILESTONES ────────────────────────────────────────────────────── */}
          {activeTab === "milestones" && (
            <>
              <Section>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">เพิ่ม Milestone</p>
                <div className="flex gap-2 flex-wrap">
                  <Input
                    placeholder="เช่น รายได้ครบ ฿10,000"
                    value={newMsLabel}
                    onChange={(e) => setNewMsLabel(e.target.value)}
                    className="flex-1 min-w-[160px] rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-[#7F77DD]"
                  />
                  <Input
                    type="number"
                    placeholder="รายได้เป้าหมาย (฿)"
                    min={0}
                    value={newMsTarget}
                    onChange={(e) => setNewMsTarget(e.target.value)}
                    className="w-40 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-[#7F77DD]"
                  />
                  <Button onClick={addMilestone} className="bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-xl gap-1 shrink-0">
                    <Plus className="w-4 h-4" /> เพิ่ม
                  </Button>
                </div>
              </Section>

              <Section>
                {project.milestones.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">ยังไม่มี Milestone</p>
                ) : (
                  <div className="space-y-3">
                    {project.milestones.map((ms) => {
                      const pct = ms.targetAmount > 0 ? Math.min(100, Math.round((income / ms.targetAmount) * 100)) : 100
                      return (
                        <div key={ms.id} className={`p-4 rounded-xl border transition-all group ${
                          ms.reached
                            ? "bg-[#EAF3DE] dark:bg-[#27500A]/20 border-[#97C459] dark:border-[#3B6D11]"
                            : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800"
                        }`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Trophy className={`w-4 h-4 shrink-0 ${ms.reached ? "text-[#3B6D11]" : "text-gray-300"}`} />
                              <div>
                                <p className={`text-sm font-semibold ${ms.reached ? "text-[#27500A] dark:text-[#C0DD97]" : "text-[#0F172A] dark:text-white"}`}>
                                  {ms.label}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  เป้า ฿{ms.targetAmount.toLocaleString()}
                                  {ms.reached && ms.reachedAt && ` · ทำได้ ${new Date(ms.reachedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {ms.reached && (
                                <span className="text-[10px] bg-[#1D9E75] text-white px-2 py-0.5 rounded-full font-semibold">✓ สำเร็จ</span>
                              )}
                              <button
                                onClick={() => deleteMilestone(ms.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {!ms.reached && (
                            <div className="mt-2.5 space-y-1">
                              <div className="flex justify-between text-[10px] text-gray-400">
                                <span>ความคืบหน้า</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-[#7F77DD] transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Section>
            </>
          )}

        </div>
      </div>
    </>,
    portalRoot
  )
}
