import express, { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth'

const router = express.Router()
type SkillParams = { id: string }

function getSingleQueryValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    return trimmedValue.length > 0 ? trimmedValue : undefined
  }

  return undefined
}

// GET /api/skills - Get all skills (public endpoint)
router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const category = getSingleQueryValue(req.query.category)
    const searchQuery = getSingleQueryValue(req.query.q)

    const whereClause: {
      category?: string
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        nameEn?: { contains: string; mode: 'insensitive' }
      }>
    } = {}

    if (category) {
      whereClause.category = category
    }

    if (searchQuery) {
      whereClause.OR = [
        {
          name: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        {
          nameEn: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
      ]
    }

    // If user is authenticated, include their skills and selection state
    let userSkillRecords: Array<{
      id: string
      createdAt: Date
      skillId: string
      skill: {
        id: string
        name: string
        nameEn: string | null
        category: string | null
      }
    }> = []

    if (req.user) {
      userSkillRecords = await prisma.userSkill.findMany({
        where: { userId: req.user.userId },
        include: { skill: true },
      })
    }

    const selectedSkillIds = new Set(userSkillRecords.map((userSkill) => userSkill.skillId))

    const skills = await prisma.skill.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    })

    const skillsWithSelectionState = skills.map((skill) => ({
      ...skill,
      isSelected: selectedSkillIds.has(skill.id),
    }))

    const userSkills = userSkillRecords.map((userSkill) => ({
      ...userSkill.skill,
      userSkillId: userSkill.id,
      addedAt: userSkill.createdAt,
    }))

    res.json({
      skills: skillsWithSelectionState,
      userSkills,
    })
  } catch (error) {
    console.error('Get skills error:', error)
    res.status(500).json({ error: 'Failed to fetch skills' })
  }
})

// GET /api/skills/:id - Get skill by ID
router.get('/:id', async (req: Request<SkillParams>, res: Response) => {
  try {
    const { id } = req.params

    const skill = await prisma.skill.findUnique({
      where: { id }
    })

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' })
    }

    res.json(skill)
  } catch (error) {
    console.error('Get skill error:', error)
    res.status(500).json({ error: 'Failed to fetch skill' })
  }
})

// POST /api/skills/:id/add - Add skill to user's profile
router.post('/:id/add', authMiddleware, async (req: Request<SkillParams>, res: Response) => {
  try {
    const { id } = req.params
    const { userId } = req.user!

    // Verify skill exists
    const skill = await prisma.skill.findUnique({
      where: { id }
    })

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' })
    }

    // Check if already added
    const existing = await prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId: id
        }
      }
    })

    if (existing) {
      return res.status(400).json({ error: 'Skill already added' })
    }

    const userSkill = await prisma.userSkill.create({
      data: {
        userId,
        skillId: id
      },
      include: {
        skill: true
      }
    })

    res.status(201).json(userSkill)
  } catch (error) {
    console.error('Add skill error:', error)
    res.status(500).json({ error: 'Failed to add skill' })
  }
})

// DELETE /api/skills/:id/remove - Remove skill from user's profile
router.delete('/:id/remove', authMiddleware, async (req: Request<SkillParams>, res: Response) => {
  try {
    const { id } = req.params
    const { userId } = req.user!

    // Verify user has this skill
    const existing = await prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId: id
        }
      }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Skill not found in your profile' })
    }

    await prisma.userSkill.delete({
      where: { id: existing.id }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Remove skill error:', error)
    res.status(500).json({ error: 'Failed to remove skill' })
  }
})

export default router
