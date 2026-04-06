/** @jsxImportSource @/test-utils */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import ExploreIdeas from "@/components/main/ExploreIdeas"

const {
  mockSkillsGetAll,
  mockSkillsAdd,
  mockSkillsRemove,
  mockIdeasGetAll,
} = vi.hoisted(() => ({
  mockSkillsGetAll: vi.fn(),
  mockSkillsAdd: vi.fn(),
  mockSkillsRemove: vi.fn(),
  mockIdeasGetAll: vi.fn(),
}))

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api")

  return {
    ...actual,
    api: {
      ...actual.api,
      skills: {
        ...actual.api.skills,
        getAll: mockSkillsGetAll,
        add: mockSkillsAdd,
        remove: mockSkillsRemove,
      },
      ideas: {
        ...actual.api.ideas,
        getAll: mockIdeasGetAll,
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

const initialSkillsResponse = {
  skills: [
    {
      id: "skill-design",
      name: "การออกแบบ",
      nameEn: "Design",
      category: "creative",
      isSelected: true,
    },
    {
      id: "skill-canva",
      name: "Canva",
      nameEn: null,
      category: "creative",
      isSelected: true,
    },
    {
      id: "skill-photo",
      name: "การถ่ายภาพ",
      nameEn: "Photography",
      category: "creative",
      isSelected: false,
    },
  ],
  userSkills: [
    {
      id: "skill-design",
      name: "การออกแบบ",
      nameEn: "Design",
      category: "creative",
      userSkillId: "user-skill-design",
      addedAt: "2026-04-06T00:00:00.000Z",
    },
    {
      id: "skill-canva",
      name: "Canva",
      nameEn: null,
      category: "creative",
      userSkillId: "user-skill-canva",
      addedAt: "2026-04-06T00:01:00.000Z",
    },
  ],
}

const initialIdeasResponse = [
  {
    id: "idea-1",
    title: "รับทำพรีเซนต์ด้วย Canva",
    description: "รับทำสไลด์งานให้ลูกค้าและนักศึกษา",
    skills: ["Canva", "การออกแบบ"],
    difficulty: "easy",
    estimatedIncome: {
      min: 300,
      max: 1500,
      unit: "THB",
    },
    timeToStart: "1 วัน",
    requiredTools: ["Canva"],
    resources: [],
    matchedSkills: ["Canva", "การออกแบบ"],
    matchCount: 2,
    recommendationSource: "saved-skills",
  },
]

describe("ExploreIdeas", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSkillsGetAll.mockResolvedValue(createResponse(initialSkillsResponse))
    mockIdeasGetAll.mockResolvedValue(createResponse(initialIdeasResponse))
    mockSkillsAdd.mockResolvedValue(createResponse({}, { status: 201 }))
    mockSkillsRemove.mockResolvedValue(new Response(null, { status: 204 }))
  })

  it("loads saved user skills and personalized ideas from the backend", async () => {
    render(<ExploreIdeas />)

    expect(await screen.findByText("ทักษะของคุณ (2)")).toBeInTheDocument()
    expect(await screen.findByText("รับทำพรีเซนต์ด้วย Canva")).toBeInTheDocument()
    expect(screen.getByLabelText("ลบ Canva")).toBeInTheDocument()

    expect(mockSkillsGetAll).toHaveBeenCalledTimes(1)
    expect(mockIdeasGetAll).toHaveBeenCalledTimes(1)
  })

  it("searches skills from the backend and shows selected skills as disabled", async () => {
    mockSkillsGetAll
      .mockResolvedValueOnce(createResponse(initialSkillsResponse))
      .mockResolvedValueOnce(createResponse({
        skills: [
          {
            id: "skill-photo",
            name: "การถ่ายภาพ",
            nameEn: "Photography",
            category: "creative",
            isSelected: true,
          },
        ],
        userSkills: [
          {
            id: "skill-photo",
            name: "การถ่ายภาพ",
            nameEn: "Photography",
            category: "creative",
            userSkillId: "user-skill-photo",
            addedAt: "2026-04-06T00:00:00.000Z",
          },
        ],
      }))

    render(<ExploreIdeas />)

    await screen.findByText("ทักษะของคุณ (2)")

    const searchInput = screen.getByRole("combobox", { name: "ค้นหาทักษะ" })
    fireEvent.change(searchInput, { target: { value: "photo" } })

    expect(mockSkillsGetAll).toHaveBeenLastCalledWith({ q: "photo" })
    expect(await screen.findByRole("button", { name: /การถ่ายภาพ.*เลือกแล้ว/i })).toBeDisabled()
  })

  it("adds a skill through the backend and refreshes ideas", async () => {
    const user = userEvent.setup()

    mockSkillsGetAll
      .mockResolvedValueOnce(createResponse(initialSkillsResponse))
      .mockResolvedValueOnce(createResponse({
        skills: [
          {
            id: "skill-figma",
            name: "Figma",
            nameEn: null,
            category: "design-tool",
            isSelected: false,
          },
        ],
        userSkills: initialSkillsResponse.userSkills,
      }))
      .mockResolvedValueOnce(createResponse({
        skills: [
          {
            id: "skill-figma",
            name: "Figma",
            nameEn: null,
            category: "design-tool",
            isSelected: true,
          },
        ],
        userSkills: [
          ...initialSkillsResponse.userSkills,
          {
            id: "skill-figma",
            name: "Figma",
            nameEn: null,
            category: "design-tool",
            userSkillId: "user-skill-figma",
            addedAt: "2026-04-06T00:03:00.000Z",
          },
        ],
      }))

    mockIdeasGetAll
      .mockResolvedValueOnce(createResponse(initialIdeasResponse))
      .mockResolvedValueOnce(createResponse([
        ...initialIdeasResponse,
        {
          id: "idea-figma",
          title: "ออกแบบ UI Mockup ด้วย Figma",
          description: "ทำ wireframe และ mockup ให้ลูกค้า",
          skills: ["Figma"],
          difficulty: "medium",
          estimatedIncome: {
            min: 1000,
            max: 4000,
            unit: "THB",
          },
          timeToStart: "2 วัน",
          requiredTools: ["Figma"],
          resources: [],
          matchedSkills: ["Figma"],
          matchCount: 1,
          recommendationSource: "saved-skills",
        },
      ]))

    render(<ExploreIdeas />)

    await screen.findByText("ทักษะของคุณ (2)")

    const searchInput = screen.getByRole("combobox", { name: "ค้นหาทักษะ" })
    fireEvent.change(searchInput, { target: { value: "fig" } })

    await user.click(await screen.findByRole("button", { name: /Figma.*เลือก/i }))

    expect(mockSkillsAdd).toHaveBeenCalledWith("skill-figma")
    expect(await screen.findByText("ทักษะของคุณ (3)")).toBeInTheDocument()
    expect(await screen.findByLabelText("ลบ Figma")).toBeInTheDocument()
    expect(await screen.findByText("ออกแบบ UI Mockup ด้วย Figma")).toBeInTheDocument()
  })

  it("removes a skill through the backend and refreshes ideas", async () => {
    const user = userEvent.setup()

    mockSkillsGetAll
      .mockResolvedValueOnce(createResponse(initialSkillsResponse))
      .mockResolvedValueOnce(createResponse({
        skills: initialSkillsResponse.skills.map((skill) =>
          skill.id === "skill-canva"
            ? { ...skill, isSelected: false }
            : skill
        ),
        userSkills: [
          {
            id: "skill-design",
            name: "การออกแบบ",
            nameEn: "Design",
            category: "creative",
            userSkillId: "user-skill-design",
            addedAt: "2026-04-06T00:00:00.000Z",
          },
        ],
      }))

    mockIdeasGetAll
      .mockResolvedValueOnce(createResponse(initialIdeasResponse))
      .mockResolvedValueOnce(createResponse([]))

    render(<ExploreIdeas />)

    await screen.findByText("ทักษะของคุณ (2)")
    await user.click(screen.getByLabelText("ลบ Canva"))

    expect(mockSkillsRemove).toHaveBeenCalledWith("skill-canva")
    expect(await screen.findByText("ทักษะของคุณ (1)")).toBeInTheDocument()
    expect(await screen.findByText("ยังไม่มีไอเดียที่ตรงกับทักษะของคุณ")).toBeInTheDocument()

    await waitFor(() => {
      expect(mockIdeasGetAll).toHaveBeenCalledTimes(2)
    })
  })
})
