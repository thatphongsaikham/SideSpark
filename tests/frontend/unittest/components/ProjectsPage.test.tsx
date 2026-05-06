/** @jsxImportSource @/test-utils */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import ProjectsPage from "@/components/main/ProjectsPage"

const {
  mockProjectsGetAll,
  mockProjectsGetById,
  mockProjectsCreate,
} = vi.hoisted(() => ({
  mockProjectsGetAll: vi.fn(),
  mockProjectsGetById: vi.fn(),
  mockProjectsCreate: vi.fn(),
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
        getById: mockProjectsGetById,
        create: mockProjectsCreate,
      },
    },
  }
})

vi.mock("@/components/main/ProjectDetail", () => ({
  default: ({
    project,
    isLoading,
    error,
  }: {
    project: { name: string } | null
    isLoading: boolean
    error: string | null
  }) => (
    <div data-testid="project-detail">
      <span>{isLoading ? "loading detail" : project?.name ?? "no project"}</span>
      {error ? <span>{error}</span> : null}
    </div>
  ),
}))

function createResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  })
}

const projectsListResponse = [
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
        completed: false,
        order: 1,
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
    ],
    transactions: [
      {
        id: "txn-1",
        userId: "user-1",
        projectId: "project-1",
        type: "income",
        amount: 2000,
        description: "Client work",
        date: "2026-04-10T00:00:00.000Z",
        createdAt: "2026-04-10T00:00:00.000Z",
      },
      {
        id: "txn-2",
        userId: "user-1",
        projectId: "project-1",
        type: "expense",
        amount: 500,
        description: "Canva Pro",
        date: "2026-04-02T00:00:00.000Z",
        createdAt: "2026-04-02T00:00:00.000Z",
      },
    ],
    progress: {
      totalTasks: 2,
      completedTasks: 1,
      percentage: 50,
    },
    _count: {
      tasks: 2,
      transactions: 2,
    },
  },
]

const projectDetailResponse = {
  ...projectsListResponse[0],
  transactions: [
    ...projectsListResponse[0].transactions,
    {
      id: "txn-3",
      userId: "user-1",
      projectId: "project-1",
      type: "income",
      amount: 3500,
      description: "Additional work",
      date: "2026-04-15T00:00:00.000Z",
      createdAt: "2026-04-15T00:00:00.000Z",
    },
  ],
}

describe("ProjectsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProjectsGetAll.mockResolvedValue(createResponse(projectsListResponse))
    mockProjectsGetById.mockResolvedValue(createResponse(projectDetailResponse))
    mockProjectsCreate.mockResolvedValue(
      createResponse(
        {
          id: "project-2",
          userId: "user-1",
          name: "Photo Service",
          description: "ถ่ายภาพสินค้า",
          initialCost: 300,
          monthlyGoal: 4000,
          status: "active",
          createdAt: "2026-04-20T00:00:00.000Z",
          updatedAt: "2026-04-20T00:00:00.000Z",
          tasks: [],
          transactions: [],
        },
        { status: 201 }
      )
    )
  })

  it("loads projects from the backend and renders summary metrics", async () => {
    render(<ProjectsPage />)

    expect(await screen.findByText("Canva Services")).toBeInTheDocument()
    expect(screen.getByText("฿2,000")).toBeInTheDocument()
    expect(screen.getByText("+฿1,500")).toBeInTheDocument()
    expect(screen.getByText("1/2")).toBeInTheDocument()
    expect(mockProjectsGetAll).toHaveBeenCalledTimes(1)
  })

  it("opens project detail by fetching the selected project from the backend", async () => {
    const user = userEvent.setup()

    render(<ProjectsPage />)

    await screen.findByText("Canva Services")
    await user.click(screen.getByText("Canva Services"))

    expect(mockProjectsGetById).toHaveBeenCalledWith("project-1")
    expect(await screen.findByTestId("project-detail")).toHaveTextContent("Canva Services")
  })

  it("creates a project with starter tasks through the backend and refreshes the list", async () => {
    const user = userEvent.setup()

    mockProjectsGetAll
      .mockResolvedValueOnce(createResponse(projectsListResponse))
      .mockResolvedValueOnce(
        createResponse([
          {
            id: "project-2",
            userId: "user-1",
            name: "Photo Service",
            description: "ถ่ายภาพสินค้า",
            initialCost: 300,
            monthlyGoal: 4000,
            status: "active",
            createdAt: "2026-04-20T00:00:00.000Z",
            updatedAt: "2026-04-20T00:00:00.000Z",
            tasks: [
              {
                id: "task-4",
                projectId: "project-2",
                text: "Shoot sample portfolio",
                completed: false,
                order: 0,
                createdAt: "2026-04-20T00:00:00.000Z",
                updatedAt: "2026-04-20T00:00:00.000Z",
              },
              {
                id: "task-5",
                projectId: "project-2",
                text: "Contact first client",
                completed: false,
                order: 1,
                createdAt: "2026-04-20T00:00:00.000Z",
                updatedAt: "2026-04-20T00:00:00.000Z",
              },
            ],
            transactions: [],
          },
          ...projectsListResponse,
        ])
      )

    render(<ProjectsPage />)

    await screen.findByText("Canva Services")
    await user.click(screen.getByRole("button", { name: "สร้างโปรเจกต์" }))

    await user.type(screen.getByPlaceholderText("เช่น รับทำพรีเซนต์ Canva"), "Photo Service")
    await user.type(screen.getByPlaceholderText("อธิบายโปรเจกต์คร่าว ๆ"), "ถ่ายภาพสินค้า")
    await user.type(screen.getByPlaceholderText("งานเริ่มต้น..."), "Shoot sample portfolio")
    await user.click(screen.getByRole("button", { name: "เพิ่มงานเริ่มต้น" }))
    await user.type(screen.getByPlaceholderText("งานเริ่มต้น..."), "Contact first client")
    await user.click(screen.getByRole("button", { name: "เพิ่มงานเริ่มต้น" }))

    const amountInputs = screen.getAllByRole("spinbutton")
    fireEvent.change(amountInputs[0], { target: { value: "300" } })
    fireEvent.change(amountInputs[1], { target: { value: "4000" } })

    await user.click(screen.getByRole("button", { name: /^สร้างโปรเจกต์$/ }))

    expect(mockProjectsCreate).toHaveBeenCalledWith({
      name: "Photo Service",
      description: "ถ่ายภาพสินค้า",
      initialCost: 300,
      monthlyGoal: 4000,
      tasks: ["Shoot sample portfolio", "Contact first client"],
    })

    await waitFor(() => {
      expect(mockProjectsGetAll).toHaveBeenCalledTimes(2)
    })

    expect(await screen.findByText("Photo Service")).toBeInTheDocument()
  })
})
