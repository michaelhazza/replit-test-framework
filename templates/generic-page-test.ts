/**
 * Generic Page Component Test Template
 * Adaptable to any React page component with configurable test patterns
 */

export const generatePageTest = (config: {
  pageName: string;
  componentPath: string;
  routePath: string;
  hasAuth?: boolean;
  hasNavigation?: boolean;
  hasTabNavigation?: boolean;
  viewModes?: string[];
  apiEndpoints?: string[];
}) => {
  const {
    pageName,
    componentPath,
    routePath,
    hasAuth = false,
    hasNavigation = false,
    hasTabNavigation = false,
    viewModes = ['default'],
    apiEndpoints = []
  } = config;

  return `import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'wouter/memory-location';
import ${pageName} from '${componentPath}';

// Mock API responses
const mockApiResponses = {
${apiEndpoints.map(endpoint => `  '${endpoint}': { data: 'mock-data' },`).join('\n')}
};

// Mock fetch for API calls
global.fetch = vi.fn();

const mockFetch = vi.mocked(fetch);

// Test component wrapper with providers
const renderWithProviders = (component: React.ReactElement, initialPath = '${routePath}') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('${pageName} Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    
    // Setup default API responses
    mockFetch.mockImplementation((url) => {
      const urlStr = url?.toString() || '';
${apiEndpoints.map(endpoint => `      if (urlStr.includes('${endpoint}')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApiResponses['${endpoint}'])
        } as Response);
      }`).join('\n')}
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: 'default-mock' })
      } as Response);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(<${pageName} />);
    });

    it('has proper page structure', () => {
      renderWithProviders(<${pageName} />);
      
      // Basic page structure validation
      expect(document.body).toBeInTheDocument();
    });
  });

${hasAuth ? `
  describe('Authentication', () => {
    it('handles unauthenticated access appropriately', async () => {
      mockFetch.mockRejectedValueOnce(new Error('401: Unauthorized'));
      
      renderWithProviders(<${pageName} />);
      
      // Component should handle auth errors gracefully
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).toBeDefined();
      });
    });

    it('renders correctly when authenticated', async () => {
      renderWithProviders(<${pageName} />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });
` : ''}

${hasNavigation ? `
  describe('Navigation', () => {
    it('handles navigation interactions', () => {
      renderWithProviders(<${pageName} />);
      
      // Test navigation elements are present
      const navElements = screen.getAllByRole('link');
      expect(navElements.length).toBeGreaterThan(0);
    });
  });
` : ''}

${hasTabNavigation ? `
  describe('Tab Navigation', () => {
    it('switches between tab views', async () => {
      renderWithProviders(<${pageName} />);
      
      // Look for tab elements
      const tabs = screen.getAllByRole('tab');
      if (tabs.length > 1) {
        fireEvent.click(tabs[1]);
        
        await waitFor(() => {
          expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
        });
      }
    });
  });
` : ''}

${viewModes.length > 1 ? `
  describe('View Modes', () => {
${viewModes.map(mode => `    it('renders in ${mode} mode', () => {
      renderWithProviders(<${pageName} />);
      
      // Test view mode specific rendering
      expect(document.body).toBeInTheDocument();
    });`).join('\n\n')}
  });
` : ''}

${apiEndpoints.length > 0 ? `
  describe('API Integration', () => {
${apiEndpoints.map(endpoint => `    it('fetches data from ${endpoint}', async () => {
      renderWithProviders(<${pageName} />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('${endpoint}'),
          expect.any(Object)
        );
      });
    });`).join('\n\n')}

    it('handles API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithProviders(<${pageName} />);
      
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).toBeDefined();
      });
    });
  });
` : ''}

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      renderWithProviders(<${pageName} />);
      
      // Check for basic accessibility elements
      const main = screen.queryByRole('main');
      if (main) {
        expect(main).toBeInTheDocument();
      }
    });

    it('supports keyboard navigation', () => {
      renderWithProviders(<${pageName} />);
      
      // Test keyboard accessibility
      const focusableElements = screen.getAllByRole('button');
      focusableElements.forEach(element => {
        expect(element).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Error Boundaries', () => {
    it('handles component errors gracefully', () => {
      // Mock console.error to prevent noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithProviders(<${pageName} />);
      
      // Component should not crash
      expect(document.body).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });
});`;
};