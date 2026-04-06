import { describe, expect, it } from 'vitest'
import {
  generateRefreshToken,
  generateToken,
  generateVerificationToken,
  getRefreshTokenExpiry,
  hashPassword,
  verifyPassword,
  verifyRefreshToken,
  verifyToken,
} from '@/lib/auth'

describe('auth helpers', () => {
  it('hashes passwords and verifies the correct password', async () => {
    const password = 'password123'
    const hash = await hashPassword(password)

    expect(hash).not.toBe(password)
    await expect(verifyPassword(password, hash)).resolves.toBe(true)
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false)
  })

  it('generates and verifies access tokens', () => {
    const token = generateToken({
      userId: 'user-1',
      email: 'user@example.com',
    })

    expect(verifyToken(token)).toMatchObject({
      userId: 'user-1',
      email: 'user@example.com',
    })
    expect(verifyToken('not-a-valid-token')).toBeNull()
  })

  it('generates and verifies refresh tokens', () => {
    const token = generateRefreshToken({
      userId: 'user-1',
    })

    expect(verifyRefreshToken(token)).toMatchObject({
      userId: 'user-1',
    })
    expect(verifyRefreshToken('not-a-valid-token')).toBeNull()
  })

  it('generates unique verification tokens', () => {
    const first = generateVerificationToken()
    const second = generateVerificationToken()

    expect(first).toHaveLength(64)
    expect(first).toMatch(/^[a-f0-9]+$/)
    expect(second).toHaveLength(64)
    expect(second).toMatch(/^[a-f0-9]+$/)
    expect(first).not.toBe(second)
  })

  it('returns a refresh token expiry date in the future', () => {
    const now = Date.now()
    const expiry = getRefreshTokenExpiry()
    const oneDay = 24 * 60 * 60 * 1000
    const diff = expiry.getTime() - now

    expect(diff).toBeGreaterThan(6 * oneDay)
    expect(diff).toBeLessThan(8 * oneDay)
  })
})
