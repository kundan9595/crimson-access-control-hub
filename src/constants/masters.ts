
export const MASTER_ENTITY_CONFIG = {
  brands: {
    templateHeaders: ['Name', 'Description', 'Status'],
    sampleData: [
      ['Apple', 'Technology company', 'active'],
      ['Samsung', 'Electronics manufacturer', 'active']
    ],
    exportFields: ['name', 'description', 'status', 'created_at'] as const,
  },
  categories: {
    templateHeaders: ['Name', 'Description', 'Status'],
    sampleData: [
      ['Electronics', 'Electronic devices and gadgets', 'active'],
      ['Clothing', 'Apparel and accessories', 'active']
    ],
    exportFields: ['name', 'description', 'status', 'created_at'] as const,
  },
  colors: {
    templateHeaders: ['Name', 'Hex Code', 'Status'],
    sampleData: [
      ['Red', '#FF0000', 'active'],
      ['Blue', '#0000FF', 'active']
    ],
    exportFields: ['name', 'hex_code', 'status', 'created_at'] as const,
  },
  priceTypes: {
    templateHeaders: ['Name', 'Description', 'Status'],
    sampleData: [
      ['Wholesale', 'Bulk pricing for wholesale customers', 'active'],
      ['Retail', 'Standard retail pricing', 'active']
    ],
    exportFields: ['name', 'description', 'status', 'created_at'] as const,
  },
  styles: {
    templateHeaders: ['Name', 'Description', 'Brand ID', 'Category ID', 'Status'],
    sampleData: [
      ['Summer Collection', 'Lightweight summer clothing', '', '', 'active'],
      ['Winter Collection', 'Warm winter clothing', '', '', 'active']
    ],
    exportFields: ['name', 'description', 'status', 'created_at'] as const,
  },
  classes: {
    templateHeaders: ['Name', 'Description', 'Style ID', 'Color ID', 'Size Group ID', 'Tax Percentage', 'Status'],
    sampleData: [
      ['Summer T-Shirt Red', 'Red variant of summer t-shirt', 'style-uuid-1', 'color-uuid-1', 'size-group-uuid-1', '18', 'active'],
      ['Winter Jacket Blue', 'Blue winter jacket', 'style-uuid-2', 'color-uuid-2', 'size-group-uuid-2', '12', 'active']
    ],
    exportFields: ['name', 'description', 'tax_percentage', 'status', 'created_at'] as const,
  },
  skus: {
    templateHeaders: [
      'SKU Code', 'Class ID', 'Size ID', 'Base MRP', 'Cost Price', 
      'HSN Code', 'Description', 'Length (cm)', 'Breadth (cm)', 
      'Height (cm)', 'Weight (grams)', 'Status'
    ],
    sampleData: [
      [
        'SKU001', 'class-uuid-here', 'size-uuid-here', '1000', '800',
        '62011090', 'Sample SKU description', '30', '20', '10', '500', 'active'
      ],
      [
        'SKU002', 'class-uuid-here', 'size-uuid-here', '1500', '1200',
        '62011090', 'Another sample SKU', '25', '15', '8', '400', 'active'
      ]
    ],
    exportFields: [
      'sku_code', 'base_mrp', 'cost_price', 'hsn_code', 'description',
      'length_cm', 'breadth_cm', 'height_cm', 'weight_grams', 'status'
    ] as const,
  },
} as const;

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
] as const;

export const DEFAULT_PAGE_SIZE = 50;
export const SEARCH_DEBOUNCE_MS = 300;
