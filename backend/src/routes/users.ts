import express, { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()
type UserParams = { id: string }

// Apply auth middleware to all routes
router.use(authMiddleware)

// GET /api/users/me - Get current user's profile
router.get('/me', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
        skills: {
          include: {
            skill: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        _count: {
          select: {
            projects: true,
            transactions: true,
            milestones: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to fetch user profile' })
  }
})

// PUT /api/users/me - Update current user's profile
router.put('/me', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!
    const { name } = req.body

    // Validation
    if (name && name.length > 100) {
      return res.status(400).json({ error: 'Name is too long' })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    res.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Failed to update user profile' })
  }
})

// GET /api/users/:id - Get user by ID (public profile)
router.get('/:id', async (req: Request<UserParams>, res: Response) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true,
        skills: {
          include: {
            skill: true
          }
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            projects: true,
            transactions: true,
            milestones: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get user by ID error:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

export default router
