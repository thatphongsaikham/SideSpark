import express from 'express'
import skillRoutes from './skills'
import projectRoutes from './projects'
import transactionRoutes from './transactions'
import userRoutes from './users'
import ideaRoutes from './ideas'
import authRoutes from './auth'
import milestoneRoutes from './milestones'

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/skills', skillRoutes)
router.use('/projects', projectRoutes)
router.use('/transactions', transactionRoutes)
router.use('/milestones', milestoneRoutes)
router.use('/ideas', ideaRoutes)
router.use('/users', userRoutes) // Users routes last

export default router
