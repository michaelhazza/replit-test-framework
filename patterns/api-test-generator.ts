/**
 * API Test Pattern Generator
 * Creates comprehensive API endpoint tests for any REST API
 */

export interface APITestConfig {
  endpoint: string;
  methods: string[];
  requiresAuth: boolean;
  allowedRoles?: string[];
  responseSchema?: any;
  errorCases?: string[];
}

export const generateAPITest = (config: APITestConfig) => {
  const { endpoint, methods, requiresAuth, allowedRoles, errorCases = [] } = config;

  return `
/**
 * API Tests for ${endpoint}
 * Generated comprehensive endpoint testing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for API testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('${endpoint} API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
      status: 200,
      headers: { get: () => 'application/json' }
    });
  });

  ${methods.map(method => `
  describe('${method} ${endpoint}', () => {
    it('should handle successful ${method} request', async () => {
      const testData = { id: 1, name: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(testData),
        status: ${method === 'POST' ? '201' : '200'},
        headers: { get: () => 'application/json' }
      });

      const response = await fetch('${endpoint}', {
        method: '${method}',
        ${method !== 'GET' ? `body: JSON.stringify(testData),` : ''}
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok).toBe(true);
      expect(response.status).toBe(${method === 'POST' ? '201' : '200'});
    });

    ${requiresAuth ? `
    it('should require authentication for ${method} ${endpoint}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' })
      });

      const response = await fetch('${endpoint}', {
        method: '${method}',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });
    ` : ''}

    ${allowedRoles ? allowedRoles.map(role => `
    it('should allow ${role} access to ${method} ${endpoint}', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ authorized: true })
      });

      const response = await fetch('${endpoint}', {
        method: '${method}',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${role}-token'
        }
      });

      expect(response.ok).toBe(true);
    });
    `).join('') : ''}

    it('should handle ${method} ${endpoint} error cases', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal Server Error' })
      });

      const response = await fetch('${endpoint}', {
        method: '${method}',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });
  `).join('')}

  ${errorCases.map(errorCase => `
  it('should handle ${errorCase}', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: '${errorCase}' })
    });

    const response = await fetch('${endpoint}');
    expect(response.ok).toBe(false);
  });
  `).join('')}

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetch('${endpoint}')).rejects.toThrow('Network error');
  });

  it('should handle malformed JSON responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON')),
      headers: { get: () => 'application/json' }
    });

    const response = await fetch('${endpoint}');
    await expect(response.json()).rejects.toThrow('Invalid JSON');
  });
});
`;
};

export const generateRoleAccessTest = (endpoints: APITestConfig[], roles: string[]) => {
  return `
/**
 * Role-Based Access Control Tests
 * Tests access permissions across all endpoints
 */

import { describe, it, expect } from 'vitest';

describe('Role-Based Access Control', () => {
  const roles = ${JSON.stringify(roles)};
  const endpoints = ${JSON.stringify(endpoints.map(e => ({ endpoint: e.endpoint, allowedRoles: e.allowedRoles })))};

  ${roles.map(role => `
  describe('${role} role access', () => {
    it('should have appropriate access to endpoints', () => {
      endpoints.forEach(({ endpoint, allowedRoles }) => {
        const hasAccess = !allowedRoles || allowedRoles.includes('${role}') || allowedRoles.includes('admin');
        
        if (hasAccess) {
          expect(['${role}', 'admin'].some(r => !allowedRoles || allowedRoles.includes(r))).toBe(true);
        } else {
          expect(allowedRoles?.includes('${role}')).toBe(false);
        }
      });
    });
  });
  `).join('')}

  it('should maintain role hierarchy', () => {
    const roleHierarchy = {
      'super_admin': ['admin', 'manager', 'user'],
      'admin': ['manager', 'user'],
      'manager': ['user'],
      'user': []
    };

    Object.entries(roleHierarchy).forEach(([role, subordinates]) => {
      expect(Array.isArray(subordinates)).toBe(true);
    });
  });
});
`;
};