"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { api, handleApiResponse } from "@/lib/api"
import type { Idea, IdeaRecommendation, SearchableSkill, SkillSearchResponse, UserSkill } from "@/types"
import { CheckCircle2, ChevronRight, Loader2, Search, X } from "lucide-react"

type SelectedSkill = {
  id: string
  label: string
  colorClass: string
}

type SkillSearchResult = {
  id: string
  label: string
  category: string
  isSelected: boolean
}

const TAG_COLORS = [
  { bg: "bg-[#EEEDFE]", text: "text-[#3C3489]", border: "border-[#AFA9EC]" },
  { bg: "bg-[#E1F5EE]", text: "text-[#085041]", border: "border-[#5DCAA5]" },
  { bg: "bg-[#FAECE7]", text: "text-[#712B13]", border: "border-[#F0997B]" },
  { bg: "bg-[#E6F1FB]", text: "text-[#0C447C]", border: "border-[#85B7EB]" },
  { bg: "bg-[#EAF3DE]", text: "text-[#27500A]", border: "border-[#97C459]" },
]

const DIFFICULTY_STYLE: Record<
  IdeaRecommendation["difficulty"],
  { label: string; className: string }
> = {
  easy: {
    label: "เริ่มต้นง่าย",
    className: "bg-[#EAF3DE] text-[#3B6D11]",
  },
  medium: {
    label: "ปานกลาง",
    className: "bg-[#FAEEDA] text-[#854F0B]",
  },
  hard: {
    label: "ยาก",
    className: "bg-[#FCEBEB] text-[#A32D2D]",
  },
}

let colorCursor = 0
const assignedColors: Record<string, string> = {}

function getTagColorClass(label: string): string {
  if (!assignedColors[label]) {
    const color = TAG_COLORS[colorCursor % TAG_COLORS.length]
    assignedColors[label] = `${color.bg} ${color.text} ${color.border}`
    colorCursor += 1
  }

  return assignedColors[label]
}

function formatCategoryLabel(category: string | null): string {
  if (!category) return "Skill"

  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatIncomeRange(idea: Idea): string {
  const formatter = new Intl.NumberFormat("th-TH")
  const min = formatter.format(idea.estimatedIncome.min)
  const max = formatter.format(idea.estimatedIncome.max)

  if (idea.estimatedIncome.unit === "THB") {
    return `฿${min} - ฿${max}`
  }

  return `${min} - ${max} ${idea.estimatedIncome.unit}`
}

function mapUserSkillToSelectedSkill(skill: Pick<UserSkill, "id" | "name">): SelectedSkill {
  return {
    id: skill.id,
    label: skill.name,
    colorClass: getTagColorClass(skill.name),
  }
}

function mapSearchableSkill(skill: SearchableSkill): SkillSearchResult {
  return {
    id: skill.id,
    label: skill.name,
    category: formatCategoryLabel(skill.category),
    isSelected: skill.isSelected,
  }
}

function getIdeaTags(idea: IdeaRecommendation): string[] {
  return idea.matchedSkills.length > 0 ? idea.matchedSkills : idea.skills
}

function getDifficultyLabel(difficulty: IdeaRecommendation["difficulty"]): string {
  return DIFFICULTY_STYLE[difficulty].label
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallbackMessage
}

export default function ExploreIdeas() {
  const searchBoxRef = useRef<HTMLDivElement>(null)
  const latestSkillRequestRef = useRef(0)

  const [skills, setSkills] = useState<SelectedSkill[]>([])
  const [ideas, setIdeas] = useState<IdeaRecommendation[]>([])
  const [searchResults, setSearchResults] = useState<SkillSearchResult[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isSkillsLoading, setIsSkillsLoading] = useState(false)
  const [isIdeasLoading, setIsIdeasLoading] = useState(false)
  const [isMutatingSkill, setIsMutatingSkill] = useState(false)
  const [skillsError, setSkillsError] = useState<string | null>(null)
  const [ideasError, setIdeasError] = useState<string | null>(null)
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)
  const [isIdeaDetailOpen, setIsIdeaDetailOpen] = useState(false)
  const [isIdeaDetailLoading, setIsIdeaDetailLoading] = useState(false)
  const [ideaDetailError, setIdeaDetailError] = useState<string | null>(null)

  const normalizedQuery = inputValue.trim()
  const selectableResults = searchResults.filter((skill) => !skill.isSelected)
  const showSuggestions =
    isSearchOpen && (searchResults.length > 0 || normalizedQuery.length > 0 || isSkillsLoading)

  async function refreshSkills(query?: string) {
    const requestId = latestSkillRequestRef.current + 1
    latestSkillRequestRef.current = requestId
    setIsSkillsLoading(true)

    try {
      const response = await api.skills.getAll(query ? { q: query } : undefined)
      const data = await handleApiResponse<SkillSearchResponse>(response)

      if (latestSkillRequestRef.current !== requestId) {
        return
      }

      setSearchResults(data.skills.map(mapSearchableSkill))
      setSkills(data.userSkills.map(mapUserSkillToSelectedSkill))
      setSkillsError(null)
    } catch (error) {
      if (latestSkillRequestRef.current !== requestId) {
        return
      }

      setSearchResults([])
      setSkillsError(getErrorMessage(error, "โหลดทักษะไม่สำเร็จ"))
    } finally {
      if (latestSkillRequestRef.current === requestId) {
        setIsSkillsLoading(false)
      }
    }
  }

  async function refreshIdeas() {
    setIsIdeasLoading(true)

    try {
      const response = await api.ideas.getAll()
      const data = await handleApiResponse<IdeaRecommendation[]>(response)

      setIdeas(data)
      setIdeasError(null)
    } catch (error) {
      setIdeas([])
      setIdeasError(getErrorMessage(error, "โหลดไอเดียไม่สำเร็จ"))
    } finally {
      setIsIdeasLoading(false)
    }
  }

  async function loadInitialData() {
    setIsInitialLoading(true)

    await Promise.all([refreshSkills(), refreshIdeas()])

    setIsInitialLoading(false)
  }

  useEffect(() => {
    void loadInitialData()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearchChange = (nextValue: string) => {
    setInputValue(nextValue)
    setIsSearchOpen(true)
    void refreshSkills(nextValue.trim())
  }

  const handleAddSkill = async (skill: SkillSearchResult) => {
    if (skill.isSelected || isMutatingSkill) {
      setInputValue("")
      return
    }

    setIsMutatingSkill(true)

    try {
      const response = await api.skills.add(skill.id)
      await handleApiResponse(response)

      setInputValue("")
      setIsSearchOpen(false)

      await Promise.all([refreshSkills(), refreshIdeas()])
    } catch (error) {
      setSkillsError(getErrorMessage(error, `เพิ่มทักษะ ${skill.label} ไม่สำเร็จ`))
    } finally {
      setIsMutatingSkill(false)
    }
  }

  const handleRemoveSkill = async (skillId: string, skillLabel: string) => {
    if (isMutatingSkill) return

    setIsMutatingSkill(true)

    try {
      const response = await api.skills.remove(skillId)

      if (!response.ok) {
        await handleApiResponse(response)
      }

      await Promise.all([refreshSkills(normalizedQuery), refreshIdeas()])
    } catch (error) {
      setSkillsError(getErrorMessage(error, `ลบทักษะ ${skillLabel} ไม่สำเร็จ`))
    } finally {
      setIsMutatingSkill(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && selectableResults.length > 0) {
      event.preventDefault()
      void handleAddSkill(selectableResults[0])
      return
    }

    if (event.key === "Escape") {
      setIsSearchOpen(false)
    }
  }

  const handleOpenIdeaDetail = async (idea: IdeaRecommendation) => {
    setSelectedIdea(idea)
    setIsIdeaDetailOpen(true)
    setIdeaDetailError(null)
    setIsIdeaDetailLoading(true)

    try {
      const response = await api.ideas.getById(idea.id)
      const data = await handleApiResponse<Idea>(response)
      setSelectedIdea(data)
    } catch (error) {
      setIdeaDetailError(getErrorMessage(error, "โหลดรายละเอียดไอเดียไม่สำเร็จ"))
    } finally {
      setIsIdeaDetailLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto pt-4 pb-2">
        <h1 className="text-3xl font-bold text-[#0F172A] dark:text-white mb-3">
          สำรวจไอเดียสร้างรายได้ 💡
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          ค้นหา Side Hustle ที่ใช่จากทักษะที่คุณมี ยิ่งระบุทักษะมาก ระบบยิ่งแนะนำได้แม่นยำ
        </p>
      </div>

      <Card className="border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900/80">
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              ค้นหาทักษะในระบบ
            </label>

            <div ref={searchBoxRef} className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="ค้นหาทักษะ เช่น Canva, การถ่ายภาพ, ตัดต่อวิดีโอ..."
                className="h-11 pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-[#7F77DD] rounded-xl"
                value={inputValue}
                onChange={(event) => handleSearchChange(event.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={handleKeyDown}
                role="combobox"
                aria-label="ค้นหาทักษะ"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
                aria-controls="idea-skill-suggestions"
              />

              {showSuggestions && (
                <div
                  id="idea-skill-suggestions"
                  className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl shadow-black/5"
                >
                  <div className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                    <span>
                      {normalizedQuery
                        ? `พบทักษะ ${searchResults.length} รายการ`
                        : `ทักษะในระบบ ${searchResults.length} รายการ`}
                    </span>
                    {isSkillsLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  </div>

                  {isSkillsLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังค้นหาทักษะ...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      ไม่พบทักษะในระบบ ลองค้นหาด้วยคำอื่น
                    </p>
                  ) : (
                    <ul className="max-h-64 overflow-y-auto py-1">
                      {searchResults.map((skill) => (
                        <li key={skill.id}>
                          <button
                            type="button"
                            onClick={() => void handleAddSkill(skill)}
                            disabled={skill.isSelected || isMutatingSkill}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:bg-gray-50/80 dark:disabled:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
                                {skill.label}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {skill.category}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                                skill.isSelected
                                  ? "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                  : "bg-[#EEEDFE] text-[#534AB7]"
                              }`}
                            >
                              {skill.isSelected ? "เลือกแล้ว" : "เลือก"}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              เลือกจากรายการทักษะที่มีอยู่แล้ว แล้วระบบจะใช้ทักษะเหล่านี้ไปจับคู่ไอเดียให้คุณ
            </p>

            {skillsError && (
              <p className="text-sm text-red-500">{skillsError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              ทักษะของคุณ ({skills.length})
            </label>

            <div className="flex flex-wrap gap-2 min-h-[44px] p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              {isInitialLoading ? (
                <p className="text-sm text-gray-400 flex items-center gap-2 m-auto">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังโหลดทักษะของคุณ...
                </p>
              ) : skills.length === 0 ? (
                <p className="text-sm text-gray-400 flex items-center m-auto">
                  ยังไม่มีทักษะ ลองเลือกจากรายการด้านบนได้เลย
                </p>
              ) : (
                skills.map((skill) => (
                  <span
                    key={skill.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${skill.colorClass}`}
                  >
                    {skill.label}
                    <button
                      type="button"
                      onClick={() => void handleRemoveSkill(skill.id, skill.label)}
                      className="ml-1 opacity-60 hover:opacity-100 transition-opacity leading-none"
                      aria-label={`ลบ ${skill.label}`}
                      disabled={isMutatingSkill}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2 text-[#0F172A] dark:text-white">
          <CheckCircle2 className="w-5 h-5 text-[#1D9E75]" />
          ไอเดียที่เหมาะกับคุณ
        </h2>
        <span className="text-sm text-gray-500">
          {isIdeasLoading && !isInitialLoading ? "กำลังอัปเดต..." : `พบ ${ideas.length} รายการ`}
        </span>
      </div>

      {ideasError ? (
        <div className="text-center py-16 text-red-500">
          <p className="text-base">{ideasError}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 rounded-xl"
            onClick={() => void refreshIdeas()}
          >
            ลองใหม่
          </Button>
        </div>
      ) : isInitialLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          กำลังโหลดไอเดียที่เหมาะกับคุณ...
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-base">ยังไม่มีไอเดียที่ตรงกับทักษะของคุณ</p>
          <p className="text-sm mt-1">ลองเลือกทักษะใหม่ดูสิ</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ideas.map((idea) => {
            const difficulty = DIFFICULTY_STYLE[idea.difficulty]

            return (
              <Card
                key={idea.id}
                className="flex flex-col border-gray-200 dark:border-gray-800 hover:border-[#7F77DD]/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group overflow-hidden rounded-2xl cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => void handleOpenIdeaDetail(idea)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    void handleOpenIdeaDetail(idea)
                  }
                }}
              >
                <CardHeader className="p-5 pb-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${difficulty.className}`}
                    >
                      {difficulty.label}
                    </span>
                    <span className="text-[11px] font-medium text-[#534AB7]">
                      แมตช์ {idea.matchCount} ทักษะ
                    </span>
                  </div>
                  <CardTitle className="text-base leading-snug group-hover:text-[#534AB7] dark:group-hover:text-[#AFA9EC] transition-colors">
                    {idea.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-5 pt-0 flex-1 space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                    {idea.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {getIdeaTags(idea).map((tag) => (
                      <span
                        key={`${idea.id}-${tag}`}
                        className="text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      รายได้ประเมิน
                    </p>
                    <p className="text-sm font-bold text-[#534AB7] dark:text-[#AFA9EC]">
                      {formatIncomeRange(idea)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    type="button"
                    className="bg-[#7F77DD] hover:bg-[#534AB7] text-white rounded-xl shadow-sm transition-all active:scale-95"
                    onClick={(event) => {
                      event.stopPropagation()
                      void handleOpenIdeaDetail(idea)
                    }}
                  >
                    รายละเอียด
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
      </div>

      <Dialog open={isIdeaDetailOpen} onOpenChange={setIsIdeaDetailOpen}>
        <DialogContent className="max-w-2xl rounded-2xl bg-white p-0 dark:bg-gray-950">
          {selectedIdea ? (
            <div className="max-h-[85vh] overflow-y-auto">
              <DialogHeader className="border-b border-gray-100 px-6 py-5 text-left dark:border-gray-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      DIFFICULTY_STYLE[selectedIdea.difficulty].className
                    }`}
                  >
                    {getDifficultyLabel(selectedIdea.difficulty)}
                  </span>
                  <span className="text-xs text-gray-500">
                    เริ่มได้ใน {selectedIdea.timeToStart}
                  </span>
                </div>
                <DialogTitle className="text-xl text-[#0F172A] dark:text-white">
                  {selectedIdea.title}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {selectedIdea.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 px-6 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      รายได้ประเมิน
                    </p>
                    <p className="mt-1 text-base font-bold text-[#534AB7] dark:text-[#AFA9EC]">
                      {formatIncomeRange(selectedIdea)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      ทักษะที่เกี่ยวข้อง
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selectedIdea.skills.map((tag) => (
                        <span
                          key={`${selectedIdea.id}-detail-${tag}`}
                          className="rounded-md bg-white px-2 py-1 text-xs text-gray-600 ring-1 ring-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:ring-gray-800"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white">
                    เครื่องมือที่ต้องใช้
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedIdea.requiredTools.map((tool) => (
                      <span
                        key={`${selectedIdea.id}-tool-${tool}`}
                        className="rounded-full bg-[#EEEDFE] px-3 py-1 text-xs font-medium text-[#534AB7]"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedIdea.steps && selectedIdea.steps.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white">
                      วิธีเริ่มต้น
                    </h3>
                    <ol className="mt-3 space-y-2">
                      {selectedIdea.steps.map((step, index) => (
                        <li
                          key={`${selectedIdea.id}-step-${index}`}
                          className="flex gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7F77DD] text-xs font-semibold text-white">
                            {index + 1}
                          </span>
                          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                            {step}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}

                <div>
                  <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white">
                    แหล่งอ้างอิงและเครื่องมือเพิ่มเติม
                  </h3>
                  <div className="mt-3 space-y-2">
                    {selectedIdea.resources.map((resource) => (
                      <a
                        key={resource}
                        href={resource}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl border border-gray-100 px-4 py-3 text-sm text-[#534AB7] transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                      >
                        {resource}
                      </a>
                    ))}
                  </div>
                </div>

                {isIdeaDetailLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังโหลดรายละเอียดเพิ่มเติม...
                  </div>
                ) : null}

                {ideaDetailError ? (
                  <p className="text-sm text-red-500">{ideaDetailError}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
