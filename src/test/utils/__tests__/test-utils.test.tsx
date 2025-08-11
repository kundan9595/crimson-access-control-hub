import { render, screen } from '@/test/utils';
import { createMockBrand } from '@/test/utils/mock-data';

// Simple test component
const TestComponent = () => (
  <div>
    <h1>Test Component</h1>
    <button>Click me</button>
  </div>
);

describe('Test Utils', () => {
  it('renders component with providers', () => {
    render(<TestComponent />);
    
    expect(screen.getByText('Test Component')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('creates mock data correctly', () => {
    const mockBrand = createMockBrand({ name: 'Test Brand' });
    
    expect(mockBrand).toHaveProperty('id');
    expect(mockBrand).toHaveProperty('name', 'Test Brand');
    expect(mockBrand).toHaveProperty('status');
    expect(mockBrand).toHaveProperty('created_at');
  });

  it('renders without specific providers when disabled', () => {
    render(<TestComponent />, { withRouter: false, withQueryClient: false });
    
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });
});
