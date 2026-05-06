import express, { type Request, type RequestHandler, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

type MilestoneParams = { id: string }

export type MilestoneRecord = {
  id: string
  userId: string
  title: string
  description: string | null
  target: string
  achieved: boolean
  achievedAt: Date | null
  createdAt: Date
}

export type CreateMilestoneInput = {
  userId: string
  title: string
  description: string | null
  target: string
}

export type UpdateMilestoneInput = {
  title?: string
  description?: string | null
  target?: string
  achieved?: boolean
  achievedAt?: Date | null
}

export type MilestoneRepository = {
  listMilestones(userId: string): Promise<MilestoneRecord[]>
  createMilestone(data: CreateMilestoneInput): Promise<MilestoneRecord>
  updateMilestone(
    id: string,
    userId: string,
    data: UpdateMilestoneInput,
  ): Promise<MilestoneRecord | null>
  deleteMilestone(id: string, userId: string): Promise<boolean>
}

type MilestoneRouterDependencies = {
  authHandler: RequestHandler
  milestoneRepository: MilestoneRepository
}

const defaultMilestoneRepository: MilestoneRepository = {
  async listMilestones(userId) {
    return prisma.milestone.findMany({
      where: { userId },
      orderBy: [{ achieved: 'asc' }, { createdAt: 'asc' }],
    })
  },
  async createMilestone(data) {
    return prisma.milestone.create({
      data,
    })
  },
  async updateMilestone(id, userId, data) {
    const existing = await prisma.milestone.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return null
    }

    return prisma.milestone.update({
      where: { id },
      data,
    })
  },
  async deleteMilestone(id, userId) {
    const existing = await prisma.milestone.findFirst({
      where: { id, userId },
      select: { id: true },
    })

    if (!existing) {
      return false
    }

    await prisma.milestone.delete({
      where: { id },
    })

    return true
  },
}

function normalizeOptionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return undefined

  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : null
}

export function createMilestoneRouter(
  overrides: Partial<MilestoneRouterDependencies> = {},
) {
  const authHandler = overrides.authHandler ?? authMiddleware
  const milestoneRepository = {
    ...defaultMilestoneRepository,
    ...overrides.milestoneRepository,
  }
  const router = express.Router()

  router.use(authHandler)

  router.get('/', async (req: Request, res: Response) => {
    try {
      const { userId } = req.user!
      const milestones = await milestoneRepository.listMilestones(userId)

      res.json(milestones)
    } catch (error) {
      console.error('Get milestones error:', error)
      res.status(500).json({ error: 'Failed to fetch milestones' })
    }
  })

  router.post('/', async (req: Request, res: Response) => {
    try {
      const { userId } = req.user!
      const title =
        typeof req.body.title === 'string' ? req.body.title.trim() : ''
      const target =
        typeof req.body.target === 'string' ? req.body.target.trim() : ''
      const description = normalizeOptionalText(req.body.description) ?? null

      if (!title || !target) {
        return res
          .status(400)
          .json({ error: 'Milestone title and target are required' })
      }

      const milestone = await milestoneRepository.createMilestone({
        userId,
        title,
        target,
        description,
      })

      res.status(201).json(milestone)
    } catch (error) {
      console.error('Create milestone error:', error)
      res.status(500).json({ error: 'Failed to create milestone' })
    }
  })

  router.put('/:id', async (req: Request<MilestoneParams>, res: Response) => {
    try {
      const { id } = req.params
      const { userId } = req.user!
      const updates: UpdateMilestoneInput = {}

      if (req.body.title !== undefined) {
        const title =
          typeof req.body.title === 'string' ? req.body.title.trim() : ''

        if (!title) {
          return res.status(400).json({ error: 'Milestone title cannot be empty' })
        }

        updates.title = title
      }

      if (req.body.target !== undefined) {
        const target =
          typeof req.body.target === 'string' ? req.body.target.trim() : ''

        if (!target) {
          return res
            .status(400)
            .json({ error: 'Milestone target cannot be empty' })
        }

        updates.target = target
      }

      if (req.body.description !== undefined) {
        updates.description = normalizeOptionalText(req.body.description) ?? null
      }

      if (typeof req.body.achieved === 'boolean') {
        updates.achieved = req.body.achieved
        updates.achievedAt = req.body.achieved ? new Date() : null
      }

      const milestone = await milestoneRepository.updateMilestone(
        id,
        userId,
        updates,
      )

      if (!milestone) {
        return res.status(404).json({ error: 'Milestone not found' })
      }

      res.json(milestone)
    } catch (error) {
      console.error('Update milestone error:', error)
      res.status(500).json({ error: 'Failed to update milestone' })
    }
  })

  router.delete('/:id', async (req: Request<MilestoneParams>, res: Response) => {
    try {
      const { id } = req.params
      const { userId } = req.user!
      const deleted = await milestoneRepository.deleteMilestone(id, userId)

      if (!deleted) {
        return res.status(404).json({ error: 'Milestone not found' })
      }

      res.status(204).send()
    } catch (error) {
      console.error('Delete milestone error:', error)
      res.status(500).json({ error: 'Failed to delete milestone' })
    }
  })

  return router
}

export default createMilestoneRouter()
