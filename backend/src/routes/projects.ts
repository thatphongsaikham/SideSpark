import express, { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()
type ProjectParams = { id: string }
type ProjectTaskParams = { id: string; taskId: string }

// Apply auth middleware to all routes
router.use(authMiddleware)

// GET /api/projects - Get all projects for authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!
    const { status } = req.query

    const whereClause: any = { userId }
    if (status) {
      whereClause.status = status
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        tasks: {
          orderBy: { order: 'asc' }
        },
        transactions: {
          take: 5,
          orderBy: { date: 'desc' }
        },
        _count: {
          select: {
            tasks: true,
            transactions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate progress for each project
    const projectsWithProgress = projects.map(project => {
      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter(t => t.completed).length
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      return {
        ...project,
        progress: {
          totalTasks,
          completedTasks,
          percentage: Math.round(progress)
        }
      }
    })

    res.json(projectsWithProgress)
  } catch (error) {
    console.error('Get projects error:', error)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// GET /api/projects/:id - Get single project with details
router.get('/:id', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id } = req.params
    const { userId } = req.user!

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId // Ensure user can only access their own projects
      },
      include: {
        tasks: {
          orderBy: { order: 'asc' }
        },
        transactions: {
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter(t => t.completed).length
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    res.json({
      ...project,
      progress: {
        totalTasks,
        completedTasks,
        percentage: Math.round(progress)
      }
    })
  } catch (error) {
    console.error('Get project error:', error)
    res.status(500).json({ error: 'Failed to fetch project' })
  }
})

// POST /api/projects - Create new project
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!
    const { name, description, initialCost, monthlyGoal, tasks } = req.body

    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' })
    }

    if (initialCost !== undefined && initialCost < 0) {
      return res.status(400).json({ error: 'Initial cost cannot be negative' })
    }

    if (monthlyGoal !== undefined && monthlyGoal < 0) {
      return res.status(400).json({ error: 'Monthly goal cannot be negative' })
    }

    const project = await prisma.project.create({
      data: {
        userId,
        name,
        description: description || null,
        initialCost: initialCost || 0,
        monthlyGoal: monthlyGoal || 0,
        status: 'active',
        tasks: tasks ? {
          create: tasks.map((t: string, index: number) => ({
            text: t,
            completed: false,
            order: index
          }))
        } : undefined
      },
      include: {
        tasks: true
      }
    })

    res.status(201).json(project)
  } catch (error) {
    console.error('Create project error:', error)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

// PUT /api/projects/:id - Update project
router.put('/:id', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id } = req.params
    const { userId } = req.user!
    const updates = req.body

    // Verify project belongs to user
    const existing = await prisma.project.findFirst({
      where: { id, userId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Validate updates
    if (updates.status && !['active', 'paused', 'completed'].includes(updates.status)) {
      return res.status(400).json({ error: 'Invalid status value' })
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: updates.name,
        description: updates.description,
        initialCost: updates.initialCost,
        monthlyGoal: updates.monthlyGoal,
        status: updates.status
      }
    })

    res.json(project)
  } catch (error) {
    console.error('Update project error:', error)
    res.status(500).json({ error: 'Failed to update project' })
  }
})

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id } = req.params
    const { userId } = req.user!

    // Verify project belongs to user
    const existing = await prisma.project.findFirst({
      where: { id, userId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Delete project (cascade will handle tasks and transactions)
    await prisma.project.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete project error:', error)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

// Task-specific routes
// POST /api/projects/:id/tasks - Add task to project
router.post('/:id/tasks', async (req: Request<ProjectParams>, res: Response) => {
  try {
    const { id } = req.params
    const { userId } = req.user!
    const { text, order } = req.body

    // Verify project exists and belongs to user
    const project = await prisma.project.findFirst({
      where: { id, userId }
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (!text) {
      return res.status(400).json({ error: 'Task text is required' })
    }

    // Get max order for this project
    const maxOrder = await prisma.task.findFirst({
      where: { projectId: id },
      orderBy: { order: 'desc' }
    })

    const task = await prisma.task.create({
      data: {
        projectId: id,
        text,
        completed: false,
        order: order !== undefined ? order : (maxOrder?.order ?? -1) + 1
      }
    })

    res.status(201).json(task)
  } catch (error) {
    console.error('Create task error:', error)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

// PUT /api/projects/:id/tasks/:taskId - Update task
router.put('/:id/tasks/:taskId', async (req: Request<ProjectTaskParams>, res: Response) => {
  try {
    const { taskId } = req.params
    const { userId } = req.user!
    const { completed, text, order } = req.body

    // Verify task belongs to user's project
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: { userId }
      }
    })

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        completed: completed !== undefined ? completed : task.completed,
        text: text !== undefined ? text : task.text,
        order: order !== undefined ? order : task.order
      }
    })

    res.json(updatedTask)
  } catch (error) {
    console.error('Update task error:', error)
    res.status(500).json({ error: 'Failed to update task' })
  }
})

// DELETE /api/projects/:id/tasks/:taskId - Delete task
router.delete('/:id/tasks/:taskId', async (req: Request<ProjectTaskParams>, res: Response) => {
  try {
    const { taskId } = req.params
    const { userId } = req.user!

    // Verify task belongs to user's project
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: { userId }
      }
    })

    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    await prisma.task.delete({
      where: { id: taskId }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete task error:', error)
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

export default router
