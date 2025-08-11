import { renderIntegration, completeWorkflow, testDataFlow, integrationPerformance } from '../integration-test-utils';
import { createMockBrands } from '@/test/utils/mock-data';
import { vi } from 'vitest';
import { userEvent } from '@testing-library/user-event';
import BrandsPage from '@/pages/BrandsPage';

// Mock the hooks with realistic data
vi.mock('@/hooks/masters/useBrands', () => ({
  useBrands: () => ({
    data: createMockBrands(10),
    isLoading: false,
    error: null,
  }),
  useCreateBrand: () => ({
    mutate: vi.fn().mockResolvedValue({ id: 'new-brand-id', name: 'New Brand' }),
    isPending: false,
  }),
  useUpdateBrand: () => ({
    mutate: vi.fn().mockResolvedValue({ id: 'updated-brand-id', name: 'Updated Brand' }),
    isPending: false,
  }),
  useDeleteBrand: () => ({
    mutate: vi.fn().mockResolvedValue({ success: true }),
    isPending: false,
  }),
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Brand Management Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Brand CRUD Workflow', () => {
    it('completes full brand lifecycle: create, read, update, delete', async () => {
      renderIntegration(<BrandsPage />);

      // 1. CREATE - Add a new brand
      await completeWorkflow.createBrand({
        name: 'Integration Test Brand',
        description: 'Brand created during integration test',
      });

      // Verify brand appears in the list
      expect(screen.getByText('Integration Test Brand')).toBeInTheDocument();

      // 2. READ - Verify brand data is displayed correctly
      const brandRow = screen.getByText('Integration Test Brand').closest('tr');
      expect(brandRow).toHaveTextContent('Integration Test Brand');
      expect(brandRow).toHaveTextContent('Brand created during integration test');

      // 3. UPDATE - Edit the brand
      await completeWorkflow.editBrand('Integration Test Brand', {
        name: 'Updated Integration Brand',
        description: 'Updated description',
      });

      // Verify updates are reflected
      expect(screen.getByText('Updated Integration Brand')).toBeInTheDocument();
      expect(screen.queryByText('Integration Test Brand')).not.toBeInTheDocument();

      // 4. DELETE - Remove the brand
      await completeWorkflow.deleteBrand('Updated Integration Brand');

      // Verify brand is removed
      expect(screen.queryByText('Updated Integration Brand')).not.toBeInTheDocument();
    });

    it('handles search and filtering workflow', async () => {
      renderIntegration(<BrandsPage />);

      // Perform search
      await completeWorkflow.searchAndFilter('Test Brand');

      // Verify search results
      const searchResults = screen.getAllByText(/Test Brand/i);
      expect(searchResults.length).toBeGreaterThan(0);

      // Clear search
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await userEvent.click(clearButton);

      // Verify all brands are shown again
      const allBrands = screen.getAllByText(/Brand/i);
      expect(allBrands.length).toBeGreaterThan(searchResults.length);
    });

    it('handles export workflow', async () => {
      renderIntegration(<BrandsPage />);

      // Export data
      await completeWorkflow.exportData();

      // Verify export completion
      expect(screen.getByText(/export completed/i)).toBeInTheDocument();
    });
  });

  describe('Data Flow Integration', () => {
    it('invalidates cache after brand creation', async () => {
      const { testQueryInvalidation } = testDataFlow;

      await testQueryInvalidation(
        async () => {
          renderIntegration(<BrandsPage />);
          await completeWorkflow.createBrand({
            name: 'Cache Test Brand',
            description: 'Testing cache invalidation',
          });
        },
        ['brands']
      );
    });

    it('handles optimistic updates correctly', async () => {
      const { testOptimisticUpdate } = testDataFlow;

      await testOptimisticUpdate(
        async () => {
          renderIntegration(<BrandsPage />);
          await completeWorkflow.editBrand('Test Brand', {
            name: 'Optimistically Updated Brand',
          });
        },
        [{ id: '1', name: 'Optimistically Updated Brand' }],
        ['brands']
      );
    });

    it('handles errors gracefully', async () => {
      const { testErrorHandling } = testDataFlow;

      // Mock error scenario
      vi.mocked(useCreateBrand).mockReturnValue({
        mutate: vi.fn().mockRejectedValue(new Error('Network error')),
        isPending: false,
      });

      await testErrorHandling(async () => {
        renderIntegration(<BrandsPage />);
        await completeWorkflow.createBrand({
          name: 'Error Test Brand',
        });
      });
    });
  });

  describe('Performance Integration', () => {
    it('loads brands page within performance threshold', async () => {
      const { testPageLoad } = integrationPerformance;

      await testPageLoad(<BrandsPage />, 1000); // 1 second threshold
    });

    it('completes brand creation workflow within performance threshold', async () => {
      const { testWorkflowPerformance } = integrationPerformance;

      await testWorkflowPerformance(
        async () => {
          renderIntegration(<BrandsPage />);
          await completeWorkflow.createBrand({
            name: 'Performance Test Brand',
          });
        },
        2000 // 2 second threshold
      );
    });

    it('maintains reasonable memory usage during workflow', async () => {
      const { testMemoryUsage } = integrationPerformance;

      await testMemoryUsage(async () => {
        renderIntegration(<BrandsPage />);
        await completeWorkflow.createBrand({
          name: 'Memory Test Brand',
        });
        await completeWorkflow.editBrand('Memory Test Brand', {
          name: 'Updated Memory Test Brand',
        });
        await completeWorkflow.deleteBrand('Updated Memory Test Brand');
      });
    });
  });

  describe('Error Boundary Integration', () => {
    it('handles component errors gracefully', async () => {
      // Mock a component that throws an error
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      renderIntegration(<ErrorComponent />);

      // Verify error boundary catches the error
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/error id:/i)).toBeInTheDocument();
    });

    it('provides error recovery options', async () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      renderIntegration(<ErrorComponent />);

      // Check for recovery buttons
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
    });
  });

  describe('Concurrent Operations', () => {
    it('handles multiple brand operations concurrently', async () => {
      renderIntegration(<BrandsPage />);

      // Start multiple operations
      const operations = [
        completeWorkflow.createBrand({ name: 'Concurrent Brand 1' }),
        completeWorkflow.createBrand({ name: 'Concurrent Brand 2' }),
        completeWorkflow.createBrand({ name: 'Concurrent Brand 3' }),
      ];

      // Execute all operations concurrently
      await Promise.all(operations);

      // Verify all brands were created
      expect(screen.getByText('Concurrent Brand 1')).toBeInTheDocument();
      expect(screen.getByText('Concurrent Brand 2')).toBeInTheDocument();
      expect(screen.getByText('Concurrent Brand 3')).toBeInTheDocument();
    });

    it('maintains UI responsiveness during operations', async () => {
      renderIntegration(<BrandsPage />);

      // Start a long-running operation
      const longOperation = completeWorkflow.createBrand({
        name: 'Long Operation Brand',
        description: 'This operation takes time',
      });

      // UI should remain responsive
      expect(screen.getByRole('button', { name: /add brand/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();

      // Complete the operation
      await longOperation;

      // Verify operation completed successfully
      expect(screen.getByText('Long Operation Brand')).toBeInTheDocument();
    });
  });

  describe('State Management Integration', () => {
    it('maintains state consistency across operations', async () => {
      renderIntegration(<BrandsPage />);

      // Create a brand
      await completeWorkflow.createBrand({
        name: 'State Test Brand',
      });

      // Verify brand count increases
      const brandCount = screen.getAllByText(/Brand/i).length;
      expect(brandCount).toBeGreaterThan(0);

      // Edit the brand
      await completeWorkflow.editBrand('State Test Brand', {
        name: 'Updated State Brand',
      });

      // Verify brand count remains the same
      const updatedBrandCount = screen.getAllByText(/Brand/i).length;
      expect(updatedBrandCount).toBe(brandCount);

      // Delete the brand
      await completeWorkflow.deleteBrand('Updated State Brand');

      // Verify brand count decreases
      const finalBrandCount = screen.getAllByText(/Brand/i).length;
      expect(finalBrandCount).toBe(brandCount - 1);
    });

    it('handles loading states correctly', async () => {
      // Mock loading state
      vi.mocked(useBrands).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderIntegration(<BrandsPage />);

      // Verify loading state is shown
      expect(screen.getByText(/loading brands/i)).toBeInTheDocument();

      // Mock loaded state
      vi.mocked(useBrands).mockReturnValue({
        data: createMockBrands(5),
        isLoading: false,
        error: null,
      });

      // Re-render to show loaded state
      renderIntegration(<BrandsPage />);

      // Verify brands are displayed
      expect(screen.queryByText(/loading brands/i)).not.toBeInTheDocument();
      expect(screen.getAllByText(/Brand/i).length).toBeGreaterThan(0);
    });
  });
});
