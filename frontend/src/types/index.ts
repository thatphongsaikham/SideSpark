// Common types
export interface User {
  id: string
  username: string
  email: string
  name: string | null
  emailVerified: Date | null
  createdAt: Date
}

export interface Project {
  id: string
  userId: string
  name: string
  description: string | null
  initialCost: number
  monthlyGoal: number
  status: 'active' | 'paused' | 'completed'
  createdAt: Date
  updatedAt: Date
  tasks: Task[]
  progress?: {
    totalTasks: number
    completedTasks: number
    percentage: number
  }
}

export interface Task {
  id: string
  projectId: string
  text: string
  completed: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  userId: string
  projectId: string | null
  type: 'income' | 'expense'
  amount: number
  description: string | null
  date: Date
  createdAt: Date
  project?: {
    id: string
    name: string
  }
}

export interface Skill {
  id: string
  name: string
  nameEn: string | null
  category: string | null
}

export interface SearchableSkill extends Skill {
  isSelected: boolean
}

export interface UserSkill extends Skill {
  userSkillId: string
  addedAt: Date
}

export interface SkillSearchResponse {
  skills: SearchableSkill[]
  userSkills: UserSkill[]
}

export interface Idea {
  id: string
  title: string
  description: string
  skills: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedIncome: {
    min: number
    max: number
    unit: string
  }
  timeToStart: string
  requiredTools: string[]
  resources: string[]
  steps?: string[]
}

export interface IdeaRecommendation extends Idea {
  matchedSkills: string[]
  matchCount: number
  recommendationSource: 'query' | 'saved-skills' | 'all'
}

export interface Milestone {
  id: string
  userId: string
  title: string
  description: string | null
  target: string
  achieved: boolean
  achievedAt: Date | null
  createdAt: Date
}

export interface Statistics {
  totalIncome: number
  totalExpense: number
  netProfit: number
  incomeByProject: Array<{
    projectId: string
    projectName: string
    total: number
  }>
  monthlyData: Array<{
    month: string
    income: number
    expense: number
    profit: number
  }>
  streak: number
  milestonesCompleted: number
  goalsProgress: Array<{
    projectId: string
    goal: number
    current: number
    progress: number
  }>
}

export interface ApiResponse<T> {
  data: T
  error?: string
  message?: string
}
