"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { api, handleApiResponse } from "@/lib/api"
import {
  X,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Pencil,
  Check,
  Loader2,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart2,
} from "lucide-react"
import {
  calcProjectExpense,
  calcProjectIncome,
  formatDateInput,
  formatShortDate,
  type ProjectRecord,
} from "./projectTypes"

type Tab = "overview" | "todo" | "finance" | "chart"

type Props = {
  project: ProjectRecord | null
  isLoading: boolean
  error: string | null
  onClose: () => void
  onRefresh: () => void
  onProjectChanged: () => void
}

const DRAWER_INSET = 16
const NAVBAR_FALLBACK_HEIGHT = 64
const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallbackMessage
}

function groupByWeek(project: ProjectRecord): Record<string, number> {
  const result: Record<string, number> = {}

  project.transactions
    .forEach((transaction) => {
      const date = new Date(transaction.date)
      const jan4 = new Date(date.getFullYear(), 0, 4)
      const week = Math.ceil(((date.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7)
      const key = `W${String(week).padStart(2, "0")}`
      const delta = transaction.type === "income" ? transaction.amount : -transaction.amount
      result[key] = (result[key] ?? 0) + delta
    })

  return result
}

function groupByMonth(project: ProjectRecord): Record<string, number> {
  const result: Record<string, number> = {}

  project.transactions
    .forEach((transaction) => {
      const date = new Date(transaction.date)
      const key = THAI_MONTHS[date.getMonth()]
      const delta = transaction.type === "income" ? transaction.amount : -transaction.amount
      result[key] = (result[key] ?? 0) + delta
    })

  return result
}

function BarChart({ data, label }: { data: Record<string, number>; label: string }) {
  const entries = Object.entries(data)

  if (entries.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">ยังไม่มีข้อมูลกำไรสุทธิสำหรับกราฟ</p>
  }

  const maxAbs = Math.max(...entries.map(([, value]) => Math.abs(value)))

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <div className="flex h-36 items-end gap-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className={`truncate text-[9px] ${value >= 0 ? "text-gray-400" : "text-red-400"}`}>
              {value > 0 ? "+" : ""}
              {value >= 1000 || value <= -1000 ? `${(value / 1000).toFixed(1)}k` : value}
            </span>
            <div className="relative flex h-24 w-full items-center overflow-hidden">
              <div className="absolute inset-x-0 top-1/2 h-px bg-gray-200 dark:bg-gray-700" />
              <div
                className={`absolute left-0 w-full transition-all duration-500 ${
                  value >= 0
                    ? "bottom-1/2 rounded-t-md bg-gradient-to-t from-[#534AB7] to-[#AFA9EC]"
                    : "top-1/2 rounded-b-md bg-gradient-to-b from-[#F87171] to-[#FCA5A5]"
                }`}
                style={{ height: maxAbs > 0 ? `${(Math.abs(value) / maxAbs) * 48}px` : "0px" }}
              />
            </div>
            <span className="truncate text-[9px] text-gray-400">{key}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      {children}
    </div>
  )
}

export default function ProjectDetail({
  project,
  isLoading,
  error,
  onClose,
  onRefresh,
  onProjectChanged,
}: Props) {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)
  const [navbarBottom, setNavbarBottom] = useState(NAVBAR_FALLBACK_HEIGHT)
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editCost, setEditCost] = useState("0")
  const [editGoal, setEditGoal] = useState("0")
  const [infoError, setInfoError] = useState<string | null>(null)
  const [isSavingInfo, setIsSavingInfo] = useState(false)

  const [newTask, setNewTask] = useState("")
  const [taskError, setTaskError] = useState<string | null>(null)
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false)
  const [taskBusyId, setTaskBusyId] = useState<string | null>(null)

  const [txType, setTxType] = useState<"income" | "expense">("income")
  const [txDescription, setTxDescription] = useState("")
  const [txAmount, setTxAmount] = useState("")
  const [txDate, setTxDate] = useState(formatDateInput(new Date()))
  const [financeError, setFinanceError] = useState<string | null>(null)
  const [isTransactionSubmitting, setIsTransactionSubmitting] = useState(false)
  const [transactionBusyId, setTransactionBusyId] = useState<string | null>(null)

  const [chartView, setChartView] = useState<"week" | "month">("week")

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

  useEffect(() => {
    if (!project) return

    setEditName(project.name)
    setEditDesc(project.description ?? "")
    setEditCost(String(project.initialCost))
    setEditGoal(String(project.monthlyGoal))
    setInfoError(null)
    setTaskError(null)
    setFinanceError(null)
  }, [project])

  const income = useMemo(() => (project ? calcProjectIncome(project) : 0), [project])
  const expense = useMemo(() => (project ? calcProjectExpense(project) : 0), [project])
  const net = income - expense
  const goalPct = project && project.monthlyGoal > 0 ? Math.min(100, Math.round((income / project.monthlyGoal) * 100)) : 0
  const doneTasks = project?.tasks.filter((task) => task.completed).length ?? 0
  const weekData = useMemo(() => (project ? groupByWeek(project) : {}), [project])
  const monthData = useMemo(() => (project ? groupByMonth(project) : {}), [project])

  async function saveProjectInfo() {
    if (!project) return
    if (!editName.trim()) {
      setInfoError("กรุณากรอกชื่อโปรเจกต์")
      return
    }

    setIsSavingInfo(true)

    try {
      const response = await api.projects.update(project.id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        initialCost: parseFloat(editCost) || 0,
        monthlyGoal: parseFloat(editGoal) || 0,
      })

      await handleApiResponse(response)
      setIsEditingInfo(false)
      setInfoError(null)
      onProjectChanged()
    } catch (updateError) {
      setInfoError(getErrorMessage(updateError, "บันทึกข้อมูลโปรเจกต์ไม่สำเร็จ"))
    } finally {
      setIsSavingInfo(false)
    }
  }

  async function addTask() {
    if (!project) return
    if (!newTask.trim()) {
      setTaskError("กรุณากรอกชื่องาน")
      return
    }

    setIsTaskSubmitting(true)

    try {
      const response = await api.projects.addTask(project.id, newTask.trim())
      await handleApiResponse(response)
      setNewTask("")
      setTaskError(null)
      onProjectChanged()
    } catch (taskAddError) {
      setTaskError(getErrorMessage(taskAddError, "เพิ่มงานไม่สำเร็จ"))
    } finally {
      setIsTaskSubmitting(false)
    }
  }

  async function toggleTask(taskId: string, completed: boolean) {
    if (!project) return
    setTaskBusyId(taskId)

    try {
      const response = await api.projects.updateTask(project.id, taskId, { completed })
      await handleApiResponse(response)
      onProjectChanged()
    } catch (taskToggleError) {
      setTaskError(getErrorMessage(taskToggleError, "อัปเดตสถานะงานไม่สำเร็จ"))
    } finally {
      setTaskBusyId(null)
    }
  }

  async function deleteTask(taskId: string) {
    if (!project) return
    setTaskBusyId(taskId)

    try {
      const response = await api.projects.deleteTask(project.id, taskId)
      if (!response.ok) {
        await handleApiResponse(response)
      }
      onProjectChanged()
    } catch (taskDeleteError) {
      setTaskError(getErrorMessage(taskDeleteError, "ลบงานไม่สำเร็จ"))
    } finally {
      setTaskBusyId(null)
    }
  }

  async function addTransaction() {
    if (!project) return
    if (!txDescription.trim() || !txAmount) {
      setFinanceError("กรุณากรอกรายละเอียดและจำนวนเงิน")
      return
    }

    setIsTransactionSubmitting(true)

    try {
      const response = await api.transactions.create({
        projectId: project.id,
        type: txType,
        amount: parseFloat(txAmount),
        description: txDescription.trim(),
        date: txDate,
      })

      await handleApiResponse(response)
      setTxDescription("")
      setTxAmount("")
      setTxDate(formatDateInput(new Date()))
      setFinanceError(null)
      onProjectChanged()
    } catch (transactionAddError) {
      setFinanceError(getErrorMessage(transactionAddError, "เพิ่มรายการไม่สำเร็จ"))
    } finally {
      setIsTransactionSubmitting(false)
    }
  }

  async function deleteTransaction(transactionId: string) {
    setTransactionBusyId(transactionId)

    try {
      const response = await api.transactions.delete(transactionId)
      if (!response.ok) {
        await handleApiResponse(response)
      }
      onProjectChanged()
    } catch (transactionDeleteError) {
      setFinanceError(getErrorMessage(transactionDeleteError, "ลบรายการไม่สำเร็จ"))
    } finally {
      setTransactionBusyId(null)
    }
  }

  const overlayTop = `${navbarBottom}px`
  const drawerTop = `${navbarBottom + DRAWER_INSET}px`

  if (!portalRoot) return null

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "ภาพรวม" },
    { id: "todo", label: `To-Do (${doneTasks}/${project?.tasks.length ?? 0})` },
    { id: "finance", label: "การเงิน" },
    { id: "chart", label: "กราฟ" },
  ]

  return createPortal(
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-[60] bg-black/40 animate-in fade-in duration-200"
        style={{ top: overlayTop }}
        onClick={onClose}
      />

      <div
        className="fixed bottom-4 left-4 right-4 z-[70] flex flex-col rounded-3xl bg-[#F8FAFC] shadow-2xl animate-in slide-in-from-bottom duration-300 dark:bg-[#1E293B]"
        style={{ top: drawerTop }}
      >
        <div className="flex justify-center pb-1 pt-3 shrink-0">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        <div className="flex items-start justify-between border-b border-gray-200 px-5 pb-3 pt-2 shrink-0 dark:border-gray-800">
          {project && !isLoading ? (
            isEditingInfo ? (
              <div className="mr-4 flex-1 space-y-3">
                <Input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="rounded-xl border-[#7F77DD]/50 bg-white text-lg font-bold focus-visible:ring-[#7F77DD] dark:bg-gray-800"
                />
                <Textarea
                  value={editDesc}
                  onChange={(event) => setEditDesc(event.target.value)}
                  rows={2}
                  className="resize-none rounded-xl border-gray-200 bg-white text-sm focus-visible:ring-[#7F77DD] dark:border-gray-700 dark:bg-gray-800"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" value={editCost} onChange={(event) => setEditCost(event.target.value)} className="rounded-xl bg-white dark:bg-gray-800" />
                  <Input type="number" value={editGoal} onChange={(event) => setEditGoal(event.target.value)} className="rounded-xl bg-white dark:bg-gray-800" />
                </div>
                {infoError ? <p className="text-sm text-red-500">{infoError}</p> : null}
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void saveProjectInfo()} disabled={isSavingInfo} className="gap-1 rounded-xl bg-[#7F77DD] text-white hover:bg-[#534AB7]">
                    {isSavingInfo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    บันทึก
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingInfo(false)} className="rounded-xl">
                    ยกเลิก
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mr-4 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-xl font-bold text-[#0F172A] dark:text-white">{project.name}</h2>
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo(true)}
                    className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-[#EEEDFE] hover:text-[#7F77DD] dark:hover:bg-[#3C3489]/30"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                {project.description ? (
                  <p className="mt-0.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>
                ) : null}
                <div className="mt-2 flex gap-3 text-[11px]">
                  <span className="text-gray-400">ต้นทุน ฿{project.initialCost.toLocaleString()}</span>
                  <span className="text-[#7F77DD]">เป้ารายเดือน ฿{project.monthlyGoal.toLocaleString()}</span>
                </div>
              </div>
            )
          ) : (
            <div className="mr-4 flex-1">
              <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">รายละเอียดโปรเจกต์</h2>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto px-5 pb-0 pt-3 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-[#7F77DD] text-white"
                  : "bg-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              กำลังโหลดรายละเอียดโปรเจกต์...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
              <p>{error}</p>
              <Button variant="outline" className="mt-3 rounded-xl" onClick={onRefresh}>
                ลองใหม่
              </Button>
            </div>
          ) : !project ? (
            <div className="py-20 text-center text-sm text-gray-400">ไม่พบข้อมูลโปรเจกต์</div>
          ) : (
            <div className="space-y-4">
              {activeTab === "overview" ? (
                <>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                      { label: "รายได้รวม", value: `฿${income.toLocaleString()}`, icon: TrendingUp, color: "text-[#1D9E75]" },
                      { label: "รายจ่ายรวม", value: `฿${expense.toLocaleString()}`, icon: TrendingDown, color: "text-red-500" },
                      { label: "กำไรสุทธิ", value: `${net >= 0 ? "+" : ""}฿${net.toLocaleString()}`, icon: BarChart2, color: net >= 0 ? "text-[#534AB7]" : "text-red-500" },
                      { label: "เป้ารายเดือน", value: `฿${project.monthlyGoal.toLocaleString()}`, icon: Target, color: "text-orange-500" },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <Section key={label}>
                        <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </div>
                        <p className={`text-lg font-bold ${color}`}>{value}</p>
                      </Section>
                    ))}
                  </div>

                  <Section>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">ความคืบหน้าของงาน</span>
                      <span className="font-semibold text-[#534AB7]">
                        {doneTasks}/{project.tasks.length}
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-[#7F77DD] transition-all duration-500"
                        style={{
                          width: project.tasks.length > 0 ? `${(doneTasks / project.tasks.length) * 100}%` : "0%",
                        }}
                      />
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-gray-500 sm:grid-cols-2">
                      <p>สร้างเมื่อ {formatShortDate(project.createdAt)}</p>
                      <p>อัปเดตล่าสุด {formatShortDate(project.updatedAt)}</p>
                    </div>
                  </Section>

                  <Section>
                    <p className="mb-3 text-sm font-semibold text-[#0F172A] dark:text-white">รายการล่าสุด</p>
                    {project.transactions.length === 0 ? (
                      <p className="text-sm text-gray-400">ยังไม่มีรายการรายรับรายจ่าย</p>
                    ) : (
                      <div className="space-y-2">
                        {project.transactions.slice(0, 5).map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
                            <div>
                              <p className="text-sm text-[#0F172A] dark:text-white">{transaction.description ?? "ไม่มีรายละเอียด"}</p>
                              <p className="text-[11px] text-gray-400">{formatShortDate(transaction.date)}</p>
                            </div>
                            <span className={`text-sm font-semibold ${transaction.type === "income" ? "text-[#1D9E75]" : "text-red-500"}`}>
                              {transaction.type === "income" ? "+" : "-"}฿{transaction.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Section>
                </>
              ) : null}

              {activeTab === "todo" ? (
                <>
                  <Section>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">เพิ่มงาน</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="งานที่ต้องทำ..."
                        value={newTask}
                        onChange={(event) => {
                          setNewTask(event.target.value)
                          setTaskError(null)
                        }}
                        onKeyDown={(event) => event.key === "Enter" && void addTask()}
                        className="flex-1 rounded-xl bg-gray-50 dark:bg-gray-800"
                      />
                      <Button onClick={() => void addTask()} disabled={isTaskSubmitting} className="rounded-xl bg-[#7F77DD] text-white hover:bg-[#534AB7]">
                        {isTaskSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </div>
                    {taskError ? <p className="mt-2 text-sm text-red-500">{taskError}</p> : null}
                  </Section>

                  <Section>
                    {project.tasks.length === 0 ? (
                      <p className="py-6 text-center text-sm text-gray-400">ยังไม่มีงานในโปรเจกต์นี้</p>
                    ) : (
                      <div className="space-y-2">
                        {project.tasks.map((task) => {
                          const isBusy = taskBusyId === task.id

                          return (
                            <div key={task.id} className="group flex items-center gap-3">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void toggleTask(task.id, !task.completed)}
                                className="shrink-0 text-gray-300 transition-colors hover:text-[#7F77DD]"
                              >
                                {isBusy ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : task.completed ? (
                                  <CheckSquare className="h-5 w-5 text-[#7F77DD]" />
                                ) : (
                                  <Square className="h-5 w-5" />
                                )}
                              </button>
                              <span className={`flex-1 text-sm ${task.completed ? "text-gray-400 line-through" : "text-[#0F172A] dark:text-white"}`}>
                                {task.text}
                              </span>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void deleteTask(task.id)}
                                className="rounded-lg p-1 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </Section>
                </>
              ) : null}

              {activeTab === "finance" ? (
                <>
                  <Section>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">บันทึกรายการ</p>
                    <div className="space-y-3">
                      <div className="flex w-fit gap-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                        {(["income", "expense"] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setTxType(type)}
                            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                              txType === type
                                ? type === "income"
                                  ? "bg-[#1D9E75] text-white"
                                  : "bg-red-500 text-white"
                                : "text-gray-500"
                            }`}
                          >
                            {type === "income" ? "รายรับ" : "รายจ่าย"}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="รายละเอียดรายการ"
                          value={txDescription}
                          onChange={(event) => {
                            setTxDescription(event.target.value)
                            setFinanceError(null)
                          }}
                          className="rounded-xl bg-gray-50 dark:bg-gray-800"
                        />
                        <Input
                          type="number"
                          min={0}
                          placeholder="จำนวนเงิน"
                          value={txAmount}
                          onChange={(event) => {
                            setTxAmount(event.target.value)
                            setFinanceError(null)
                          }}
                          className="rounded-xl bg-gray-50 dark:bg-gray-800"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={txDate}
                          onChange={(event) => setTxDate(event.target.value)}
                          className="flex-1 rounded-xl bg-gray-50 dark:bg-gray-800"
                        />
                        <Button onClick={() => void addTransaction()} disabled={isTransactionSubmitting} className="gap-1 rounded-xl bg-[#7F77DD] text-white hover:bg-[#534AB7]">
                          {isTransactionSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                          บันทึก
                        </Button>
                      </div>
                    </div>
                    {financeError ? <p className="mt-2 text-sm text-red-500">{financeError}</p> : null}
                  </Section>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "รายรับ", value: `฿${income.toLocaleString()}`, color: "text-[#1D9E75]" },
                      { label: "รายจ่าย", value: `฿${expense.toLocaleString()}`, color: "text-red-500" },
                      { label: net >= 0 ? "กำไรสุทธิ" : "ขาดทุนสุทธิ", value: `${net >= 0 ? "+" : ""}฿${net.toLocaleString()}`, color: net >= 0 ? "text-[#534AB7]" : "text-red-500" },
                    ].map(({ label, value, color }) => (
                      <Section key={label}>
                        <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-400">{label}</p>
                        <p className={`text-sm font-bold ${color}`}>{value}</p>
                      </Section>
                    ))}
                  </div>

                  <Section>
                    <p className="mb-3 text-sm font-semibold text-[#0F172A] dark:text-white">รายการทั้งหมด</p>
                    {project.transactions.length === 0 ? (
                      <p className="py-6 text-center text-sm text-gray-400">ยังไม่มีรายการ</p>
                    ) : (
                      <div className="space-y-2">
                        {project.transactions.map((transaction) => {
                          const isBusy = transactionBusyId === transaction.id

                          return (
                            <div key={transaction.id} className="group flex items-center justify-between border-b border-gray-50 py-1.5 last:border-0 dark:border-gray-800">
                              <div>
                                <p className="text-sm text-[#0F172A] dark:text-white">{transaction.description ?? "ไม่มีรายละเอียด"}</p>
                                <p className="text-[11px] text-gray-400">{formatShortDate(transaction.date)}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-sm font-semibold ${transaction.type === "income" ? "text-[#1D9E75]" : "text-red-500"}`}>
                                  {transaction.type === "income" ? "+" : "-"}฿{transaction.amount.toLocaleString()}
                                </span>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void deleteTransaction(transaction.id)}
                                  className="rounded-lg p-1 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
                                >
                                  {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </Section>
                </>
              ) : null}

              {activeTab === "chart" ? (
                <>
                  <div className="flex w-fit gap-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                    {(["week", "month"] as const).map((view) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => setChartView(view)}
                        className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                          chartView === view ? "bg-[#7F77DD] text-white" : "text-gray-500"
                        }`}
                      >
                        {view === "week" ? "รายสัปดาห์" : "รายเดือน"}
                      </button>
                    ))}
                  </div>

                  <Section>
                    <BarChart
                      data={chartView === "week" ? weekData : monthData}
                      label={chartView === "week" ? "กำไรสุทธิรายสัปดาห์ (฿)" : "กำไรสุทธิรายเดือน (฿)"}
                    />
                  </Section>

                  <Section>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                      เทียบกับเป้ารายเดือน
                    </p>
                    <div className="space-y-3">
                      {[
                        { label: "กำไรสุทธิจริง", value: net, color: net >= 0 ? "bg-[#7F77DD]" : "bg-red-500" },
                        { label: "เป้ารายเดือน", value: project.monthlyGoal, color: "bg-gray-300 dark:bg-gray-700" },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-gray-500">{label}</span>
                            <span className="font-semibold text-[#0F172A] dark:text-white">฿{value.toLocaleString()}</span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className={`h-full rounded-full ${color} transition-all duration-700`}
                              style={{
                                width: project.monthlyGoal > 0 ? `${Math.min(100, (Math.max(value, 0) / project.monthlyGoal) * 100)}%` : "0%",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-gray-500">
                      เป้าหมายปัจจุบันทำได้แล้ว {goalPct}% ของเป้ารายเดือน
                    </p>
                  </Section>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </>,
    portalRoot
  )
}
