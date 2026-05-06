const net = require('node:net')
const path = require('node:path')
const { spawn } = require('node:child_process')

const rootDir = path.resolve(__dirname, '..')
const isDryRun = process.argv.includes('--dry-run')

function parsePort(value, fallback) {
  const port = Number(value)
  return Number.isInteger(port) && port > 0 ? port : fallback
}

function checkPortAvailability(port, host = '0.0.0.0') {
  return new Promise((resolve, reject) => {
    const server = net.createServer()

    server.once('error', (error) => {
      server.close()

      if (error && (error.code === 'EADDRINUSE' || error.code === 'EACCES')) {
        resolve(false)
        return
      }

      reject(error)
    })

    server.once('listening', () => {
      server.close(() => resolve(true))
    })

    server.listen(port, host)
  })
}

async function ensurePortAvailable(port, label) {
  const available = await checkPortAvailability(port)

  if (!available) {
    throw new Error(`${label} port ${port} is already in use. Free that port and try again.`)
  }
}

function forwardSignal(signal, child) {
  process.on(signal, () => {
    if (!child.killed) {
      child.kill(signal)
    }
  })
}

async function main() {
  const frontendPort = parsePort(process.env.FRONTEND_PORT, 3000)
  const backendPort = parsePort(process.env.BACKEND_PORT || process.env.PORT, 5000)

  await ensurePortAvailable(frontendPort, 'Frontend')
  await ensurePortAvailable(backendPort, 'Backend')

  const frontendUrl = `http://localhost:${frontendPort}`
  const backendUrl = `http://localhost:${backendPort}`

  const env = {
    ...process.env,
    PORT: String(backendPort),
    BACKEND_PORT: String(backendPort),
    FRONTEND_PORT: String(frontendPort),
    FRONTEND_URL: frontendUrl,
    NEXTAUTH_URL: frontendUrl,
    NEXT_PUBLIC_API_URL: backendUrl,
  }

  console.log(`Starting frontend on ${frontendUrl}`)
  console.log(`Starting backend on ${backendUrl}`)

  if (isDryRun) {
    return
  }

  const command =
    `pnpm exec concurrently ` +
    `"pnpm --filter frontend exec next dev --port ${frontendPort}" ` +
    `"pnpm --filter backend dev"`

  const child = spawn(command, {
    cwd: rootDir,
    env,
    stdio: 'inherit',
    shell: true,
  })

  forwardSignal('SIGINT', child)
  forwardSignal('SIGTERM', child)

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 0)
  })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
