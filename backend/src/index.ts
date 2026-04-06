import express, { NextFunction, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import apiRouter from './routes'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT || 5000)
const HOST = process.env.HOST || '0.0.0.0'

function parseOrigins(value?: string): string[] {
  if (!value) return []

  return value
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin.length > 0)
}

function getAllowedOrigins(): string[] {
  const configuredOrigins = [
    ...parseOrigins(process.env.FRONTEND_URL),
    ...parseOrigins(process.env.FRONTEND_URLS),
  ]

  if (configuredOrigins.length > 0) {
    return [...new Set(configuredOrigins)]
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Set FRONTEND_URL or FRONTEND_URLS before starting the API in production.',
    )
  }

  return ['http://localhost:3000']
}

const allowedOrigins = getAllowedOrigins()

app.set('trust proxy', 1)

app.use(helmet())
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) {
        callback(null, true)
        return
      }

      const normalizedOrigin = origin.replace(/\/+$/, '')

      if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true)
        return
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`))
    },
  }),
)
app.use(express.json())
app.use(morgan('dev'))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
})
app.use('/api/', limiter)

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'SideSpark API is running' })
})

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to SideSpark API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
    },
  })
})

app.use('/api', apiRouter)

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, HOST, () => {
  console.log(`SideSpark API server running on ${HOST}:${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`)
})
