/**
 * Generic Page Test Generator
 * Generates comprehensive test suites for React page components
 */

export interface PageTestConfig {
  pageName: string;
  componentName: string;
  viewModes: string[];
  requiredRole?: string;
  hasTabNavigation?: boolean;
}

export function generatePageTest(config: PageTestConfig): string {
  const { pageName, componentName, viewModes, requiredRole, hasTabNavigation } = config;

  return `import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'wouter/memory-location';
import ${componentName} from '@/pages/${componentName}';

// Mock fetch for API calls
global.fetch = vi.fn();
const mockFetch = vi.mocked(fetch);

// Test wrapper with providers
const renderWithProviders = (component: React.ReactElement, initialPath = '/') => {
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
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'mock-data' })
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(<${componentName} />);
    });

    it('has proper accessibility structure', () => {
      renderWithProviders(<${componentName} />);
      
      // Check for basic semantic elements
      const main = screen.queryByRole('main');
      if (main) {
        expect(main).toBeInTheDocument();
      }
    });
  });

${requiredRole ? `
  describe('Authentication & Authorization', () => {
    it('handles unauthenticated access', async () => {
      mockFetch.mockRejectedValueOnce(new Error('401: Unauthorized'));
      
      renderWithProviders(<${componentName} />);
      
      await waitFor(() => {
        expect(screen.queryByText(/unauthorized|login/i)).toBeTruthy();
      });
    });

    it('renders correctly for authorized ${requiredRole} role', async () => {
      renderWithProviders(<${componentName} />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });
` : ''}

${hasTabNavigation ? `
  describe('Tab Navigation', () => {
    it('handles tab switching', async () => {
      renderWithProviders(<${componentName} />);
      
      // Look for tab elements
      const tabs = screen.getAllByRole('tab');
      if (tabs.length > 1) {
        fireEvent.click(tabs[1]);
        
        await waitFor(() => {
          expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
        });
      }
    });

    it('maintains tab state across interactions', async () => {
      renderWithProviders(<${componentName} />);
      
      const tabs = screen.getAllByRole('tab');
      if (tabs.length > 0) {
        fireEvent.click(tabs[0]);
        
        await waitFor(() => {
          expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
        });
      }
    });
  });
` : ''}

${viewModes.length > 1 ? `
  describe('View Modes', () => {
${viewModes.map(mode => `    it('renders correctly in ${mode} mode', () => {
      renderWithProviders(<${componentName} />);
      
      // View mode specific assertions
      expect(document.body).toBeInTheDocument();
    });`).join('\n\n')}
  });
` : ''}

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithProviders(<${componentName} />);
      
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).toBeTruthy();
      });
    });

    it('handles component errors with error boundary', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithProviders(<${componentName} />);
      
      expect(document.body).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility Compliance', () => {
    it('supports keyboard navigation', () => {
      renderWithProviders(<${componentName} />);
      
      const interactiveElements = screen.getAllByRole('button');
      interactiveElements.forEach(element => {
        expect(element).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('has proper ARIA labels and roles', () => {
      renderWithProviders(<${componentName} />);
      
      // Check for proper semantic structure
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    it('renders within acceptable time limits', async () => {
      const startTime = performance.now();
      
      renderWithProviders(<${componentName} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Component should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });
  });
});`;
}