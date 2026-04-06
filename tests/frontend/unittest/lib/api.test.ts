import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetAuthSession } = vi.hoisted(() => ({
  mockGetAuthSession: vi.fn(),
}))

vi.mock('@/lib/auth-session', () => ({
  getAuthSession: mockGetAuthSession,
}))

import { api, apiRequest, handleApiResponse } from '@/lib/api'

const mockFetch = vi.fn()
global.fetch = mockFetch as any

function createResponse(overrides: Partial<Response> = {}): Response {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({}),
    ...overrides,
  } as Response
}

describe('API Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAuthSession.mockResolvedValue(null)
    mockFetch.mockResolvedValue(createResponse())
  })

  it('calls API with the expected request data', async () => {
    await apiRequest('/api/test', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/test',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ test: 'data' }),
      })
    )
  })

  it('merges custom headers with the default JSON header', async () => {
    await apiRequest('/api/test', {
      headers: {
        'X-Trace-Id': 'trace-123',
      },
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Trace-Id': 'trace-123',
        }),
      })
    )
  })

  it('parses successful API responses', async () => {
    const response = createResponse({
      json: vi.fn().mockResolvedValue({ id: 'project-1' }),
    })

    await expect(handleApiResponse<{ id: string }>(response)).resolves.toEqual({
      id: 'project-1',
    })
    expect(response.json).toHaveBeenCalledTimes(1)
  })

  it('throws the backend error message for failed responses', async () => {
    const response = createResponse({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ error: 'Bad request' }),
    })

    await expect(handleApiResponse(response)).rejects.toThrow('Bad request')
  })

  it('falls back to a generic error for failed responses without an error field', async () => {
    const response = createResponse({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({}),
    })

    await expect(handleApiResponse(response)).rejects.toThrow('API request failed')
  })
})

describe('API endpoint wrappers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAuthSession.mockResolvedValue(null)
    mockFetch.mockResolvedValue(createResponse())
  })

  it.each([
    {
      name: 'register',
      call: () => api.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      }),
      expectedUrl: '/api/auth/register',
      expectedMethod: 'POST',
      expectedBody: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      }),
    },
    {
      name: 'verifyEmail',
      call: () => api.verifyEmail('verify-token'),
      expectedUrl: '/api/auth/verify-email',
      expectedMethod: 'POST',
      expectedBody: JSON.stringify({ token: 'verify-token' }),
    },
    {
      name: 'resendVerification',
      call: () => api.resendVerification('test@example.com'),
      expectedUrl: '/api/auth/resend-verification',
      expectedMethod: 'POST',
      expectedBody: JSON.stringify({ email: 'test@example.com' }),
    },
    {
      name: 'getMe',
      call: () => api.getMe(),
      expectedUrl: '/api/auth/me',
    },
    {
      name: 'projects.getAll',
      call: () => api.projects.getAll({ status: 'active' }),
      expectedUrl: '/api/projects?status=active',
    },
    {
      name: 'projects.getById',
      call: () => api.projects.getById('project-1'),
      expectedUrl: '/api/projects/project-1',
    },
    {
      name: 'projects.create',
      call: () => api.projects.create({
        name: 'Alpha',
        description: 'New project',
        initialCost: 100,
        monthlyGoal: 250,
        tasks: ['task-1'],
      }),
      expectedUrl: '/api/projects',
      expectedMethod: 'POST',
      expectedBody: JSON.stringify({
        name: 'Alpha',
        description: 'New project',
        initialCost: 100,
        monthlyGoal: 250,
        tasks: ['task-1'],
      }),
    },
    {
      name: 'projects.update',
      call: () => api.projects.update('project-1', {
        name: 'Beta',
        status: 'paused',
      }),
      expectedUrl: '/api/projects/project-1',
      expectedMethod: 'PUT',
      expectedBody: JSON.stringify({
        name: 'Beta',
        status: 'paused',
      }),
    },
    {
      name: 'projects.delete',
      call: () => api.projects.delete('project-1'),
      expectedUrl: '/api/projects/project-1',
      expectedMethod: 'DELETE',
    },
    {
      name: 'projects.addTask',
      call: () => api.projects.addTask('project-1', 'Write tests', 2),
      expectedUrl: '/api/projects/project-1/tasks',
      expectedMethod: 'POST',
      expectedBody: JSON.stringify({ text: 'Write tests', order: 2 }),
    },
    {
      name: 'projects.updateTask',
      call: () => api.projects.updateTask('project-1', 'task-1', {
        completed: true,
      }),
      expectedUrl: '/api/projects/project-1/tasks/task-1',
      expectedMethod: 'PUT',
      expectedBody: JSON.stringify({ completed: true }),
    },
    {
      name: 'projects.deleteTask',
      call: () => api.projects.deleteTask('project-1', 'task-1'),
      expectedUrl: '/api/projects/project-1/tasks/task-1',
      expectedMethod: 'DELETE',
    },
    {
      name: 'transactions.getAll',
      call: () => api.transactions.getAll({
        projectId: 'project-1',
        type: 'income',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        limit: 5,
      }),
      expectedUrl:
        '/api/transactions?projectId=project-1&type=income&startDate=2026-01-01&endDate=2026-01-31&limit=5',
    },
    {
      name: 'transactions.getById',
      call: () => api.transactions.getById('txn-1'),
      expectedUrl: '/api/transactions/txn-1',
    },
    {
      name: 'transactions.create',
      call: () => api.transactions.create({
        projectId: 'project-1',
        type: 'expense',
        amount: 300,
        description: 'Hosting',
      }),
      expectedUrl: '/api/transactions',
      expectedMethod: 'POST',
      expectedBody: JSON.stringify({
        projectId: 'project-1',
        type: 'expense',
        amount: 300,
        description: 'Hosting',
      }),
    },
    {
      name: 'transactions.update',
      call: () => api.transactions.update('txn-1', {
        amount: 450,
      }),
      expectedUrl: '/api/transactions/txn-1',
      expectedMethod: 'PUT',
      expectedBody: JSON.stringify({
        amount: 450,
      }),
    },
    {
      name: 'transactions.delete',
      call: () => api.transactions.delete('txn-1'),
      expectedUrl: '/api/transactions/txn-1',
      expectedMethod: 'DELETE',
    },
    {
      name: 'transactions.getSummary',
      call: () => api.transactions.getSummary({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      }),
      expectedUrl: '/api/transactions/summary/stats?startDate=2026-01-01&endDate=2026-01-31',
    },
    {
      name: 'skills.getAll',
      call: () => api.skills.getAll({ category: 'design', q: 'figma' }),
      expectedUrl: '/api/skills?category=design&q=figma',
    },
    {
      name: 'skills.getById',
      call: () => api.skills.getById('skill-1'),
      expectedUrl: '/api/skills/skill-1',
    },
    {
      name: 'skills.add',
      call: () => api.skills.add('skill-1'),
      expectedUrl: '/api/skills/skill-1/add',
      expectedMethod: 'POST',
    },
    {
      name: 'skills.remove',
      call: () => api.skills.remove('skill-1'),
      expectedUrl: '/api/skills/skill-1/remove',
      expectedMethod: 'DELETE',
    },
    {
      name: 'users.getMe',
      call: () => api.users.getMe(),
      expectedUrl: '/api/users/me',
    },
    {
      name: 'users.updateMe',
      call: () => api.users.updateMe({ name: 'Updated Name' }),
      expectedUrl: '/api/users/me',
      expectedMethod: 'PUT',
      expectedBody: JSON.stringify({ name: 'Updated Name' }),
    },
    {
      name: 'users.getById',
      call: () => api.users.getById('user-1'),
      expectedUrl: '/api/users/user-1',
    },
    {
      name: 'ideas.getAll',
      call: () => api.ideas.getAll({
        skills: ['design', 'photo'],
        difficulty: 'medium',
      }),
      expectedUrl: '/api/ideas?skills=design&skills=photo&difficulty=medium',
    },
    {
      name: 'ideas.getById',
      call: () => api.ideas.getById('idea-1'),
      expectedUrl: '/api/ideas/idea-1',
    },
  ])('builds the expected request for $name', async ({
    call,
    expectedUrl,
    expectedMethod,
    expectedBody,
  }) => {
    await call()

    const [url, options] = mockFetch.mock.calls.at(-1) as [string, RequestInit]

    expect(url).toBe(`http://localhost:5000${expectedUrl}`)
    expect(options.headers).toEqual(
      expect.objectContaining({
        'Content-Type': 'application/json',
      })
    )

    if (expectedMethod) {
      expect(options.method).toBe(expectedMethod)
    }

    if (expectedBody !== undefined) {
      expect(options.body).toBe(expectedBody)
    }
  })
})
