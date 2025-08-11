import { faker } from '@faker-js/faker';

// Base entity interface
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Brand mock data
export interface MockBrand extends BaseEntity {
  name: string;
  description?: string;
  logo_url?: string;
  sort_order?: number;
  status: 'active' | 'inactive';
}

export const createMockBrand = (overrides: Partial<MockBrand> = {}): MockBrand => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  description: faker.lorem.sentence(),
  logo_url: faker.image.url(),
  sort_order: faker.number.int({ min: 0, max: 100 }),
  status: faker.helpers.arrayElement(['active', 'inactive']),
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createMockBrands = (count: number, overrides: Partial<MockBrand> = {}): MockBrand[] =>
  Array.from({ length: count }, () => createMockBrand(overrides));

// Category mock data
export interface MockCategory extends BaseEntity {
  name: string;
  description?: string;
  sort_order?: number;
  status: 'active' | 'inactive';
}

export const createMockCategory = (overrides: Partial<MockCategory> = {}): MockCategory => ({
  id: faker.string.uuid(),
  name: faker.commerce.department(),
  description: faker.lorem.sentence(),
  sort_order: faker.number.int({ min: 0, max: 100 }),
  status: faker.helpers.arrayElement(['active', 'inactive']),
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createMockCategories = (count: number, overrides: Partial<MockCategory> = {}): MockCategory[] =>
  Array.from({ length: count }, () => createMockCategory(overrides));

// Color mock data
export interface MockColor extends BaseEntity {
  name: string;
  hex_code: string;
  sort_order?: number;
  status: 'active' | 'inactive';
}

export const createMockColor = (overrides: Partial<MockColor> = {}): MockColor => ({
  id: faker.string.uuid(),
  name: faker.color.human(),
  hex_code: faker.color.rgb(),
  sort_order: faker.number.int({ min: 0, max: 100 }),
  status: faker.helpers.arrayElement(['active', 'inactive']),
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createMockColors = (count: number, overrides: Partial<MockColor> = {}): MockColor[] =>
  Array.from({ length: count }, () => createMockColor(overrides));

// Size Group mock data
export interface MockSizeGroup extends BaseEntity {
  name: string;
  description?: string;
  sort_order?: number;
  status: 'active' | 'inactive';
}

export const createMockSizeGroup = (overrides: Partial<MockSizeGroup> = {}): MockSizeGroup => ({
  id: faker.string.uuid(),
  name: faker.commerce.productAdjective(),
  description: faker.lorem.sentence(),
  sort_order: faker.number.int({ min: 0, max: 100 }),
  status: faker.helpers.arrayElement(['active', 'inactive']),
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createMockSizeGroups = (count: number, overrides: Partial<MockSizeGroup> = {}): MockSizeGroup[] =>
  Array.from({ length: count }, () => createMockSizeGroup(overrides));

// Base Product mock data
export interface MockBaseProduct extends BaseEntity {
  name: string;
  sort_order?: number;
  calculator?: number;
  category_id?: string;
  fabric_id?: string;
  size_group_ids?: string[];
  parts?: string[];
  base_price?: number;
  base_sn?: number;
  trims_cost?: number;
  adult_consumption?: number;
  kids_consumption?: number;
  overhead_percentage?: number;
  sample_rate?: number;
  image_url?: string;
  base_icon_url?: string;
  branding_sides?: string[];
  status: 'active' | 'inactive';
}

export const createMockBaseProduct = (overrides: Partial<MockBaseProduct> = {}): MockBaseProduct => ({
  id: faker.string.uuid(),
  name: faker.commerce.productName(),
  sort_order: faker.number.int({ min: 0, max: 100 }),
  calculator: faker.number.float({ min: 0, max: 1000 }),
  category_id: faker.string.uuid(),
  fabric_id: faker.string.uuid(),
  size_group_ids: [faker.string.uuid()],
  parts: [faker.string.uuid()],
  base_price: faker.number.float({ min: 0, max: 1000 }),
  base_sn: faker.number.int({ min: 0, max: 1000 }),
  trims_cost: faker.number.float({ min: 0, max: 100 }),
  adult_consumption: faker.number.float({ min: 0, max: 10 }),
  kids_consumption: faker.number.float({ min: 0, max: 10 }),
  overhead_percentage: faker.number.float({ min: 0, max: 100 }),
  sample_rate: faker.number.float({ min: 0, max: 100 }),
  image_url: faker.image.url(),
  base_icon_url: faker.image.url(),
  branding_sides: ['Front Side', 'Back Side'],
  status: faker.helpers.arrayElement(['active', 'inactive']),
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createMockBaseProducts = (count: number, overrides: Partial<MockBaseProduct> = {}): MockBaseProduct[] =>
  Array.from({ length: count }, () => createMockBaseProduct(overrides));

// Inventory mock data
export interface MockInventoryItem {
  sku_id: string;
  sku_code: string;
  brand_name?: string;
  style_name?: string;
  class_name?: string;
  color_name?: string;
  size_name?: string;
  total_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  warehouse_count: number;
  location_count: number;
}

export const createMockInventoryItem = (overrides: Partial<MockInventoryItem> = {}): MockInventoryItem => ({
  sku_id: faker.string.uuid(),
  sku_code: faker.string.alphanumeric(8).toUpperCase(),
  brand_name: faker.company.name(),
  style_name: faker.commerce.productName(),
  class_name: faker.commerce.department(),
  color_name: faker.color.human(),
  size_name: faker.helpers.arrayElement(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
  total_quantity: faker.number.int({ min: 0, max: 1000 }),
  reserved_quantity: faker.number.int({ min: 0, max: 100 }),
  available_quantity: faker.number.int({ min: 0, max: 900 }),
  warehouse_count: faker.number.int({ min: 1, max: 5 }),
  location_count: faker.number.int({ min: 1, max: 20 }),
  ...overrides,
});

export const createMockInventoryItems = (count: number, overrides: Partial<MockInventoryItem> = {}): MockInventoryItem[] =>
  Array.from({ length: count }, () => createMockInventoryItem(overrides));

// User mock data
export interface MockUser extends BaseEntity {
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  status: 'active' | 'inactive';
}

export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  role: faker.helpers.arrayElement(['admin', 'user', 'manager']),
  status: faker.helpers.arrayElement(['active', 'inactive']),
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createMockUsers = (count: number, overrides: Partial<MockUser> = {}): MockUser[] =>
  Array.from({ length: count }, () => createMockUser(overrides));

// Warehouse mock data
export interface MockWarehouse extends BaseEntity {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  status: 'active' | 'inactive';
}

export const createMockWarehouse = (overrides: Partial<MockWarehouse> = {}): MockWarehouse => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  description: faker.lorem.sentence(),
  address: faker.location.streetAddress(),
  city: faker.location.city(),
  state: faker.location.state(),
  country: faker.location.country(),
  postal_code: faker.location.zipCode(),
  contact_person: faker.person.fullName(),
  contact_email: faker.internet.email(),
  contact_phone: faker.phone.number(),
  status: faker.helpers.arrayElement(['active', 'inactive']),
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createMockWarehouses = (count: number, overrides: Partial<MockWarehouse> = {}): MockWarehouse[] =>
  Array.from({ length: count }, () => createMockWarehouse(overrides));

// API Response mock data
export interface MockApiResponse<T> {
  data: T;
  error: null;
}

export interface MockApiError {
  data: null;
  error: {
    message: string;
    code?: string;
  };
}

export const createMockApiResponse = <T>(data: T): MockApiResponse<T> => ({
  data,
  error: null,
});

export const createMockApiError = (message: string, code?: string): MockApiError => ({
  data: null,
  error: {
    message,
    code,
  },
});

// Query Result mock data
export interface MockQueryResult<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export const createMockQueryResult = <T>(
  data: T,
  options: {
    isLoading?: boolean;
    error?: Error | null;
    isFetching?: boolean;
    isSuccess?: boolean;
    isError?: boolean;
  } = {}
): MockQueryResult<T> => ({
  data,
  isLoading: false,
  error: null,
  isFetching: false,
  isSuccess: true,
  isError: false,
  ...options,
});

// Mutation Result mock data
export interface MockMutationResult {
  mutate: jest.Mock;
  mutateAsync: jest.Mock;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  data: any;
  reset: jest.Mock;
}

export const createMockMutationResult = (options: Partial<MockMutationResult> = {}): MockMutationResult => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: null,
  reset: jest.fn(),
  ...options,
});
