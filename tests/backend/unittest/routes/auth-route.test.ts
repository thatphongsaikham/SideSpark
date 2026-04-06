import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import {
  createAuthRouter,
  type AuthRepository,
  type AuthUtilities,
} from '@/routes/auth'

function createTestUser(overrides: Partial<{
  id: string
  username: string
  email: string
  name: string | null
  password: string | null
}> = {}) {
  return {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed-password',
    ...overrides,
  }
}

function createCurrentUser(overrides: Partial<{
  id: string
  username: string
  email: string
  name: string | null
  createdAt: Date
}> = {}) {
  return {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date('2026-04-07T00:00:00.000Z'),
    ...overrides,
  }
}

function createStoredRefreshToken(overrides: Partial<{
  id: string
  expiresAt: Date
  user: {
    id: string
    email: string
    username: string
    name: string | null
  }
}> = {}) {
  return {
    id: 'refresh-token-1',
    expiresAt: new Date('2030-01-01T00:00:00.000Z'),
    user: {
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
    },
    ...overrides,
  }
}

function createAuthRepositoryMock(
  overrides: Partial<AuthRepository> = {},
): AuthRepository {
  return {
    findUserByUsername: vi.fn().mockResolvedValue(null),
    findUserByEmail: vi.fn().mockResolvedValue(null),
    createUser: vi.fn().mockResolvedValue(undefined),
    createRefreshToken: vi.fn().mockResolvedValue(undefined),
    findRefreshTokenWithUser: vi.fn().mockResolvedValue(null),
    deleteRefreshTokenById: vi.fn().mockResolvedValue(undefined),
    deleteRefreshTokensByToken: vi.fn().mockResolvedValue(undefined),
    findCurrentUser: vi.fn().mockResolvedValue(null),
    ...overrides,
  }
}

function createAuthUtilitiesMock(
  overrides: Partial<AuthUtilities> = {},
): AuthUtilities {
  return {
    hashPassword: vi.fn().mockResolvedValue('hashed-password'),
    verifyPassword: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockReturnValue('access-token'),
    generateRefreshToken: vi.fn().mockReturnValue('refresh-token'),
    verifyToken: vi.fn().mockReturnValue({ userId: 'user-1' }),
    verifyRefreshToken: vi.fn().mockReturnValue({ userId: 'user-1' }),
    getRefreshTokenExpiry: vi
      .fn()
      .mockReturnValue(new Date('2030-01-01T00:00:00.000Z')),
    ...overrides,
  }
}

function createTestApp(options: {
  authRepository?: Partial<AuthRepository>
  authUtilities?: Partial<AuthUtilities>
} = {}) {
  const authRepository = createAuthRepositoryMock(options.authRepository)
  const authUtilities = createAuthUtilitiesMock(options.authUtilities)
  const app = express()

  app.use(express.json())
  app.use(
    '/api/auth',
    createAuthRouter({
      authRepository,
      authUtilities,
    }),
  )

  return {
    app,
    authRepository,
    authUtilities,
  }
}

describe('auth route unit tests', () => {
  it('rejects invalid register input before touching the repository', async () => {
    const { app, authRepository } = createTestApp()

    const response = await request(app).post('/api/auth/register').send({
      username: 'testuser',
      email: 'invalid-email',
      password: 'password123',
      confirmPassword: 'password123',
    })

    expect(response.status).toBe(400)
    expect(authRepository.findUserByUsername).not.toHaveBeenCalled()
    expect(authRepository.findUserByEmail).not.toHaveBeenCalled()
    expect(authRepository.createUser).not.toHaveBeenCalled()
  })

  it('returns duplicate username error without checking email', async () => {
    const { app, authRepository } = createTestApp({
      authRepository: {
        findUserByUsername: vi.fn().mockResolvedValue(createTestUser()),
      },
    })

    const response = await request(app).post('/api/auth/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    })

    expect(response.status).toBe(400)
    expect(authRepository.findUserByUsername).toHaveBeenCalledWith('testuser')
    expect(authRepository.findUserByEmail).not.toHaveBeenCalled()
    expect(authRepository.createUser).not.toHaveBeenCalled()
  })

  it('logs in with injected auth helpers and stores the refresh token', async () => {
    const expiry = new Date('2030-01-01T00:00:00.000Z')
    const { app, authRepository, authUtilities } = createTestApp({
      authRepository: {
        findUserByEmail: vi.fn().mockResolvedValue(createTestUser()),
      },
      authUtilities: {
        getRefreshTokenExpiry: vi.fn().mockReturnValue(expiry),
      },
    })

    const response = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(response.status).toBe(200)
    expect(authUtilities.verifyPassword).toHaveBeenCalledWith(
      'password123',
      'hashed-password',
    )
    expect(authRepository.createRefreshToken).toHaveBeenCalledWith({
      token: 'refresh-token',
      userId: 'user-1',
      expiresAt: expiry,
    })
    expect(response.body).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      },
    })
  })

  it('rejects expired refresh tokens and removes them from the repository', async () => {
    const expiredToken = createStoredRefreshToken({
      id: 'expired-token',
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    })
    const { app, authRepository } = createTestApp({
      authRepository: {
        findRefreshTokenWithUser: vi.fn().mockResolvedValue(expiredToken),
      },
    })

    const response = await request(app).post('/api/auth/refresh').send({
      refreshToken: 'refresh-token',
    })

    expect(response.status).toBe(401)
    expect(authRepository.deleteRefreshTokenById).toHaveBeenCalledWith(
      'expired-token',
    )
  })

  it('returns the current user for a valid bearer token without Prisma', async () => {
    const { app, authRepository, authUtilities } = createTestApp({
      authRepository: {
        findCurrentUser: vi.fn().mockResolvedValue(createCurrentUser()),
      },
    })

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer valid-access-token')

    expect(response.status).toBe(200)
    expect(authUtilities.verifyToken).toHaveBeenCalledWith(
      'valid-access-token',
    )
    expect(authRepository.findCurrentUser).toHaveBeenCalledWith('user-1')
    expect(response.body.user).toMatchObject({
      id: 'user-1',
      email: 'test@example.com',
      username: 'testuser',
    })
  })
})
