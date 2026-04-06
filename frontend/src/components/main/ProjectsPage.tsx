// components/main/ProjectsPage.tsx
"use client"
/* eslint-disable react/no-unescaped-entities */

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  FolderKanban,
  Trash2,
  ChevronRight,
  TrendingUp,
  Target,
  Flame,
  BarChart2,
} from "lucide-react"
import { Project } from "@/types/project"
import ProjectDetail from "./ProjectDetail"

// ─── Mock Data ────────────────────────────────────────────────────────────────
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
function calcNetProfit(project: Project): number {
  const totalIncome = project.transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense =
    project.initialCost +
    project.transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)
  return totalIncome - totalExpense
}

function calcTotalIncome(project: Project): number {
  return project.transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)
}

function goalPercent(project: Project): number {
  if (project.incomeGoal === 0) return 0
  return Math.min(100, Math.round((calcTotalIncome(project) / project.incomeGoal) * 100))
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  // Create form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    initialCost: "",
    incomeGoal: "",
  })
  const [formError, setFormError] = useState("")

  const handleCreate = () => {
    if (!form.name.trim()) {
      setFormError("กรุณากรอกชื่อโปรเจกต์")
      return
    }
    const newProject: Project = {
      id: Date.now().toString(),
      name: form.name.trim(),
      description: form.description.trim(),
      initialCost: parseFloat(form.initialCost) || 0,
      incomeGoal: parseFloat(form.incomeGoal) || 0,
      createdAt: new Date().toISOString().split("T")[0],
      streak: 0,
      todos: [],
      transactions: [],
      milestones: [],
    }
    setProjects((prev) => [newProject, ...prev])
    setForm({ name: "", description: "", initialCost: "", incomeGoal: "" })
    setFormError("")
    setShowCreateModal(false)
  }

  const handleDelete = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
    if (selectedProject?.id === id) setSelectedProject(null)
    setDeleteTargetId(null)
  }

  const handleUpdateProject = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    setSelectedProject(updated)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] dark:text-white mb-1">
            โปรเจกต์ของฉัน 📁
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            จัดการ Side Hustle ทุกโปรเจกต์ในที่เดียว
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-xl shadow-sm gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          สร้างโปรเจกต์
        </Button>
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderKanban className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-400 font-medium">ยังไม่มีโปรเจกต์</p>
          <p className="text-gray-400 text-sm mt-1">กดปุ่ม "สร้างโปรเจกต์" เพื่อเริ่มต้น</p>
        </div>
      )}

      {/* Project Grid */}
      {projects.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => {
            const net = calcNetProfit(project)
            const income = calcTotalIncome(project)
            const pct = goalPercent(project)
            const isProfit = net >= 0

            return (
              <Card
                key={project.id}
                className="group flex flex-col border-gray-200 dark:border-gray-800 hover:border-[#7F77DD]/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer"
                onClick={() => setSelectedProject(project)}
              >
                <CardContent className="p-5 flex flex-col gap-4 flex-1">

                  {/* Top Row: name + delete */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#0F172A] dark:text-white text-base truncate group-hover:text-[#534AB7] dark:group-hover:text-[#AFA9EC] transition-colors">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTargetId(project.id)
                      }}
                      className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      aria-label="ลบโปรเจกต์"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-gray-400 mb-1 flex items-center justify-center gap-1">
                        <TrendingUp className="w-3 h-3" /> รายได้
                      </p>
                      <p className="text-sm font-bold text-[#534AB7] dark:text-[#AFA9EC]">
                        ฿{income.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-gray-400 mb-1 flex items-center justify-center gap-1">
                        <BarChart2 className="w-3 h-3" /> กำไร
                      </p>
                      <p className={`text-sm font-bold ${isProfit ? "text-[#1D9E75]" : "text-red-500"}`}>
                        {isProfit ? "+" : ""}฿{net.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-gray-400 mb-1 flex items-center justify-center gap-1">
                        <Flame className="w-3 h-3" /> Streak
                      </p>
                      <p className="text-sm font-bold text-orange-500">{project.streak} วัน</p>
                    </div>
                  </div>

                  {/* Goal Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Target className="w-3 h-3" /> เป้าหมาย ฿{project.incomeGoal.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-semibold text-[#534AB7] dark:text-[#AFA9EC]">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#7F77DD] to-[#AFA9EC] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-[11px] text-gray-400">
                      สร้าง {new Date(project.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="text-[11px] font-medium text-[#7F77DD] flex items-center gap-0.5">
                      เปิดดู <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ─── Create Modal ──────────────────────────────────────────────────────── */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 z-[200]">
          <DialogHeader>
            <DialogTitle className="text-[#0F172A] dark:text-white text-lg font-bold">
              สร้างโปรเจกต์ใหม่
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                ชื่อโปรเจกต์ *
              </label>
              <Input
                placeholder="เช่น รับทำพรีเซนต์ Canva"
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setFormError("") }}
                className="rounded-xl bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-[#0F172A] dark:text-white placeholder:text-gray-400 focus-visible:ring-[#7F77DD]"
              />
              {formError && <p className="text-xs text-red-500">{formError}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                คำอธิบาย
              </label>
              <Textarea
                placeholder="อธิบายโปรเจกต์คร่าวๆ..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="rounded-xl bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-[#0F172A] dark:text-white placeholder:text-gray-400 focus-visible:ring-[#7F77DD] resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  ต้นทุนเริ่มต้น (฿)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  min={0}
                  value={form.initialCost}
                  onChange={(e) => setForm((f) => ({ ...f, initialCost: e.target.value }))}
                  className="rounded-xl bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-[#0F172A] dark:text-white placeholder:text-gray-400 focus-visible:ring-[#7F77DD]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  เป้าหมายรายได้ (฿)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  min={0}
                  value={form.incomeGoal}
                  onChange={(e) => setForm((f) => ({ ...f, incomeGoal: e.target.value }))}
                  className="rounded-xl bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-[#0F172A] dark:text-white placeholder:text-gray-400 focus-visible:ring-[#7F77DD]"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              className="rounded-xl border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
              onClick={() => { setShowCreateModal(false); setFormError("") }}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleCreate} className="bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-xl">
              สร้างโปรเจกต์
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirm ────────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(o) => !o && setDeleteTargetId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>ลบโปรเจกต์นี้?</AlertDialogTitle>
            <AlertDialogDescription>
              ข้อมูลทั้งหมดของโปรเจกต์จะถูกลบถาวร ไม่สามารถกู้คืนได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTargetId && handleDelete(deleteTargetId)}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              ลบโปรเจกต์
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Project Detail Drawer ─────────────────────────────────────────────── */}
      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdate={handleUpdateProject}
        />
      )}

    </div>
  )
}
