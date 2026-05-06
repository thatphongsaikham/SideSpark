import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import {
  createMilestoneRouter,
  type MilestoneRepository,
} from '@/routes/milestones'

function createMilestoneRecord(
  overrides: Partial<{
    id: string
    userId: string
    title: string
    description: string | null
    target: string
    achieved: boolean
    achievedAt: Date | null
    createdAt: Date
  }> = {},
) {
  return {
    id: 'milestone-1',
    userId: 'user-1',
    title: 'First 1000 THB',
    description: 'Focus on the first sale',
    target: 'Earn 1000 THB in the first month',
    achieved: false,
    achievedAt: null,
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    ...overrides,
  }
}

function createMilestoneRepositoryMock(
  overrides: Partial<MilestoneRepository> = {},
): MilestoneRepository {
  return {
    listMilestones: vi.fn().mockResolvedValue([]),
    createMilestone: vi.fn().mockResolvedValue(createMilestoneRecord()),
    updateMilestone: vi.fn().mockResolvedValue(createMilestoneRecord()),
    deleteMilestone: vi.fn().mockResolvedValue(true),
    ...overrides,
  }
}

function createTestApp(
  milestoneRepository: Partial<MilestoneRepository> = {},
) {
  const repository = createMilestoneRepositoryMock(milestoneRepository)
  const app = express()

  app.use(express.json())
  app.use(
    '/api/milestones',
    createMilestoneRouter({
      milestoneRepository: repository,
      authHandler(req, _res, next) {
        req.user = {
          userId: 'user-1',
          email: 'test@example.com',
          username: 'testuser',
        }
        next()
      },
    }),
  )

  return {
    app,
    repository,
  }
}

describe('milestones route unit tests', () => {
  it('lists the current user milestones through the injected repository', async () => {
    const records = [
      createMilestoneRecord(),
      createMilestoneRecord({
        id: 'milestone-2',
        title: 'Repeat client',
      }),
    ]
    const { app, repository } = createTestApp({
      listMilestones: vi.fn().mockResolvedValue(records),
    })

    const response = await request(app).get('/api/milestones')

    expect(response.status).toBe(200)
    expect(repository.listMilestones).toHaveBeenCalledWith('user-1')
    expect(response.body).toHaveLength(2)
    expect(response.body[0]).toMatchObject({
      id: 'milestone-1',
      title: 'First 1000 THB',
    })
  })

  it('rejects invalid create input before touching the repository', async () => {
    const { app, repository } = createTestApp()

    const response = await request(app).post('/api/milestones').send({
      title: '',
      target: '',
    })

    expect(response.status).toBe(400)
    expect(repository.createMilestone).not.toHaveBeenCalled()
  })

  it('creates a milestone for the authenticated user', async () => {
    const { app, repository } = createTestApp()

    const response = await request(app).post('/api/milestones').send({
      title: 'First review',
      description: 'Ask for a review after delivery',
      target: 'Receive one client review this month',
    })

    expect(response.status).toBe(201)
    expect(repository.createMilestone).toHaveBeenCalledWith({
      userId: 'user-1',
      title: 'First review',
      description: 'Ask for a review after delivery',
      target: 'Receive one client review this month',
    })
  })

  it('marks a milestone as achieved and stores the achieved timestamp', async () => {
    const { app, repository } = createTestApp({
      updateMilestone: vi.fn().mockResolvedValue(
        createMilestoneRecord({
          achieved: true,
          achievedAt: new Date('2026-04-20T00:00:00.000Z'),
        }),
      ),
    })

    const response = await request(app)
      .put('/api/milestones/milestone-1')
      .send({
        achieved: true,
      })

    expect(response.status).toBe(200)
    expect(repository.updateMilestone).toHaveBeenCalledWith(
      'milestone-1',
      'user-1',
      expect.objectContaining({
        achieved: true,
        achievedAt: expect.any(Date),
      }),
    )
  })

  it('returns 404 when deleting a milestone that does not belong to the user', async () => {
    const { app, repository } = createTestApp({
      deleteMilestone: vi.fn().mockResolvedValue(false),
    })

    const response = await request(app).delete('/api/milestones/missing-id')

    expect(response.status).toBe(404)
    expect(repository.deleteMilestone).toHaveBeenCalledWith(
      'missing-id',
      'user-1',
    )
  })
})
