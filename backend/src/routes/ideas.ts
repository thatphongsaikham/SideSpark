import express, { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { optionalAuthMiddleware } from '../middleware/auth'

const router = express.Router()
type IdeaParams = { id: string }

const DIFFICULTY_RANK: Record<string, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
}

function getSingleQueryValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    return trimmedValue.length > 0 ? trimmedValue : undefined
  }

  return undefined
}

function normalizeSkillName(value: string): string {
  return value.trim().toLowerCase()
}

function parseSkillQuery(value: unknown): string[] {
  const rawValues = Array.isArray(value) ? value : value ? [value] : []

  return rawValues
    .flatMap((entry) => String(entry).split(','))
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

function getMatchedSkills(ideaSkills: string[], targetSkills: string[]): string[] {
  const normalizedTargetSkills = new Map(
    targetSkills.map((skill) => [normalizeSkillName(skill), skill] as const)
  )

  return ideaSkills
    .filter((skill) => normalizedTargetSkills.has(normalizeSkillName(skill)))
    .map((skill) => normalizedTargetSkills.get(normalizeSkillName(skill)) ?? skill)
}

// GET /api/ideas - Get side hustle ideas (public endpoint)
router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const requestedSkills = parseSkillQuery(req.query.skills)
    const difficulty = getSingleQueryValue(req.query.difficulty)
    const hasExplicitSkills = requestedSkills.length > 0

    let activeSkills = requestedSkills
    let recommendationSource: 'query' | 'saved-skills' | 'all' = hasExplicitSkills ? 'query' : 'all'

    if (!hasExplicitSkills && req.user) {
      const userSkills = await prisma.userSkill.findMany({
        where: { userId: req.user.userId },
        include: { skill: true },
      })

      activeSkills = userSkills.map((userSkill) => userSkill.skill.name)

      if (activeSkills.length > 0) {
        recommendationSource = 'saved-skills'
      }
    }

    const whereClause: {
      skills?: { hasSome: string[] }
      difficulty?: string
    } = {}

    if (activeSkills.length > 0) {
      whereClause.skills = {
        hasSome: activeSkills,
      }
    }

    if (difficulty) {
      whereClause.difficulty = difficulty
    }

    const ideas = await prisma.idea.findMany({
      where: whereClause,
      orderBy: [{ estimatedIncomeMin: 'desc' }],
    })

    const formattedIdeas = ideas
      .map((idea) => {
        const matchedSkills = getMatchedSkills(idea.skills, activeSkills)

        return {
          id: idea.id,
          title: idea.title,
          description: idea.description,
          skills: idea.skills,
          difficulty: idea.difficulty,
          estimatedIncome: {
            min: idea.estimatedIncomeMin,
            max: idea.estimatedIncomeMax,
            unit: idea.incomeUnit,
          },
          timeToStart: idea.timeToStart,
          requiredTools: idea.requiredTools,
          resources: idea.resources,
          matchedSkills,
          matchCount: matchedSkills.length,
          recommendationSource,
        }
      })
      .sort((left, right) => {
        if (right.matchCount !== left.matchCount) {
          return right.matchCount - left.matchCount
        }

        const difficultyDelta =
          (DIFFICULTY_RANK[left.difficulty] ?? Number.MAX_SAFE_INTEGER) -
          (DIFFICULTY_RANK[right.difficulty] ?? Number.MAX_SAFE_INTEGER)

        if (difficultyDelta !== 0) {
          return difficultyDelta
        }

        return right.estimatedIncome.min - left.estimatedIncome.min
      })

    res.json(formattedIdeas)
  } catch (error) {
    console.error('Get ideas error:', error)
    res.status(500).json({ error: 'Failed to fetch ideas' })
  }
})

// GET /api/ideas/:id - Get idea by ID with steps
router.get('/:id', async (req: Request<IdeaParams>, res: Response) => {
  try {
    const { id } = req.params

    const idea = await prisma.idea.findUnique({
      where: { id }
    })

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' })
    }

    // Format response
    const formattedIdea = {
      id: idea.id,
      title: idea.title,
      description: idea.description,
      skills: idea.skills,
      difficulty: idea.difficulty,
      estimatedIncome: {
        min: idea.estimatedIncomeMin,
        max: idea.estimatedIncomeMax,
        unit: idea.incomeUnit
      },
      timeToStart: idea.timeToStart,
      requiredTools: idea.requiredTools,
      resources: idea.resources,
      steps: idea.steps
    }

    res.json(formattedIdea)
  } catch (error) {
    console.error('Get idea error:', error)
    res.status(500).json({ error: 'Failed to fetch idea' })
  }
})

export default router
