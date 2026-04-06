import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt, { SignOptions } from 'jsonwebtoken'

function getRequiredSecret(name: string, fallback: string): string {
  const value = process.env[name]?.trim()

  if (value) {
    return value
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} must be set in production.`)
  }

  return fallback
}

function parseRefreshTokenExpiryDays(value?: string): number {
  if (!value) return 7

  const normalized = value.trim().toLowerCase()
  const numericValue = normalized.endsWith('d')
    ? Number.parseInt(normalized.slice(0, -1), 10)
    : Number.parseInt(normalized, 10)

  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 7
}

const JWT_SECRET = getRequiredSecret('JWT_SECRET', 'your-super-secret-jwt-key-here')
const REFRESH_TOKEN_SECRET = getRequiredSecret(
  'REFRESH_TOKEN_SECRET',
  'your-refresh-token-secret-here',
)
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN?.trim() || '1h'
const REFRESH_TOKEN_EXPIRES_IN_DAYS = parseRefreshTokenExpiryDays(
  process.env.REFRESH_TOKEN_EXPIRES_IN,
)

const signOptions: SignOptions = {
  expiresIn: ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
}

const refreshSignOptions: SignOptions = {
  expiresIn: REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 3600,
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, signOptions)
}

export function generateRefreshToken(payload: any): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, refreshSignOptions)
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string): any {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET)
  } catch {
    return null
  }
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function getRefreshTokenExpiry(): Date {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS)
  return expiry
}
