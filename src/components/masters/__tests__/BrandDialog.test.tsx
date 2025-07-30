import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import BrandDialog from '../BrandDialog';

// Mock the hooks
vi.mock('@/hooks/masters/useBrands', () => ({
  useCreateBrand: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdateBrand: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('BrandDialog', () => {
  it('renders create brand form when no brand is provided', () => {
    renderWithProviders(
      <BrandDialog
        open={true}
        onOpenChange={vi.fn()}
        brand={null}
      />
    );

    expect(screen.getByText('Create Brand')).toBeInTheDocument();
    expect(screen.getByLabelText('Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('renders edit brand form when brand is provided', () => {
    const mockBrand = {
      id: '1',
      name: 'Test Brand',
      description: 'Test Description',
      status: 'active',
      sort_order: 1,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };

    renderWithProviders(
      <BrandDialog
        open={true}
        onOpenChange={vi.fn()}
        brand={mockBrand}
      />
    );

    expect(screen.getByText('Edit Brand')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Brand')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const onOpenChange = vi.fn();
    
    renderWithProviders(
      <BrandDialog
        open={true}
        onOpenChange={onOpenChange}
        brand={null}
      />
    );

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('closes dialog when cancel is clicked', () => {
    const onOpenChange = vi.fn();
    
    renderWithProviders(
      <BrandDialog
        open={true}
        onOpenChange={onOpenChange}
        brand={null}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
}); 