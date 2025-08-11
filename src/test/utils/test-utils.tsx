import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { GlobalErrorBoundary } from '@/components/common/ErrorBoundary/GlobalErrorBoundary';

// Custom render options interface
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withRouter?: boolean;
  withQueryClient?: boolean;
  withAuth?: boolean;
  withErrorBoundary?: boolean;
  withTooltip?: boolean;
  queryClient?: QueryClient;
}

// Default query client for tests
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
      gcTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
  logger: {
    log: () => {},
    warn: () => {},
    error: () => {},
  },
});

// Test wrapper component
const TestWrapper: React.FC<{
  children: React.ReactNode;
  options: CustomRenderOptions;
}> = ({ children, options }) => {
  const {
    withRouter = true,
    withQueryClient = true,
    withAuth = true,
    withErrorBoundary = true,
    withTooltip = true,
    queryClient = createTestQueryClient(),
  } = options;

  let content = children;

  // Wrap with QueryClient
  if (withQueryClient) {
    content = (
      <QueryClientProvider client={queryClient}>
        {content}
      </QueryClientProvider>
    );
  }

  // Wrap with Router
  if (withRouter) {
    content = <BrowserRouter>{content}</BrowserRouter>;
  }

  // Wrap with Auth Provider
  if (withAuth) {
    content = <AuthProvider>{content}</AuthProvider>;
  }

  // Wrap with Tooltip Provider
  if (withTooltip) {
    content = <TooltipProvider>{content}</TooltipProvider>;
  }

  // Wrap with Error Boundary
  if (withErrorBoundary) {
    content = <GlobalErrorBoundary>{content}</GlobalErrorBoundary>;
  }

  return <>{content}</>;
};

// Custom render function
export const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    withRouter = true,
    withQueryClient = true,
    withAuth = true,
    withErrorBoundary = true,
    withTooltip = true,
    queryClient,
    ...renderOptions
  } = options;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestWrapper
      options={{
        withRouter,
        withQueryClient,
        withAuth,
        withErrorBoundary,
        withTooltip,
        queryClient,
      }}
    >
      {children}
    </TestWrapper>
  );

  return render(ui, { wrapper, ...renderOptions });
};

// Re-export everything from testing library
export * from '@testing-library/react';

// Override render method
export { customRender as render };
