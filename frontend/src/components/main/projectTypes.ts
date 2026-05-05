"use client"

import type { Project as ApiProject, Task as ApiTask, Transaction as ApiTransaction } from "@/types"

export type ProjectTask = Omit<ApiTask, "createdAt" | "updatedAt"> & {
  createdAt: string | Date
  updatedAt: string | Date
}

export type ProjectTransaction = Omit<ApiTransaction, "date" | "createdAt"> & {
  date: string | Date
  createdAt: string | Date
}

export type ProjectRecord = Omit<ApiProject, "createdAt" | "updatedAt" | "tasks"> & {
  createdAt: string | Date
  updatedAt: string | Date
  tasks: ProjectTask[]
  transactions: ProjectTransaction[]
  _count?: {
    tasks: number
    transactions: number
  }
}

type ProjectLike = Partial<ProjectRecord> & {
  tasks?: unknown
  transactions?: unknown
  description?: string | null
}

export function normalizeProject(project: ProjectLike): ProjectRecord {
  return {
    ...project,
    description: project.description ?? null,
    tasks: Array.isArray(project.tasks) ? project.tasks : [],
    transactions: Array.isArray(project.transactions) ? project.transactions : [],
  } as ProjectRecord
}

export function normalizeProjects(projects: ProjectLike[]): ProjectRecord[] {
  return projects.map(normalizeProject)
}

export function formatShortDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatDateInput(value: string | Date): string {
  return new Date(value).toISOString().split("T")[0]
}

export function calcProjectIncome(project: ProjectRecord): number {
  return project.transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0)
}

export function calcProjectExpense(project: ProjectRecord): number {
  return project.transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0)
}
