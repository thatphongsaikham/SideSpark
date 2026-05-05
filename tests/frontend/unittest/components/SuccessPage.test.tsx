/** @jsxImportSource @/test-utils */
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import SuccessPage from "@/components/main/SuccessPage"

const {
  mockProjectsGetAll,
  mockTransactionsGetSummary,
} = vi.hoisted(() => ({
  mockProjectsGetAll: vi.fn(),
  mockTransactionsGetSummary: vi.fn(),
}))

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api")

  return {
    ...actual,
    api: {
      ...actual.api,
      projects: {
        ...actual.api.projects,
        getAll: mockProjectsGetAll,
      },
      transactions: {
        ...actual.api.transactions,
        getSummary: mockTransactionsGetSummary,
      },
    },
  }
})

function createResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  })
}

const projectsResponse = [
  {
    id: "project-1",
    userId: "user-1",
    name: "Canva Services",
    description: "รับทำงานออกแบบ",
    initialCost: 1000,
    monthlyGoal: 5000,
    status: "active",
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-02T00:00:00.000Z",
    tasks: [
      {
        id: "task-1",
        projectId: "project-1",
        text: "Create portfolio",
        completed: true,
        order: 0,
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
      {
        id: "task-2",
        projectId: "project-1",
        text: "Find client",
        completed: true,
        order: 1,
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
    ],
    transactions: [],
    progress: {
      totalTasks: 2,
      completedTasks: 2,
      percentage: 100,
    },
  },
  {
    id: "project-2",
    userId: "user-1",
    name: "Photo Service",
    description: "ถ่ายภาพสินค้า",
    initialCost: 300,
    monthlyGoal: 4000,
    status: "active",
    createdAt: "2026-04-10T00:00:00.000Z",
    updatedAt: "2026-04-11T00:00:00.000Z",
    tasks: [
      {
        id: "task-3",
        projectId: "project-2",
        text: "Contact clients",
        completed: false,
        order: 0,
        createdAt: "2026-04-10T00:00:00.000Z",
        updatedAt: "2026-04-10T00:00:00.000Z",
      },
    ],
    transactions: [],
    progress: {
      totalTasks: 1,
      completedTasks: 0,
      percentage: 0,
    },
  },
]

const statisticsResponse = {
  totalIncome: 8000,
  totalExpense: 2000,
  netProfit: 6000,
  incomeByProject: [
    {
      projectId: "project-1",
      projectName: "Canva Services",
      total: 5000,
    },
    {
      projectId: "project-2",
      projectName: "Photo Service",
      total: 3000,
    },
  ],
  monthlyData: [
    {
      month: "2026-03",
      income: 3000,
      expense: 1000,
      profit: 2000,
    },
    {
      month: "2026-04",
      income: 5000,
      expense: 1000,
      profit: 4000,
    },
  ],
  streak: 7,
  milestonesCompleted: 2,
  goalsProgress: [
    {
      projectId: "project-1",
      goal: 5000,
      current: 5000,
      progress: 100,
    },
    {
      projectId: "project-2",
      goal: 4000,
      current: 3000,
      progress: 75,
    },
  ],
}

describe("SuccessPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProjectsGetAll.mockResolvedValue(createResponse(projectsResponse))
    mockTransactionsGetSummary.mockResolvedValue(createResponse(statisticsResponse))
  })

  it("loads success statistics and renders KPI cards from backend data", async () => {
    render(<SuccessPage />)

    expect(await screen.findByText("ความสำเร็จ")).toBeInTheDocument()
    expect(screen.getByText("฿8,000")).toBeInTheDocument()
    expect(screen.getByText("฿2,000")).toBeInTheDocument()
    expect(screen.getByText("+฿6,000")).toBeInTheDocument()
    expect(screen.getByText("7 วัน")).toBeInTheDocument()
    expect(screen.getByText("2 รายการ")).toBeInTheDocument()
    expect(screen.getByText("2 งาน")).toBeInTheDocument()

    expect(mockProjectsGetAll).toHaveBeenCalledTimes(1)
    expect(mockTransactionsGetSummary).toHaveBeenCalledTimes(1)
  })

  it("renders project goal progress and unlocked achievements from backend data", async () => {
    render(<SuccessPage />)

    expect(await screen.findByText("รายได้ต่อโปรเจกต์เทียบเป้ารายเดือน")).toBeInTheDocument()
    expect(screen.getAllByText("Canva Services").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Photo Service").length).toBeGreaterThan(0)
    expect(screen.getAllByText("100%").length).toBeGreaterThan(0)
    expect(screen.getAllByText("75%").length).toBeGreaterThan(0)
    expect(screen.getByText("Achievements")).toBeInTheDocument()
    expect(screen.getByText("รายได้แรก")).toBeInTheDocument()
    expect(screen.getByText("ถึงเป้าแล้ว")).toBeInTheDocument()
    expect(screen.getByText("8/10")).toBeInTheDocument()
  })
})
