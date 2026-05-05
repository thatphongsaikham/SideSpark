"use client"

import { useEffect, useState } from "react"
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
import { api, handleApiResponse } from "@/lib/api"
import type { Project } from "@/types"
import {
  Plus,
  FolderKanban,
  Trash2,
  ChevronRight,
  TrendingUp,
  Target,
  BarChart2,
  Loader2,
  ListTodo,
} from "lucide-react"
import ProjectDetail from "./ProjectDetail"
import {
  calcProjectExpense,
  calcProjectIncome,
  formatShortDate,
  normalizeProject,
  normalizeProjects,
  type ProjectRecord,
} from "./projectTypes"

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallbackMessage
}

function getProfit(project: ProjectRecord): number {
  return calcProjectIncome(project) - calcProjectExpense(project)
}

function getGoalPercent(project: ProjectRecord): number {
  if (project.monthlyGoal <= 0) return 0
  return Math.min(100, Math.round((calcProjectIncome(project) / project.monthlyGoal) * 100))
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [isProjectsLoading, setIsProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null)
  const [isProjectDetailLoading, setIsProjectDetailLoading] = useState(false)
  const [projectDetailError, setProjectDetailError] = useState<string | null>(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeletingProject, setIsDeletingProject] = useState(false)

  const [form, setForm] = useState({
    name: "",
    description: "",
    initialCost: "",
    monthlyGoal: "",
  })

  async function loadProjects() {
    setIsProjectsLoading(true)

    try {
      const response = await api.projects.getAll()
      const data = await handleApiResponse<Project[]>(response)
      setProjects(normalizeProjects(data as unknown as ProjectRecord[]))
      setProjectsError(null)
    } catch (error) {
      setProjects([])
      setProjectsError(getErrorMessage(error, "โหลดโปรเจกต์ไม่สำเร็จ"))
    } finally {
      setIsProjectsLoading(false)
    }
  }

  async function loadProjectDetail(projectId: string, keepDrawerOpen = true) {
    if (keepDrawerOpen) {
      setSelectedProjectId(projectId)
    }

    setIsProjectDetailLoading(true)
    setProjectDetailError(null)

    try {
      const response = await api.projects.getById(projectId)
      const data = await handleApiResponse<Project>(response)
      setSelectedProject(normalizeProject(data))
    } catch (error) {
      setProjectDetailError(getErrorMessage(error, "โหลดรายละเอียดโปรเจกต์ไม่สำเร็จ"))
    } finally {
      setIsProjectDetailLoading(false)
    }
  }

  useEffect(() => {
    void loadProjects()
  }, [])

  const handleOpenProject = async (projectId: string) => {
    await loadProjectDetail(projectId)
  }

  const handleCreateProject = async () => {
    if (!form.name.trim()) {
      setCreateError("กรุณากรอกชื่อโปรเจกต์")
      return
    }

    setIsCreatingProject(true)

    try {
      const response = await api.projects.create({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        initialCost: parseFloat(form.initialCost) || 0,
        monthlyGoal: parseFloat(form.monthlyGoal) || 0,
      })

      const created = await handleApiResponse<Project>(response)
      const normalized = normalizeProject(created)

      setProjects((prev) => [normalized, ...prev])
      setForm({ name: "", description: "", initialCost: "", monthlyGoal: "" })
      setCreateError(null)
      setShowCreateModal(false)
      await loadProjectDetail(normalized.id)
      await loadProjects()
    } catch (error) {
      setCreateError(getErrorMessage(error, "สร้างโปรเจกต์ไม่สำเร็จ"))
    } finally {
      setIsCreatingProject(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    setIsDeletingProject(true)

    try {
      const response = await api.projects.delete(projectId)

      if (!response.ok) {
        await handleApiResponse(response)
      }

      setProjects((prev) => prev.filter((project) => project.id !== projectId))
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null)
        setSelectedProject(null)
      }
      setDeleteTargetId(null)
    } catch (error) {
      setProjectsError(getErrorMessage(error, "ลบโปรเจกต์ไม่สำเร็จ"))
    } finally {
      setIsDeletingProject(false)
    }
  }

  const handleProjectChanged = async (projectId: string) => {
    await Promise.all([loadProjects(), loadProjectDetail(projectId, false)])
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 text-3xl font-bold text-[#0F172A] dark:text-white">
            โปรเจกต์ของฉัน
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            จัดการงาน side hustle, task และรายรับรายจ่ายของแต่ละโปรเจกต์ในที่เดียว
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="gap-2 rounded-xl bg-[#7F77DD] text-white shadow-sm hover:bg-[#534AB7]"
        >
          <Plus className="h-4 w-4" />
          สร้างโปรเจกต์
        </Button>
      </div>

      {projectsError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          <p>{projectsError}</p>
          <Button variant="outline" className="mt-3 rounded-xl" onClick={() => void loadProjects()}>
            ลองใหม่
          </Button>
        </div>
      ) : null}

      {isProjectsLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          กำลังโหลดโปรเจกต์...
        </div>
      ) : null}

      {!isProjectsLoading && projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderKanban className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="font-medium text-gray-400">ยังไม่มีโปรเจกต์</p>
          <p className="mt-1 text-sm text-gray-400">เริ่มสร้างโปรเจกต์แรกเพื่อจัดการงานและติดตามรายได้</p>
        </div>
      ) : null}

      {!isProjectsLoading && projects.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const income = calcProjectIncome(project)
            const profit = getProfit(project)
            const goalPercent = getGoalPercent(project)
            const taskCount = project.progress?.totalTasks ?? project.tasks.length
            const completedTasks = project.progress?.completedTasks ?? project.tasks.filter((task) => task.completed).length

            return (
              <Card
                key={project.id}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:border-[#7F77DD]/60 hover:shadow-lg dark:border-gray-800"
                onClick={() => void handleOpenProject(project.id)}
              >
                <CardContent className="flex flex-1 flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-[#0F172A] transition-colors group-hover:text-[#534AB7] dark:text-white dark:group-hover:text-[#AFA9EC]">
                        {project.name}
                      </h3>
                      {project.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-400">
                          {project.description}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setDeleteTargetId(project.id)
                      }}
                      className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      aria-label="ลบโปรเจกต์"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-gray-50 p-2.5 text-center dark:bg-gray-800/60">
                      <p className="mb-1 flex items-center justify-center gap-1 text-[10px] text-gray-400">
                        <TrendingUp className="h-3 w-3" />
                        รายได้
                      </p>
                      <p className="text-sm font-bold text-[#534AB7] dark:text-[#AFA9EC]">
                        ฿{income.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-2.5 text-center dark:bg-gray-800/60">
                      <p className="mb-1 flex items-center justify-center gap-1 text-[10px] text-gray-400">
                        <BarChart2 className="h-3 w-3" />
                        กำไรสุทธิ
                      </p>
                      <p className={`text-sm font-bold ${profit >= 0 ? "text-[#1D9E75]" : "text-red-500"}`}>
                        {profit >= 0 ? "+" : ""}฿{profit.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-2.5 text-center dark:bg-gray-800/60">
                      <p className="mb-1 flex items-center justify-center gap-1 text-[10px] text-gray-400">
                        <ListTodo className="h-3 w-3" />
                        งาน
                      </p>
                      <p className="text-sm font-bold text-orange-500">
                        {completedTasks}/{taskCount}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Target className="h-3 w-3" />
                        เป้ารายเดือน ฿{project.monthlyGoal.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-semibold text-[#534AB7] dark:text-[#AFA9EC]">
                        {goalPercent}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#7F77DD] to-[#AFA9EC] transition-all duration-500"
                        style={{ width: `${goalPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-1 dark:border-gray-800">
                    <span className="text-[11px] text-gray-400">
                      สร้าง {formatShortDate(project.createdAt)}
                    </span>
                    <span className="flex items-center gap-0.5 text-[11px] font-medium text-[#7F77DD]">
                      เปิดดู <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="z-[200] rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0F172A] dark:text-white">
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
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }))
                  setCreateError(null)
                }}
                className="rounded-xl border-gray-300 bg-white text-[#0F172A] placeholder:text-gray-400 focus-visible:ring-[#7F77DD] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                คำอธิบาย
              </label>
              <Textarea
                placeholder="อธิบายโปรเจกต์คร่าว ๆ"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                className="resize-none rounded-xl border-gray-300 bg-white text-[#0F172A] placeholder:text-gray-400 focus-visible:ring-[#7F77DD] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  ต้นทุนเริ่มต้น (฿)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={form.initialCost}
                  onChange={(event) => setForm((current) => ({ ...current, initialCost: event.target.value }))}
                  className="rounded-xl border-gray-300 bg-white text-[#0F172A] focus-visible:ring-[#7F77DD] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  เป้ารายเดือน (฿)
                </label>
                <Input
                  type="number"
                  min={0}
                  value={form.monthlyGoal}
                  onChange={(event) => setForm((current) => ({ ...current, monthlyGoal: event.target.value }))}
                  className="rounded-xl border-gray-300 bg-white text-[#0F172A] focus-visible:ring-[#7F77DD] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {createError ? <p className="text-sm text-red-500">{createError}</p> : null}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setShowCreateModal(false)
                setCreateError(null)
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={() => void handleCreateProject()}
              disabled={isCreatingProject}
              className="rounded-xl bg-[#7F77DD] text-white hover:bg-[#534AB7]"
            >
              {isCreatingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : "สร้างโปรเจกต์"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>ลบโปรเจกต์นี้?</AlertDialogTitle>
            <AlertDialogDescription>
              โปรเจกต์, task และรายการรายรับรายจ่ายที่ผูกกับโปรเจกต์นี้จะถูกลบถาวร
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTargetId && void handleDeleteProject(deleteTargetId)}
              disabled={isDeletingProject}
              className="rounded-xl bg-red-500 text-white hover:bg-red-600"
            >
              {isDeletingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : "ลบโปรเจกต์"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedProjectId ? (
        <ProjectDetail
          project={selectedProject}
          isLoading={isProjectDetailLoading}
          error={projectDetailError}
          onClose={() => {
            setSelectedProjectId(null)
            setSelectedProject(null)
            setProjectDetailError(null)
          }}
          onRefresh={() => void loadProjectDetail(selectedProjectId, false)}
          onProjectChanged={() => void handleProjectChanged(selectedProjectId)}
        />
      ) : null}
    </div>
  )
}
