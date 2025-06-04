import { vi } from 'vitest'
import type { MockedFunction } from 'vitest'

/**
 * Generic test utilities for any TypeScript/React application
 */

// Mock API request utility
export const createMockApiRequest = (mockResponse: any, shouldFail = false) => {
  return vi.fn().mockImplementation(() => {
    if (shouldFail) {
      return Promise.reject(new Error('API request failed'))
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
      text: () => Promise.resolve(JSON.stringify(mockResponse))
    })
  })
}

// Mock fetch utility
export const createMockFetch = (responses: Record<string, any>) => {
  return vi.fn().mockImplementation((url: string) => {
    const response = responses[url]
    if (!response) {
      return Promise.reject(new Error(`No mock response for ${url}`))
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response))
    })
  })
}

// Generic form submission mock
export const createMockFormSubmission = (onSubmit: MockedFunction<any>) => {
  return {
    preventDefault: vi.fn(),
    target: {
      reset: vi.fn()
    },
    mockSubmit: onSubmit
  }
}

// Local storage mock
export const createLocalStorageMock = () => {
  const store: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    length: 0,
    key: vi.fn()
  }
}

// Session storage mock
export const createSessionStorageMock = () => createLocalStorageMock()

// Window location mock
export const createLocationMock = (initialPath = '/') => {
  return {
    pathname: initialPath,
    search: '',
    hash: '',
    href: `http://localhost${initialPath}`,
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn()
  }
}

// Console mock for testing logging
export const createConsoleMock = () => {
  return {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}

// Timer utilities
export const advanceTimers = (ms: number) => {
  vi.advanceTimersByTime(ms)
}

export const runAllTimers = () => {
  vi.runAllTimers()
}

// Test data generators
export const generateTestUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  createdAt: new Date().toISOString(),
  ...overrides
})

export const generateTestId = () => Math.floor(Math.random() * 10000)

// Async utilities
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const flushPromises = () => new Promise(resolve => setImmediate(resolve))

// Error boundary test helper
export const createErrorBoundaryTest = (Component: any, errorMessage: string) => {
  const ThrowError = () => {
    throw new Error(errorMessage)
  }
  
  return ThrowError
}

// Generic event mock
export const createMockEvent = (eventData = {}) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: { value: '' },
  currentTarget: { value: '' },
  ...eventData
})

// Query client mock for React Query
export const createMockQueryClient = () => {
  return {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    clear: vi.fn(),
    removeQueries: vi.fn()
  }
}