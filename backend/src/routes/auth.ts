import express, { Request, Response } from 'express'
import {
  generateRefreshToken,
  generateToken,
  getRefreshTokenExpiry,
  hashPassword,
  verifyPassword,
  verifyRefreshToken,
  verifyToken,
} from '../lib/auth'
import { prisma } from '../lib/prisma'

type AuthUserRecord = {
  id: string
  username: string
  email: string
  name: string | null
  password: string | null
}

type CurrentUserRecord = {
  id: string
  username: string
  email: string
  name: string | null
  createdAt: Date
}

type StoredRefreshTokenRecord = {
  id: string
  expiresAt: Date
  user: {
    id: string
    email: string
    username: string
    name: string | null
  }
}

type AccessTokenPayload = {
  userId: string
  email: string
  username: string
}

type RefreshTokenPayload = {
  userId: string
}

type VerifiedTokenPayload = {
  userId: string
}

export type AuthRepository = {
  findUserByUsername(username: string): Promise<AuthUserRecord | null>
  findUserByEmail(email: string): Promise<AuthUserRecord | null>
  createUser(data: {
    username: string
    email: string
    password: string
    name: string
  }): Promise<void>
  createRefreshToken(data: {
    token: string
    userId: string
    expiresAt: Date
  }): Promise<void>
  findRefreshTokenWithUser(token: string): Promise<StoredRefreshTokenRecord | null>
  deleteRefreshTokenById(id: string): Promise<void>
  deleteRefreshTokensByToken(token: string): Promise<void>
  findCurrentUser(id: string): Promise<CurrentUserRecord | null>
}

export type AuthUtilities = {
  hashPassword(password: string): Promise<string>
  verifyPassword(password: string, hash: string): Promise<boolean>
  generateToken(payload: AccessTokenPayload): string
  generateRefreshToken(payload: RefreshTokenPayload): string
  verifyToken(token: string): VerifiedTokenPayload | null
  verifyRefreshToken(token: string): VerifiedTokenPayload | null
  getRefreshTokenExpiry(): Date
}

type AuthRouterDependencies = {
  authRepository: AuthRepository
  authUtilities: AuthUtilities
}

const defaultAuthRepository: AuthRepository = {
  async findUserByUsername(username) {
    return prisma.user.findUnique({
      where: { username },
    })
  },
  async findUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    })
  },
  async createUser(data) {
    await prisma.user.create({
      data,
    })
  },
  async createRefreshToken(data) {
    await prisma.refreshToken.create({
      data,
    })
  },
  async findRefreshTokenWithUser(token) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    })
  },
  async deleteRefreshTokenById(id) {
    await prisma.refreshToken.delete({
      where: { id },
    })
  },
  async deleteRefreshTokensByToken(token) {
    await prisma.refreshToken.deleteMany({
      where: { token },
    })
  },
  async findCurrentUser(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })
  },
}

const defaultAuthUtilities: AuthUtilities = {
  hashPassword,
  verifyPassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
}

export function createAuthRouter(
  overrides: Partial<AuthRouterDependencies> = {},
) {
  const authRepository: AuthRepository = {
    ...defaultAuthRepository,
    ...overrides.authRepository,
  }
  const authUtilities: AuthUtilities = {
    ...defaultAuthUtilities,
    ...overrides.authUtilities,
  }

  const router = express.Router()

  /**
   * POST /api/auth/register
   * Register a new user
   */
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const { username, email, password, confirmPassword } = req.body

      if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({ error: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเนเธญเธกเธนเธฅเนเธซเนเธเธฃเธ' })
      }

      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ error: 'เธเธทเนเธญเธเธนเนเนเธเนเธ•เนเธญเธเธกเธตเธเธงเธฒเธกเธขเธฒเธง 3-20 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ' })
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'เธฃเธนเธเนเธเธเธญเธตเน€เธกเธฅเนเธกเนเธ–เธนเธเธ•เนเธญเธ' })
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'เธฃเธซเธฑเธชเธเนเธฒเธเธ•เนเธญเธเธกเธตเธญเธขเนเธฒเธเธเนเธญเธข 8 เธ•เธฑเธงเธญเธฑเธเธฉเธฃ' })
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'เธฃเธซเธฑเธชเธเนเธฒเธเนเธกเนเธ•เธฃเธเธเธฑเธ' })
      }

      const existingUsername = await authRepository.findUserByUsername(username)

      if (existingUsername) {
        return res.status(400).json({ error: 'เธเธทเนเธญเธเธนเนเนเธเนเธเธตเนเธ–เธนเธเนเธเนเนเธฅเนเธง' })
      }

      const existingEmail = await authRepository.findUserByEmail(email)

      if (existingEmail) {
        return res.status(400).json({ error: 'เธญเธตเน€เธกเธฅเธเธตเนเธ–เธนเธเนเธเนเนเธฅเนเธง' })
      }

      const hashedPassword = await authUtilities.hashPassword(password)

      await authRepository.createUser({
        username,
        email,
        password: hashedPassword,
        name: username,
      })

      res.status(201).json({
        message: 'เธชเธกเธฑเธเธฃเธชเธกเธฒเธเธดเธเธชเธณเน€เธฃเนเธ',
        email,
        username,
      })
    } catch (error) {
      console.error('Register error:', error)
      res.status(500).json({ error: 'เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ” เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเน' })
    }
  })

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: 'เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธญเธตเน€เธกเธฅเนเธฅเธฐเธฃเธซเธฑเธชเธเนเธฒเธ' })
      }

      const user = await authRepository.findUserByEmail(email)

      if (!user) {
        return res.status(401).json({ error: 'เธญเธตเน€เธกเธฅเธซเธฃเธทเธญเธฃเธซเธฑเธชเธเนเธฒเธเนเธกเนเธ–เธนเธเธ•เนเธญเธ' })
      }

      if (!user.password) {
        return res.status(401).json({
          error: 'เธเธฑเธเธเธตเธเธตเนเนเธกเนเนเธ”เนเธ•เธฑเนเธเธฃเธซเธฑเธชเธเนเธฒเธ',
        })
      }

      const isPasswordValid = await authUtilities.verifyPassword(password, user.password)

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'เธญเธตเน€เธกเธฅเธซเธฃเธทเธญเธฃเธซเธฑเธชเธเนเธฒเธเนเธกเนเธ–เธนเธเธ•เนเธญเธ' })
      }

      const accessToken = authUtilities.generateToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      })

      const refreshTokenValue = authUtilities.generateRefreshToken({ userId: user.id })

      await authRepository.createRefreshToken({
        token: refreshTokenValue,
        userId: user.id,
        expiresAt: authUtilities.getRefreshTokenExpiry(),
      })

      res.status(200).json({
        accessToken,
        refreshToken: refreshTokenValue,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
        },
      })
    } catch (error) {
      console.error('Login error:', error)
      res.status(500).json({ error: 'เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ” เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเน' })
    }
  })

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(400).json({ error: 'เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธ refresh token' })
      }

      const decoded = authUtilities.verifyRefreshToken(refreshToken)

      if (!decoded) {
        return res.status(401).json({ error: 'Refresh token เนเธกเนเธ–เธนเธเธ•เนเธญเธ' })
      }

      const storedToken = await authRepository.findRefreshTokenWithUser(refreshToken)

      if (!storedToken) {
        return res.status(401).json({ error: 'Refresh token เนเธกเนเธ–เธนเธเธ•เนเธญเธ' })
      }

      if (storedToken.expiresAt < new Date()) {
        await authRepository.deleteRefreshTokenById(storedToken.id)
        return res.status(401).json({ error: 'Refresh token เธซเธกเธ”เธญเธฒเธขเธธ' })
      }

      const accessToken = authUtilities.generateToken({
        userId: storedToken.user.id,
        email: storedToken.user.email,
        username: storedToken.user.username,
      })

      res.status(200).json({ accessToken })
    } catch (error) {
      console.error('Refresh token error:', error)
      res.status(500).json({ error: 'เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ” เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเน' })
    }
  })

  /**
   * POST /api/auth/logout
   * Logout by invalidating refresh token
   */
  router.post('/logout', async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(400).json({ error: 'เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธ refresh token' })
      }

      await authRepository.deleteRefreshTokensByToken(refreshToken)

      res.status(200).json({ message: 'เธญเธญเธเธเธฒเธเธฃเธฐเธเธเธชเธณเน€เธฃเนเธ' })
    } catch (error) {
      console.error('Logout error:', error)
      res.status(500).json({ error: 'เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ” เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเน' })
    }
  })

  /**
   * GET /api/auth/me
   * Get current user info (requires auth)
   */
  router.get('/me', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'เนเธกเนเนเธ”เนเธฃเธฑเธเธญเธเธธเธเธฒเธ•' })
      }

      const token = authHeader.substring(7)
      const decoded = authUtilities.verifyToken(token)

      if (!decoded) {
        return res.status(401).json({ error: 'Token เนเธกเนเธ–เธนเธเธ•เนเธญเธ' })
      }

      const user = await authRepository.findCurrentUser(decoded.userId)

      if (!user) {
        return res.status(404).json({ error: 'เนเธกเนเธเธเธเธนเนเนเธเน' })
      }

      res.status(200).json({ user })
    } catch (error) {
      console.error('Get user error:', error)
      res.status(500).json({ error: 'เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ” เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเน' })
    }
  })

  return router
}

export default createAuthRouter()
