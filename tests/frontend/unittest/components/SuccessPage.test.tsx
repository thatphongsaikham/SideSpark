/** @jsxImportSource @/test-utils */
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import SuccessPage from "@/components/main/SuccessPage"

const {
  mockProjectsGetAll,
  mockTransactionsGetSummary,
  mockMilestonesGetAll,
  mockMilestonesCreate,
  mockMilestonesUpdate,
  mockMilestonesDelete,
} = vi.hoisted(() => ({
  mockProjectsGetAll: vi.fn(),
  mockTransactionsGetSummary: vi.fn(),
  mockMilestonesGetAll: vi.fn(),
  mockMilestonesCreate: vi.fn(),
  mockMilestonesUpdate: vi.fn(),
  mockMilestonesDelete: vi.fn(),
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
      milestones: {
        getAll: mockMilestonesGetAll,
        create: mockMilestonesCreate,
        update: mockMilestonesUpdate,
        delete: mockMilestonesDelete,
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

function hasExactText(text: string) {
  return (_content: string, element: Element | null) => element?.textContent === text
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
  weeklyData: [
    {
      week: "2026-W14",
      income: 1200,
      expense: 300,
      profit: 900,
    },
    {
      week: "2026-W15",
      income: 1800,
      expense: 500,
      profit: 1300,
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
  maxStreak: 10,
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

const milestonesResponse = [
  {
    id: "milestone-1",
    userId: "user-1",
    title: "รายได้ครบ 1,000 บาท",
    description: "ทำให้ได้จากงานแรก",
    target: "ปิดงานแรกให้ได้ภายในเดือนนี้",
    achieved: true,
    achievedAt: "2026-04-15T00:00:00.000Z",
    createdAt: "2026-04-01T00:00:00.000Z",
  },
  {
    id: "milestone-2",
    userId: "user-1",
    title: "ลูกค้าประจำคนแรก",
    description: null,
    target: "มีลูกค้ากลับมาจ้างซ้ำอย่างน้อย 1 คน",
    achieved: false,
    achievedAt: null,
    createdAt: "2026-04-05T00:00:00.000Z",
  },
]

describe("SuccessPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProjectsGetAll.mockImplementation(() => Promise.resolve(createResponse(projectsResponse)))
    mockTransactionsGetSummary.mockImplementation(() => Promise.resolve(createResponse(statisticsResponse)))
    mockMilestonesGetAll.mockImplementation(() => Promise.resolve(createResponse(milestonesResponse)))
    mockMilestonesCreate.mockResolvedValue(
      createResponse(
        {
          id: "milestone-3",
          userId: "user-1",
          title: "รีวิวแรกจากลูกค้า",
          description: "ขอ feedback หลังส่งงาน",
          target: "ได้รีวิว 1 รีวิวภายในเดือนนี้",
          achieved: false,
          achievedAt: null,
          createdAt: "2026-04-20T00:00:00.000Z",
        },
        { status: 201 }
      )
    )
    mockMilestonesUpdate.mockResolvedValue(
      createResponse({
        ...milestonesResponse[1],
        achieved: true,
        achievedAt: "2026-04-20T00:00:00.000Z",
      })
    )
    mockMilestonesDelete.mockResolvedValue(new Response(null, { status: 204 }))
  })

  it("loads success statistics, milestones, and supports switching the chart view", async () => {
    const user = userEvent.setup()

    render(<SuccessPage />)
    expect(await screen.findByText("Max Streak")).toBeInTheDocument()

    expect(await screen.findByText("ความสำเร็จ")).toBeInTheDocument()
    expect(screen.getByText("฿8,000")).toBeInTheDocument()
    expect(screen.getByText("฿2,000")).toBeInTheDocument()
    expect(screen.getByText("+฿6,000")).toBeInTheDocument()
    expect(screen.getByText("7 วัน")).toBeInTheDocument()
    expect(screen.getByText("2 รายการ")).toBeInTheDocument()
    expect(screen.getByText("2 งาน")).toBeInTheDocument()
    expect(screen.getByText("รายได้ครบ 1,000 บาท")).toBeInTheDocument()
    expect(screen.getByText("ลูกค้าประจำคนแรก")).toBeInTheDocument()
    expect(screen.getByText("กำไรสุทธิรายเดือน")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "รายสัปดาห์" }))

    expect(screen.getByText("กำไรสุทธิรายสัปดาห์")).toBeInTheDocument()
    expect(mockProjectsGetAll).toHaveBeenCalledTimes(1)
    expect(mockTransactionsGetSummary).toHaveBeenCalledTimes(1)
    expect(mockMilestonesGetAll).toHaveBeenCalledTimes(1)
  })

  it("uses the displayed project income to render project goal progress", async () => {
    mockProjectsGetAll.mockResolvedValueOnce(
      createResponse([
        {
          ...projectsResponse[0],
          monthlyGoal: 10000,
        },
      ])
    )
    mockTransactionsGetSummary.mockResolvedValueOnce(
      createResponse({
        ...statisticsResponse,
        totalIncome: 1500,
        totalExpense: 0,
        netProfit: 1500,
        incomeByProject: [
          {
            projectId: "project-1",
            projectName: "Canva Services",
            total: 1500,
          },
        ],
        weeklyData: [],
        monthlyData: [],
        goalsProgress: [
          {
            projectId: "project-1",
            goal: 10000,
            current: 500,
            progress: 3,
          },
        ],
      })
    )
    mockMilestonesGetAll.mockResolvedValueOnce(createResponse([]))

    render(<SuccessPage />)

    await screen.findAllByText("Canva Services")

    expect(screen.getByText(hasExactText("฿1,500 / ฿10,000"))).toBeInTheDocument()
    expect(screen.queryByText(hasExactText("฿500 / ฿10,000"))).not.toBeInTheDocument()
    expect(screen.getAllByText("15%")).toHaveLength(2)
  })

  it("creates a milestone through the backend and refreshes the dashboard data", async () => {
    const user = userEvent.setup()

    mockMilestonesGetAll
      .mockResolvedValueOnce(createResponse(milestonesResponse))
      .mockResolvedValueOnce(
        createResponse([
          ...milestonesResponse,
          {
            id: "milestone-3",
            userId: "user-1",
            title: "รีวิวแรกจากลูกค้า",
            description: "ขอ feedback หลังส่งงาน",
            target: "ได้รีวิว 1 รีวิวภายในเดือนนี้",
            achieved: false,
            achievedAt: null,
            createdAt: "2026-04-20T00:00:00.000Z",
          },
        ])
      )

    render(<SuccessPage />)

    await screen.findByRole("heading", { name: "Milestones" })
    await user.type(screen.getByPlaceholderText("เช่น รายได้ครบ 1,000 บาท"), "รีวิวแรกจากลูกค้า")
    await user.type(
      screen.getByPlaceholderText("เช่น ปิดงานแรกให้ได้ภายในเดือนนี้"),
      "ได้รีวิว 1 รีวิวภายในเดือนนี้"
    )
    await user.type(screen.getByPlaceholderText("รายละเอียดเพิ่มเติม (ถ้ามี)"), "ขอ feedback หลังส่งงาน")
    await user.click(screen.getByRole("button", { name: "เพิ่ม milestone" }))

    expect(mockMilestonesCreate).toHaveBeenCalledWith({
      title: "รีวิวแรกจากลูกค้า",
      target: "ได้รีวิว 1 รีวิวภายในเดือนนี้",
      description: "ขอ feedback หลังส่งงาน",
    })

    await waitFor(() => {
      expect(mockMilestonesGetAll).toHaveBeenCalledTimes(2)
    })

    expect(await screen.findByText("รีวิวแรกจากลูกค้า")).toBeInTheDocument()
  })

  it("marks a milestone as achieved and refreshes the milestone count", async () => {
    const user = userEvent.setup()

    mockTransactionsGetSummary
      .mockResolvedValueOnce(createResponse(statisticsResponse))
      .mockResolvedValueOnce(
        createResponse({
          ...statisticsResponse,
          milestonesCompleted: 3,
        })
      )

    mockMilestonesGetAll
      .mockResolvedValueOnce(createResponse(milestonesResponse))
      .mockResolvedValueOnce(
        createResponse([
          milestonesResponse[0],
          {
            ...milestonesResponse[1],
            achieved: true,
            achievedAt: "2026-04-20T00:00:00.000Z",
          },
        ])
      )

    render(<SuccessPage />)

    expect(await screen.findByText("ลูกค้าประจำคนแรก")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "ทำสำเร็จ ลูกค้าประจำคนแรก" }))

    expect(mockMilestonesUpdate).toHaveBeenCalledWith("milestone-2", {
      achieved: true,
    })

    await waitFor(() => {
      expect(mockTransactionsGetSummary).toHaveBeenCalledTimes(2)
      expect(mockMilestonesGetAll).toHaveBeenCalledTimes(2)
    })

    expect(await screen.findByText("3 รายการ")).toBeInTheDocument()
  })
})
