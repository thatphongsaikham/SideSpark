import express, { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const router = express.Router()
type TransactionParams = { id: string }

// Apply auth middleware to all routes
router.use(authMiddleware)

// GET /api/transactions - Get all transactions for user
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!
    const { projectId, type, startDate, endDate, limit } = req.query

    const whereClause: any = { userId }

    if (projectId) {
      whereClause.projectId = projectId
    }

    if (type && ['income', 'expense'].includes(type as string)) {
      whereClause.type = type
    }

    if (startDate || endDate) {
      whereClause.date = {}
      if (startDate) {
        whereClause.date.gte = new Date(startDate as string)
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate as string)
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit as string) : undefined
    })

    res.json(transactions)
  } catch (error) {
    console.error('Get transactions error:', error)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

// GET /api/transactions/:id - Get single transaction
router.get('/:id', async (req: Request<TransactionParams>, res: Response) => {
  try {
    const { id } = req.params
    const { userId } = req.user!

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId // Ensure user can only access their own transactions
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    res.json(transaction)
  } catch (error) {
    console.error('Get transaction error:', error)
    res.status(500).json({ error: 'Failed to fetch transaction' })
  }
})

// POST /api/transactions - Create new transaction
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!
    const { projectId, type, amount, description, date } = req.body

    // Validation
    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Valid transaction type (income/expense) is required' })
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' })
    }

    // Verify project exists and belongs to user if projectId is provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId }
      })

      if (!project) {
        return res.status(400).json({ error: 'Invalid project' })
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        projectId: projectId || null,
        type,
        amount: Math.round(amount), // Store as integer (satang/cent)
        description: description || null,
        date: date ? new Date(date) : new Date()
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    res.status(201).json(transaction)
  } catch (error) {
    console.error('Create transaction error:', error)
    res.status(500).json({ error: 'Failed to create transaction' })
  }
})

// PUT /api/transactions/:id - Update transaction
router.put('/:id', async (req: Request<TransactionParams>, res: Response) => {
  try {
    const { id } = req.params
    const { userId } = req.user!
    const { projectId, type, amount, description, date } = req.body

    // Verify transaction belongs to user
    const existing = await prisma.transaction.findFirst({
      where: { id, userId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Validate updates
    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Invalid transaction type' })
    }

    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' })
    }

    // Verify project if projectId is being updated
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId }
      })

      if (!project) {
        return res.status(400).json({ error: 'Invalid project' })
      }
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        projectId: projectId !== undefined ? projectId : existing.projectId,
        type: type || existing.type,
        amount: amount !== undefined ? Math.round(amount) : existing.amount,
        description: description !== undefined ? description : existing.description,
        date: date ? new Date(date) : existing.date
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    res.json(transaction)
  } catch (error) {
    console.error('Update transaction error:', error)
    res.status(500).json({ error: 'Failed to update transaction' })
  }
})

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', async (req: Request<TransactionParams>, res: Response) => {
  try {
    const { id } = req.params
    const { userId } = req.user!

    // Verify transaction belongs to user
    const existing = await prisma.transaction.findFirst({
      where: { id, userId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    await prisma.transaction.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Delete transaction error:', error)
    res.status(500).json({ error: 'Failed to delete transaction' })
  }
})

// GET /api/transactions/summary/stats - Get summary statistics
router.get('/summary/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user!
    const { startDate, endDate } = req.query

    const whereClause: any = { userId }

    if (startDate || endDate) {
      whereClause.date = {}
      if (startDate) {
        whereClause.date.gte = new Date(startDate as string)
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate as string)
      }
    }

    // Get totals
    const [incomeResult, expenseResult, projectsResult] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...whereClause, type: 'income' },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: { ...whereClause, type: 'expense' },
        _sum: { amount: true }
      }),
      prisma.project.findMany({
        where: { userId, status: 'active' },
        select: {
          id: true,
          name: true,
          monthlyGoal: true
        }
      })
    ])

    const totalIncome = incomeResult._sum.amount || 0
    const totalExpense = expenseResult._sum.amount || 0
    const netProfit = totalIncome - totalExpense

    // Get income by project
    const incomeByProject = await prisma.transaction.groupBy({
      by: ['projectId'],
      where: { ...whereClause, type: 'income', projectId: { not: null } },
      _sum: { amount: true }
    })

    const incomeByProjectWithNames = await Promise.all(
      incomeByProject.map(async (item) => {
        if (!item.projectId) return null

        const project = await prisma.project.findUnique({
          where: { id: item.projectId },
          select: { name: true }
        })

        return {
          projectId: item.projectId,
          projectName: project?.name || 'Unknown',
          total: item._sum.amount || 0
        }
      })
    )

    // Get monthly data (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const monthlyData = await prisma.$queryRaw<Array<{
      month: string
      income: bigint
      expense: bigint
    }>>`
      SELECT
        TO_CHAR(date, 'YYYY-MM') as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE user_id = ${userId}
        AND date >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month ASC
    `

    const formattedMonthlyData = monthlyData.map(item => ({
      month: item.month,
      income: Number(item.income),
      expense: Number(item.expense),
      profit: Number(item.income) - Number(item.expense)
    }))

    // Calculate goals progress
    const goalsProgress = await Promise.all(
      projectsResult.map(async (project) => {
        const projectIncome = await prisma.transaction.aggregate({
          where: {
            projectId: project.id,
            type: 'income',
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          },
          _sum: { amount: true }
        })

        const current = projectIncome._sum.amount || 0
        const progress = project.monthlyGoal > 0 ? (current / project.monthlyGoal) * 100 : 0

        return {
          projectId: project.id,
          goal: project.monthlyGoal,
          current,
          progress: Math.min(100, Math.round(progress))
        }
      })
    )

    // Get completed milestones
    const completedMilestones = await prisma.milestone.count({
      where: {
        userId,
        achieved: true
      }
    })

    res.json({
      totalIncome,
      totalExpense,
      netProfit,
      incomeByProject: incomeByProjectWithNames.filter(Boolean),
      monthlyData: formattedMonthlyData,
      streak: 0, // TODO: Implement streak calculation
      milestonesCompleted: completedMilestones,
      goalsProgress
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Failed to fetch statistics' })
  }
})

export default router
