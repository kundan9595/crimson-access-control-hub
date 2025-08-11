import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { GlobalErrorBoundary } from '@/components/common/ErrorBoundary/GlobalErrorBoundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { vi } from 'vitest';

// Integration test query client with realistic defaults
const createIntegrationQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
  logger: {
    log: () => {},
    warn: () => {},
    error: () => {},
  },
});

// Integration test wrapper
const IntegrationTestWrapper: React.FC<{
  children: React.ReactNode;
  queryClient?: QueryClient;
}> = ({ children, queryClient = createIntegrationQueryClient() }) => {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

// Integration render function
export const renderIntegration = (
  ui: React.ReactElement,
  options: {
    queryClient?: QueryClient;
  } = {}
) => {
  const { queryClient } = options;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <IntegrationTestWrapper queryClient={queryClient}>
      {children}
    </IntegrationTestWrapper>
  );

  return render(ui, { wrapper });
};

// Workflow testing helpers
export const completeWorkflow = {
  // Brand management workflow
  async createBrand(brandData: { name: string; description?: string }) {
    // Click add brand button
    const addButton = screen.getByRole('button', { name: /add brand/i });
    await userEvent.click(addButton);

    // Fill form
    await userEvent.type(screen.getByLabelText(/name/i), brandData.name);
    if (brandData.description) {
      await userEvent.type(screen.getByLabelText(/description/i), brandData.description);
    }

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create/i });
    await userEvent.click(submitButton);

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/brand created successfully/i)).toBeInTheDocument();
    });
  },

  async editBrand(brandName: string, updates: { name?: string; description?: string }) {
    // Find and click edit button for the brand
    const brandRow = screen.getByText(brandName).closest('tr');
    const editButton = within(brandRow!).getByRole('button', { name: /edit/i });
    await userEvent.click(editButton);

    // Update form fields
    if (updates.name) {
      const nameInput = screen.getByLabelText(/name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, updates.name);
    }

    if (updates.description) {
      const descInput = screen.getByLabelText(/description/i);
      await userEvent.clear(descInput);
      await userEvent.type(descInput, updates.description);
    }

    // Submit form
    const submitButton = screen.getByRole('button', { name: /update/i });
    await userEvent.click(submitButton);

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/brand updated successfully/i)).toBeInTheDocument();
    });
  },

  async deleteBrand(brandName: string) {
    // Find and click delete button for the brand
    const brandRow = screen.getByText(brandName).closest('tr');
    const deleteButton = within(brandRow!).getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm|yes/i });
    await userEvent.click(confirmButton);

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/brand deleted successfully/i)).toBeInTheDocument();
    });
  },

  // Inventory management workflow
  async viewInventoryLocations(skuCode: string) {
    // Find the SKU row
    const skuRow = screen.getByText(skuCode).closest('tr');
    const viewButton = within(skuRow!).getByRole('button', { name: /view/i });
    await userEvent.click(viewButton);

    // Wait for locations modal to open
    await waitFor(() => {
      expect(screen.getByText(/inventory locations/i)).toBeInTheDocument();
    });
  },

  // Search and filter workflow
  async searchAndFilter(searchTerm: string, filters?: Record<string, string>) {
    // Perform search
    const searchInput = screen.getByPlaceholderText(/search/i);
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, searchTerm);

    // Apply filters if provided
    if (filters) {
      for (const [filterName, filterValue] of Object.entries(filters)) {
        const filterSelect = screen.getByLabelText(new RegExp(filterName, 'i'));
        await userEvent.click(filterSelect);
        const option = screen.getByText(filterValue);
        await userEvent.click(option);
      }
    }

    // Wait for results to update
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  },

  // Pagination workflow
  async navigatePages() {
    // Go to next page
    const nextButton = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextButton);

    // Wait for page change
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Go to previous page
    const prevButton = screen.getByRole('button', { name: /previous/i });
    await userEvent.click(prevButton);

    // Wait for page change
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  },

  // Export workflow
  async exportData() {
    const exportButton = screen.getByRole('button', { name: /export/i });
    await userEvent.click(exportButton);

    // Wait for export to complete
    await waitFor(() => {
      expect(screen.getByText(/export completed/i)).toBeInTheDocument();
    });
  },
};

// Data flow testing helpers
export const testDataFlow = {
  // Test query invalidation
  async testQueryInvalidation(createAction: () => Promise<void>, queryKey: string[]) {
    const queryClient = createIntegrationQueryClient();
    
    // Pre-populate cache
    queryClient.setQueryData(queryKey, [{ id: '1', name: 'Existing Item' }]);
    
    // Perform action that should invalidate cache
    await createAction();
    
    // Check if cache was invalidated
    const cachedData = queryClient.getQueryData(queryKey);
    expect(cachedData).toBeUndefined();
  },

  // Test optimistic updates
  async testOptimisticUpdate(
    updateAction: () => Promise<void>,
    expectedData: any,
    queryKey: string[]
  ) {
    const queryClient = createIntegrationQueryClient();
    
    // Pre-populate cache
    queryClient.setQueryData(queryKey, [{ id: '1', name: 'Original Name' }]);
    
    // Perform optimistic update
    await updateAction();
    
    // Check if cache was updated optimistically
    const cachedData = queryClient.getQueryData(queryKey);
    expect(cachedData).toEqual(expectedData);
  },

  // Test error handling
  async testErrorHandling(errorAction: () => Promise<void>) {
    // Mock console.error to avoid noise in tests
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    try {
      await errorAction();
    } catch (error) {
      // Error should be handled gracefully
      expect(error).toBeDefined();
    } finally {
      consoleSpy.mockRestore();
    }
  },
};

// Performance testing helpers for integration tests
export const integrationPerformance = {
  // Test page load performance
  async testPageLoad(pageComponent: React.ReactElement, maxLoadTime = 1000) {
    const startTime = performance.now();
    
    renderIntegration(pageComponent);
    
    // Wait for page to be fully loaded
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(maxLoadTime);
  },

  // Test workflow performance
  async testWorkflowPerformance(
    workflow: () => Promise<void>,
    maxWorkflowTime = 2000
  ) {
    const startTime = performance.now();
    
    await workflow();
    
    const workflowTime = performance.now() - startTime;
    expect(workflowTime).toBeLessThan(maxWorkflowTime);
  },

  // Test memory usage during workflow
  async testMemoryUsage(workflow: () => Promise<void>) {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    await workflow();
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be reasonable (less than 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  },
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { userEvent };
