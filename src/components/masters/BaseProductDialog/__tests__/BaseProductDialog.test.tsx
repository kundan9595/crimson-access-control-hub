import { render, screen, waitFor } from '@/test/utils';
import { BaseProductDialog } from '../index';
import { createMockBaseProduct, createMockCategory, createMockSizeGroup } from '@/test/utils/mock-data';
import { vi } from 'vitest';

// Mock the hooks
vi.mock('@/hooks/masters/useCategories', () => ({
  useCategories: () => ({
    data: [
      createMockCategory({ name: 'Test Category' }),
      createMockCategory({ name: 'Another Category' }),
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/masters/useFabrics', () => ({
  useFabrics: () => ({
    data: [
      { id: '1', name: 'Cotton', fabric_type: 'Natural' },
      { id: '2', name: 'Polyester', fabric_type: 'Synthetic' },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/masters/useParts', () => ({
  useParts: () => ({
    data: [
      { id: '1', name: 'Sleeve' },
      { id: '2', name: 'Collar' },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/masters/useSizes', () => ({
  useSizeGroups: () => ({
    data: [
      createMockSizeGroup({ name: 'Small' }),
      createMockSizeGroup({ name: 'Medium' }),
    ],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/common/useUnifiedMutations', () => ({
  useBaseProductMutations: () => ({
    useCreate: () => ({
      mutateAsync: vi.fn().mockResolvedValue({ id: '1', name: 'Test Product' }),
      isPending: false,
    }),
    useUpdate: () => ({
      mutateAsync: vi.fn().mockResolvedValue({ id: '1', name: 'Updated Product' }),
      isPending: false,
    }),
  }),
}));

describe('BaseProductDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders create form when no baseProduct is provided', () => {
      render(<BaseProductDialog {...defaultProps} />);

      expect(screen.getByText('Add Base Product')).toBeInTheDocument();
      expect(screen.getByLabelText('Name *')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('shows all tabs in create mode', () => {
      render(<BaseProductDialog {...defaultProps} />);

      expect(screen.getByText('Basic Info')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('Consumption')).toBeInTheDocument();
      expect(screen.getByText('Media')).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      render(<BaseProductDialog {...defaultProps} />);

      const submitButton = screen.getByText('Create');
      submitButton.click();

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    it('allows navigation between tabs', async () => {
      render(<BaseProductDialog {...defaultProps} />);

      // Click on Categories tab
      const categoriesTab = screen.getByText('Categories');
      categoriesTab.click();

      await waitFor(() => {
        expect(screen.getByText('Categories & Groups')).toBeInTheDocument();
      });

      // Click on Pricing tab
      const pricingTab = screen.getByText('Pricing');
      pricingTab.click();

      await waitFor(() => {
        expect(screen.getByText('Pricing Information')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    const mockBaseProduct = createMockBaseProduct({
      name: 'Test Product',
      description: 'Test Description',
      base_price: 100,
      status: 'active',
    });

    it('renders edit form when baseProduct is provided', () => {
      render(<BaseProductDialog {...defaultProps} baseProduct={mockBaseProduct} />);

      expect(screen.getByText('Edit Base Product')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Update')).toBeInTheDocument();
    });

    it('pre-fills form with existing data', () => {
      render(<BaseProductDialog {...defaultProps} baseProduct={mockBaseProduct} />);

      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates name is required', async () => {
      render(<BaseProductDialog {...defaultProps} />);

      const submitButton = screen.getByText('Create');
      submitButton.click();

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
      });
    });

    it('validates numeric fields', async () => {
      render(<BaseProductDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText('Name *');
      nameInput.setAttribute('value', 'Test Product');

      const sortOrderInput = screen.getByLabelText('Sort Order');
      sortOrderInput.setAttribute('value', '-1');

      const submitButton = screen.getByText('Create');
      submitButton.click();

      await waitFor(() => {
        expect(screen.getByText('Sort Order must be 0 or greater')).toBeInTheDocument();
      });
    });
  });

  describe('Dialog Behavior', () => {
    it('calls onOpenChange when dialog is closed', () => {
      const onOpenChange = vi.fn();
      render(<BaseProductDialog open={true} onOpenChange={onOpenChange} />);

      const cancelButton = screen.getByText('Cancel');
      cancelButton.click();

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('resets form when switching between create and edit modes', () => {
      const { rerender } = render(<BaseProductDialog {...defaultProps} />);

      // Fill in some data
      const nameInput = screen.getByLabelText('Name *');
      nameInput.setAttribute('value', 'Test Product');

      // Switch to edit mode
      const mockBaseProduct = createMockBaseProduct({ name: 'Edit Product' });
      rerender(<BaseProductDialog {...defaultProps} baseProduct={mockBaseProduct} />);

      expect(screen.getByDisplayValue('Edit Product')).toBeInTheDocument();
    });
  });

  describe('Tab Functionality', () => {
    it('switches to Categories tab and shows category selection', async () => {
      render(<BaseProductDialog {...defaultProps} />);

      const categoriesTab = screen.getByText('Categories');
      categoriesTab.click();

      await waitFor(() => {
        expect(screen.getByText('Categories & Groups')).toBeInTheDocument();
        expect(screen.getByText('Test Category')).toBeInTheDocument();
        expect(screen.getByText('Cotton (Natural)')).toBeInTheDocument();
      });
    });

    it('switches to Pricing tab and shows pricing fields', async () => {
      render(<BaseProductDialog {...defaultProps} />);

      const pricingTab = screen.getByText('Pricing');
      pricingTab.click();

      await waitFor(() => {
        expect(screen.getByText('Pricing Information')).toBeInTheDocument();
        expect(screen.getByLabelText('Base Price')).toBeInTheDocument();
        expect(screen.getByLabelText('Trims Cost')).toBeInTheDocument();
      });
    });

    it('switches to Consumption tab and shows consumption fields', async () => {
      render(<BaseProductDialog {...defaultProps} />);

      const consumptionTab = screen.getByText('Consumption');
      consumptionTab.click();

      await waitFor(() => {
        expect(screen.getByText('Consumption Information')).toBeInTheDocument();
        expect(screen.getByLabelText('Adult Consumption')).toBeInTheDocument();
        expect(screen.getByLabelText('Kids Consumption')).toBeInTheDocument();
      });
    });

    it('switches to Media tab and shows media fields', async () => {
      render(<BaseProductDialog {...defaultProps} />);

      const mediaTab = screen.getByText('Media');
      mediaTab.click();

      await waitFor(() => {
        expect(screen.getByText('Media & Branding')).toBeInTheDocument();
        expect(screen.getByText('Product Image')).toBeInTheDocument();
        expect(screen.getByText('Branding Sides')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data in create mode', async () => {
      render(<BaseProductDialog {...defaultProps} />);

      // Fill in required fields
      const nameInput = screen.getByLabelText('Name *');
      nameInput.setAttribute('value', 'Test Product');

      const submitButton = screen.getByText('Create');
      submitButton.click();

      await waitFor(() => {
        expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
      });
    });

    it('submits form with valid data in edit mode', async () => {
      const mockBaseProduct = createMockBaseProduct({ name: 'Test Product' });
      render(<BaseProductDialog {...defaultProps} baseProduct={mockBaseProduct} />);

      const submitButton = screen.getByText('Update');
      submitButton.click();

      await waitFor(() => {
        expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<BaseProductDialog {...defaultProps} />);

      expect(screen.getByLabelText('Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Sort Order')).toBeInTheDocument();
      expect(screen.getByLabelText('Calculator')).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<BaseProductDialog {...defaultProps} />);

      const nameInput = screen.getByLabelText('Name *');
      expect(nameInput).toHaveAttribute('tabindex', expect.any(String));
    });
  });
});
