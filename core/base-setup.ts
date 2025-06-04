/**
 * Base Test Setup - Copy this to your new project's tests/setup.ts
 * Generic test environment configuration that works with any domain
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Global test configuration
beforeAll(async () => {
  // Setup global test environment
  process.env.NODE_ENV = 'test';
  
  // Mock console methods to reduce noise during tests
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(async () => {
  // Cleanup global resources
});

beforeEach(() => {
  // Reset before each test
});

afterEach(() => {
  // Cleanup after each test
  cleanup();
  vi.clearAllMocks();
});

// Mock fetch globally for all tests
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: {
      get: () => 'application/json'
    }
  })
) as any;

// Global test utilities
export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  role: 'user',
  isActive: true,
  ...overrides
});

export const createTestWrapper = (additionalProviders: any[] = []) => {
  return ({ children }: { children: React.ReactNode }) => {
    const providers = [
      // Add your app's providers here
      ...additionalProviders
    ];
    
    return providers.reduce(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children
    );
  };
};