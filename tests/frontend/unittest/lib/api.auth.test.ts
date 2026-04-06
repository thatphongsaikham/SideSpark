import { describe, it, expect, beforeEach, vi } from 'vitest'

const { mockGetAuthSession } = vi.hoisted(() => ({
  mockGetAuthSession: vi.fn(),
}))

vi.mock('@/lib/auth-session', () => ({
  getAuthSession: mockGetAuthSession,
}))

global.fetch = vi.fn() as any

const mockFetch = global.fetch as ReturnType<typeof vi.fn>

function capturedHeaders(): Record<string, string> {
  const call = mockFetch.mock.calls[0]
  return (call?.[1]?.headers ?? {}) as Record<string, string>
}

async function callApiRequest(endpoint: string, options?: RequestInit) {
  const { apiRequest } = await import('@/lib/api')
  return apiRequest(endpoint, options)
}

describe('apiRequest Authorization header', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
  })

  it('attaches Bearer token when session has accessToken', async () => {
    mockGetAuthSession.mockResolvedValue({ accessToken: 'test-jwt-token-abc' })

    await callApiRequest('/api/projects')

    expect(mockGetAuthSession).toHaveBeenCalledTimes(1)
    expect(capturedHeaders().Authorization).toBe('Bearer test-jwt-token-abc')
  })

  it('sends no Authorization header when session is null', async () => {
    mockGetAuthSession.mockResolvedValue(null)

    await callApiRequest('/api/projects')

    expect(capturedHeaders().Authorization).toBeUndefined()
  })

  it('sends no Authorization header when session has no accessToken', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { email: 'test@test.com' } })

    await callApiRequest('/api/projects')

    expect(capturedHeaders().Authorization).toBeUndefined()
  })

  it('always sends Content-Type: application/json', async () => {
    mockGetAuthSession.mockResolvedValue(null)

    await callApiRequest('/api/projects')

    expect(capturedHeaders()['Content-Type']).toBe('application/json')
  })

  it('calls the correct backend URL', async () => {
    mockGetAuthSession.mockResolvedValue(null)

    await callApiRequest('/api/projects')

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/projects',
      expect.any(Object)
    )
  })
})
