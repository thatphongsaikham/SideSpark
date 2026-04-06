import { getAuthSession } from '@/lib/auth-session'
import { getApiBaseUrl } from '@/lib/runtime-config'

const API_URL = getApiBaseUrl()

type QueryValue = string | number | boolean | null | undefined
type QueryParams = Record<string, QueryValue | QueryValue[]>

function createSearchParams(filters?: QueryParams): URLSearchParams {
  const params = new URLSearchParams()

  if (!filters) return params

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          params.append(key, String(item))
        }
      })
      return
    }

    params.append(key, String(value))
  })

  return params
}

/**
 * API Client for making requests to backend
 */
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_URL}${endpoint}`

  const session = await getAuthSession()
  const token = session?.accessToken || null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle 401 Unauthorized - token expired
  if (response.status === 401) {
    // Optionally trigger re-authentication
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  return response
}

/**
 * Helper to handle API responses
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API request failed')
  }
  return response.json()
}

/**
 * API helper methods
 */
export const api = {
  // Auth methods (existing)
  register: (data: {
    username: string
    email: string
    password: string
    confirmPassword: string
  }) => apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  verifyEmail: (token: string) => apiRequest('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  }),

  resendVerification: (email: string) => apiRequest('/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),

  getMe: () => apiRequest('/api/auth/me'),

  // Projects methods
  projects: {
    getAll: (filters?: { status?: string }) => {
      const params = createSearchParams(filters)
      return apiRequest(`/api/projects${params.toString() ? `?${params.toString()}` : ''}`)
    },
    getById: (id: string) => apiRequest(`/api/projects/${id}`),
    create: (data: {
      name: string
      description?: string
      initialCost?: number
      monthlyGoal?: number
      tasks?: string[]
    }) => apiRequest('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: {
      name?: string
      description?: string
      initialCost?: number
      monthlyGoal?: number
      status?: 'active' | 'paused' | 'completed'
    }) => apiRequest(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/api/projects/${id}`, {
      method: 'DELETE',
    }),
    // Task methods
    addTask: (projectId: string, text: string, order?: number) =>
      apiRequest(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ text, order }),
      }),
    updateTask: (projectId: string, taskId: string, data: {
      completed?: boolean
      text?: string
      order?: number
    }) => apiRequest(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteTask: (projectId: string, taskId: string) =>
      apiRequest(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'DELETE',
      }),
  },

  // Transactions methods
  transactions: {
    getAll: (filters?: {
      projectId?: string
      type?: 'income' | 'expense'
      startDate?: string
      endDate?: string
      limit?: number
    }) => {
      const params = createSearchParams(filters)
      return apiRequest(`/api/transactions${params.toString() ? `?${params.toString()}` : ''}`)
    },
    getById: (id: string) => apiRequest(`/api/transactions/${id}`),
    create: (data: {
      projectId?: string
      type: 'income' | 'expense'
      amount: number
      description?: string
      date?: string
    }) => apiRequest('/api/transactions', {
      method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: {
      projectId?: string
      type?: 'income' | 'expense'
      amount?: number
      description?: string
      date?: string
    }) => apiRequest(`/api/transactions/${id}`, {
      method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) => apiRequest(`/api/transactions/${id}`, {
      method: 'DELETE',
    }),
    getSummary: (filters?: {
      startDate?: string
      endDate?: string
    }) => {
      const params = createSearchParams(filters)
      return apiRequest(`/api/transactions/summary/stats${params.toString() ? `?${params.toString()}` : ''}`)
    },
  },

  // Skills methods
  skills: {
    getAll: (filters?: { category?: string; q?: string }) => {
      const params = createSearchParams(filters)
      return apiRequest(`/api/skills${params.toString() ? `?${params.toString()}` : ''}`)
    },
    getById: (id: string) => apiRequest(`/api/skills/${id}`),
    add: (skillId: string) => apiRequest(`/api/skills/${skillId}/add`, {
      method: 'POST',
    }),
    remove: (skillId: string) => apiRequest(`/api/skills/${skillId}/remove`, {
      method: 'DELETE',
    }),
  },

  // Users methods
  users: {
    getMe: () => apiRequest('/api/users/me'),
    updateMe: (data: { name?: string }) => apiRequest('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    getById: (id: string) => apiRequest(`/api/users/${id}`),
  },

  // Ideas methods
  ideas: {
    getAll: (filters?: {
      skills?: string | string[]
      difficulty?: 'easy' | 'medium' | 'hard'
      category?: string
    }) => {
      const params = createSearchParams(filters)
      return apiRequest(`/api/ideas${params.toString() ? `?${params.toString()}` : ''}`)
    },
    getById: (id: string) => apiRequest(`/api/ideas/${id}`),
  },
}

export default api
