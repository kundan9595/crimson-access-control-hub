export interface MasterDependency {
  table: string;
  lookupField: string;
  nameField: string;
  description?: string;
  required?: boolean;
  multiple?: boolean;
}

export interface MasterConfig {
  dependencies: MasterDependency[];
  independent: boolean;
  level: number;
  templateHeaders: string[];
  sampleData: string[][];
  exportFields: readonly string[];
}

export const MASTER_DEPENDENCIES: Record<string, MasterConfig> = {
  // Level 0 - Independent Masters
  brands: {
    dependencies: [],
    independent: true,
    level: 0,
    templateHeaders: ['Name', 'Description', 'Status'],
    sampleData: [
      ['Apple', 'Technology company', 'active'],
      ['Samsung', 'Electronics manufacturer', 'active']
    ],
    exportFields: ['name', 'description', 'status', 'created_at'] as const,
  },
  customers: {
    dependencies: [],
    independent: true,
    level: 0,
    templateHeaders: [
      'Customer Code', 'Company Name', 'Contact Person', 'Email', 'Phone', 
      'Address', 'City', 'State', 'Postal Code', 'Customer Type', 'GST', 'Status'
    ],
    sampleData: [
      [
        'CUST001', 'Smith Retail Pvt Ltd', 'John Smith', 'john@smithretail.com', '+91-9876543210',
        '123 Main Street, Mumbai', 'Mumbai', 'Maharashtra', '400001', 'retail', '27AABCU9603R1ZX', 'active'
      ],
      [
        'CUST002', 'Wholesale Distributors', 'Priya Sharma', 'priya@wholesale.com', '+91-9876543211',
        '456 Business Park, Delhi', 'Delhi', 'Delhi', '110001', 'wholesale', '07AABCU9603R1ZY', 'active'
      ]
    ],
    exportFields: [
      'customer_code', 'company_name', 'contact_person', 'email', 'phone', 
      'address', 'city', 'state', 'postal_code', 'customer_type', 'gst', 'status', 'created_at'
    ] as const,
  },
  categories: {
    dependencies: [],
    independent: true,
    level: 0,
    templateHeaders: ['Name', 'Description', 'Image URL', 'Sort Order', 'Status'],
    sampleData: [
      ['Electronics', 'Electronic devices and gadgets', 'https://example.com/electronics.jpg', '1', 'active'],
      ['Clothing', 'Apparel and accessories', 'https://example.com/clothing.jpg', '2', 'active']
    ],
    exportFields: ['name', 'description', 'image_url', 'status', 'created_at'] as const,
  },
  colors: {
    dependencies: [],
    independent: true,
    level: 0,
    templateHeaders: ['Name', 'Hex Code', 'Status'],
    sampleData: [
      ['Red', '#FF0000', 'active'],
      ['Blue', '#0000FF', 'active']
    ],
    exportFields: ['name', 'hex_code', 'status', 'created_at'] as const,
  },
  sizeGroups: {
    dependencies: [],
    independent: true,
    level: 0,
    templateHeaders: ['Name', 'Description', 'Status'],
    sampleData: [
      ['Small', 'Small size group', 'active'],
      ['Medium', 'Medium size group', 'active']
    ],
    exportFields: ['name', 'description', 'status', 'created_at'] as const,
  },
  zones: {
    dependencies: [],
    independent: true,
    level: 0,
    templateHeaders: ['Name', 'Status'],
    sampleData: [
      ['North Zone', 'active'],
      ['South Zone', 'active']
    ],
    exportFields: ['name', 'status', 'created_at'] as const,
  },
  priceTypes: {
    dependencies: [],
    independent: true,
    level: 0,
    templateHeaders: ['Name', 'Category', 'Description', 'Status'],
    sampleData: [
      ['Wholesale', 'customer', 'Bulk pricing for wholesale customers', 'active'],
      ['Retail', 'customer', 'Standard retail pricing', 'active']
    ],
    exportFields: ['name', 'category', 'description', 'status', 'created_at'] as const,
  },
  vendors: {
    dependencies: [],
    independent: true,
    level: 0,
    templateHeaders: ['Name', 'Code', 'Contact Person', 'Email', 'Phone', 'Status'],
    sampleData: [
      ['Vendor A', 'V001', 'John Doe', 'john@vendor.com', '1234567890', 'active'],
      ['Vendor B', 'V002', 'Jane Smith', 'jane@vendor.com', '0987654321', 'active']
    ],
    exportFields: ['name', 'code', 'contact_person', 'email', 'phone', 'status', 'created_at'] as const,
  },
  parts: {
    dependencies: [],
    independent: true,
    level: 0,
    templateHeaders: ['Name', 'Order Criteria', 'Sort Position', 'Status'],
    sampleData: [
      ['Part A', 'true', '1', 'active'],
      ['Part B', 'false', '2', 'active']
    ],
    exportFields: ['name', 'order_criteria', 'sort_position', 'status', 'created_at'] as const,
  },
  fabrics: {
    dependencies: [],
    independent: true,
    level: 0,
    templateHeaders: ['Name', 'Fabric Type', 'GSM', 'UOM', 'Price', 'Colors (comma-separated)', 'Status'],
    sampleData: [
      ['Cotton Fabric', 'Cotton', '150', 'meter', '50.00', 'Red, Blue', 'active'],
      ['Poly Cotton', 'Poly Cotton', '120', 'meter', '45.00', 'Green', 'active']
    ],
    exportFields: ['name', 'fabric_type', 'gsm', 'uom', 'price', 'status', 'created_at'] as const,
  },

  // Level 1 - Dependent Masters
  styles: {
    dependencies: [
      { table: 'brands', lookupField: 'brand_id', nameField: 'name', required: false },
      { table: 'categories', lookupField: 'category_id', nameField: 'name', required: false }
    ],
    independent: false,
    level: 1,
    templateHeaders: ['Name', 'Description', 'Brand Name', 'Category Name', 'Status'],
    sampleData: [
      ['Summer Collection', 'Lightweight summer clothing', 'Apple', 'Clothing', 'active'],
      ['Winter Collection', 'Warm winter clothing', 'Samsung', 'Electronics', 'active']
    ],
    exportFields: ['name', 'description', 'status', 'created_at'] as const,
  },
  classes: {
    dependencies: [
      { table: 'styles', lookupField: 'style_id', nameField: 'name', required: false },
      { table: 'colors', lookupField: 'color_id', nameField: 'name', required: false },
      { table: 'sizeGroups', lookupField: 'size_group_id', nameField: 'name', required: false }
    ],
    independent: false,
    level: 1,
    templateHeaders: ['Name', 'Description', 'Style Name', 'Color Name', 'Size Group Name', 'GST Rate', 'Status'],
    sampleData: [
      ['Summer T-Shirt Red', 'Red variant of summer t-shirt', 'Summer Collection', 'Red', 'Small', '18', 'active'],
      ['Winter Jacket Blue', 'Blue winter jacket', 'Winter Collection', 'Blue', 'Medium', '12', 'active']
    ],
    exportFields: ['name', 'description', 'gst_rate', 'status', 'created_at'] as const,
  },
  appAssets: {
    dependencies: [
      { table: 'add-ons', lookupField: 'add_on_id', nameField: 'name', required: false }
    ],
    independent: false,
    level: 1,
    templateHeaders: ['Name', 'dX', 'dY', 'Mirror dX', 'Height Resp', 'Add-On Name', 'Status'],
    sampleData: [
      ['Asset 1', '10', '20', '15', '100', 'Add-On A', 'active'],
      ['Asset 2', '5', '15', '10', '80', 'Add-On B', 'active']
    ],
    exportFields: ['name', 'dx', 'dy', 'mirror_dx', 'asset_height_resp_to_box', 'status', 'created_at'] as const,
  },

  // Level 2 - Deep Dependent Masters
  skus: {
    dependencies: [
      { table: 'classes', lookupField: 'class_id', nameField: 'name', required: true },
      { table: 'sizes', lookupField: 'size_id', nameField: 'name', required: true }
    ],
    independent: false,
    level: 2,
    templateHeaders: [
      'SKU Code', 'Class Name', 'Style Name', 'Color Name', 'Size Group Name', 'Size Name', 'Base MRP', 'Cost Price', 
      'HSN Code', 'Description', 'Length (cm)', 'Breadth (cm)', 
      'Height (cm)', 'Weight (grams)', 'Status'
    ],
    sampleData: [
      [
        'SKU001', 'Summer T-Shirt Red', 'Summer Collection', 'Red', 'Small', 'S', '1000', '800',
        '62011090', 'Sample SKU description', '30', '20', '10', '500', 'active'
      ],
      [
        'SKU002', 'Winter Jacket Blue', 'Winter Collection', 'Blue', 'Medium', 'M', '1500', '1200',
        '62011090', 'Another sample SKU', '25', '15', '8', '400', 'active'
      ]
    ],
    exportFields: [
      'sku_code', 'base_mrp', 'cost_price', 'hsn_code', 'description',
      'length_cm', 'breadth_cm', 'height_cm', 'weight_grams', 'status'
    ] as const,
  },

  // Complex Dependencies
  baseProducts: {
    dependencies: [
      { table: 'categories', lookupField: 'category_id', nameField: 'name', required: false },
      { table: 'fabrics', lookupField: 'fabric_id', nameField: 'name', required: false },
      { table: 'sizeGroups', lookupField: 'size_group_ids', nameField: 'name', required: false, multiple: true },
      { table: 'parts', lookupField: 'parts', nameField: 'name', required: false, multiple: true }
    ],
    independent: false,
    level: 1,
    templateHeaders: [
      'Name', 'Sort Order', 'Category Name', 'Fabric Name', 'Size Group Names (comma-separated)', 
      'Part Names (comma-separated)', 'Base Price', 'Trims Cost', 'Adult Consumption', 
      'Kids Consumption', 'Overhead Percentage', 'Sample Rate', 'Status'
    ],
    sampleData: [
      [
        'Product A', '1', 'Clothing', 'Cotton Fabric', 'Small,Medium', 'Part A,Part B',
        '500', '50', '2.5', '1.5', '15', '5', 'active'
      ]
    ],
    exportFields: [
      'name', 'sort_order', 'base_price', 'trims_cost', 'adult_consumption',
      'kids_consumption', 'overhead_percentage', 'sample_rate', 'status', 'created_at'
    ] as const,
  },
  promotionalBanners: {
    dependencies: [
      { table: 'categories', lookupField: 'category_id', nameField: 'name', required: false },
      { table: 'brands', lookupField: 'brand_id', nameField: 'name', required: true },
      { table: 'classes', lookupField: 'class_id', nameField: 'name', required: false }
    ],
    independent: false,
    level: 1,
    templateHeaders: ['Title', 'Category Name', 'Brand Name', 'Class Name', 'Style Name', 'Color Name', 'Size Group Name', 'Position', 'Status'],
    sampleData: [
      ['Summer Sale', 'Clothing', 'Apple', 'Summer T-Shirt Red', 'Summer Collection', 'Red', 'Small', '1', 'active'],
      ['Winter Collection', 'Electronics', 'Samsung', 'Winter Jacket Blue', 'Winter Collection', 'Blue', 'Medium', '2', 'active']
    ],
    exportFields: ['title', 'position', 'status', 'created_at'] as const,
  },

  // Add-ons (independent but referenced by appAssets)
  'add-ons': {
    dependencies: [],
    independent: true,
    level: 0,
    templateHeaders: ['Name', 'Select Type', 'Price', 'Status'],
    sampleData: [
      ['Add-On A', 'single', '10.00', 'active'],
      ['Add-On B', 'multiple', '15.00', 'active']
    ],
    exportFields: ['name', 'select_type', 'price', 'status', 'created_at'] as const,
  },

  // Sizes (independent but referenced by skus)
  sizes: {
    dependencies: [
      { table: 'sizeGroups', lookupField: 'size_group_id', nameField: 'name', required: true }
    ],
    independent: false,
    level: 1,
    templateHeaders: ['Name', 'Code', 'Size Group Name', 'Status'],
    sampleData: [
      ['Small', 'S', 'Small', 'active'],
      ['Medium', 'M', 'Medium', 'active']
    ],
    exportFields: ['name', 'code', 'status', 'created_at'] as const,
  },

  // Promotional Assets (independent)
  promotionalAssets: {
    dependencies: [],
    independent: true,
    level: 0,
    templateHeaders: ['Name', 'Type', 'Link', 'Status'],
    sampleData: [
      ['Asset 1', 'Video', 'https://example.com/video', 'active'],
      ['Asset 2', 'Images', '', 'active']
    ],
    exportFields: ['name', 'type', 'link', 'status', 'created_at'] as const,
  },
  // Inventory (dependent on SKUs and warehouse structure)
  inventory: {
    dependencies: [
      {
        table: 'skus',
        lookupField: 'sku_code',
        nameField: 'sku_code',
        description: 'SKU to add inventory for',
        required: true
      },
      {
        table: 'warehouse_floors',
        lookupField: 'name',
        nameField: 'name',
        description: 'Floor name where inventory is stored',
        required: true
      },
      {
        table: 'warehouse_lanes',
        lookupField: 'name',
        nameField: 'name',
        description: 'Lane name where inventory is stored',
        required: true
      },
      {
        table: 'warehouse_racks',
        lookupField: 'rack_name',
        nameField: 'rack_name',
        description: 'Rack name where inventory is stored',
        required: true
      }
    ],
    independent: false,
    level: 1,
    templateHeaders: ['SKU Code', 'Floor Name', 'Lane Name', 'Rack Name', 'Quantity'],
    sampleData: [
      ['SKU001', 'Floor 1', 'Lane A', 'Rack 1', '100'],
      ['SKU002', 'Floor 1', 'Lane B', 'Rack 2', '50']
    ],
    exportFields: ['sku_code', 'floor_name', 'lane_name', 'rack_name', 'quantity', 'total_quantity', 'reserved_quantity', 'available_quantity', 'created_at'] as const,
  },
  // Orders (complex entity with customer, addresses, and items)
  orders: {
    dependencies: [
      { table: 'customers', lookupField: 'customer_id', nameField: 'customer_code', required: true },
      { table: 'priceTypes', lookupField: 'price_type_id', nameField: 'name', required: false },
      { table: 'skus', lookupField: 'sku_id', nameField: 'sku_code', required: false },
      { table: 'sizes', lookupField: 'size_id', nameField: 'name', required: false }
    ],
    independent: false,
    level: 2,
    templateHeaders: [
      // Order fields
      'Order Number',
      'Customer Code',
      'Price Type Name',
      'Expected Delivery Date',
      'Shipment Time',
      'Payment Mode',
      'Order Remarks',
      'Ship To Label',
      'Ship To Address',
      'Ship To City',
      'Ship To State',
      'Ship To Postal Code',
      'Ship To Type',
      'Bill To Label',
      'Bill To Address',
      'Bill To City',
      'Bill To State',
      'Bill To Postal Code',
      'Bill To Type',
      'Status',
      // Order Item fields
      'Item Type',
      'SKU Code',
      'Size Name',
      'Misc Name',
      'Quantity',
      'Price Type Name (Item)',
      'Unit Price',
      'Discount Percentage',
      'GST Rate',
      'Status'
    ],
    sampleData: [
      [
        'ORD001',
        'CUST001',
        'Wholesale',
        '2024-12-31',
        '10:00 AM',
        'credit',
        'Urgent delivery required',
        'Main Office',
        '123 Main Street, Mumbai',
        'Mumbai',
        'Maharashtra',
        '400001',
        'office',
        'Main Office',
        '123 Main Street, Mumbai',
        'Mumbai',
        'Maharashtra',
        '400001',
        'office',
        'draft',
        'sku',
        'SKU001',
        'S',
        '',
        '10',
        'Wholesale',
        '1000.00',
        '5',
        '18',
        'active'
      ],
      [
        'ORD002',
        'CUST002',
        'Retail',
        '2024-12-25',
        '2:00 PM',
        'cash',
        'Standard order',
        'Warehouse',
        '456 Business Park, Delhi',
        'Delhi',
        'Delhi',
        '110001',
        'delivery',
        'Head Office',
        '789 Corporate Tower, Delhi',
        'Delhi',
        'Delhi',
        '110002',
        'billing',
        'confirmed',
        'misc',
        '',
        'M',
        'Custom Item',
        '5',
        'Retail',
        '500.00',
        '0',
        '0',
        'active'
      ]
    ],
    exportFields: [
      'order_number',
      'status',
      'price_type',
      'expected_delivery_date',
      'shipment_time',
      'payment_mode',
      'order_remarks',
      'order_subtotal',
      'order_discount_amount',
      'order_total_amount',
      'customer_code',
      'customer_company_name',
      'customer_contact_person',
      'customer_email',
      'customer_phone',
      'customer_type',
      'customer_gst',
      'ship_to_label',
      'ship_to_address',
      'ship_to_city',
      'ship_to_state',
      'ship_to_postal_code',
      'ship_to_type',
      'bill_to_label',
      'bill_to_address',
      'bill_to_city',
      'bill_to_state',
      'bill_to_postal_code',
      'bill_to_type',
      'item_type',
      'sku_code',
      'class_name',
      'style_name',
      'brand_name',
      'category_name',
      'color_name',
      'size_name',
      'misc_name',
      'item_quantity',
      'item_unit_price',
      'item_discount_percentage',
      'item_discount_amount',
      'item_subtotal',
      'item_gst_rate',
      'item_gst_amount',
      'created_at',
      'updated_at'
    ] as const,
  },
};

// Helper functions
export function getMasterLevel(masterType: string): number {
  return MASTER_DEPENDENCIES[masterType]?.level ?? 0;
}

export function getMasterDependencies(masterType: string): MasterDependency[] {
  return MASTER_DEPENDENCIES[masterType]?.dependencies ?? [];
}

export function isIndependentMaster(masterType: string): boolean {
  return MASTER_DEPENDENCIES[masterType]?.independent ?? true;
}

export function getDependencyOrder(): string[] {
  const masters = Object.keys(MASTER_DEPENDENCIES);
  return masters.sort((a, b) => {
    const levelA = getMasterLevel(a);
    const levelB = getMasterLevel(b);
    return levelA - levelB;
  });
}

export function getMasterConfig(masterType: string): MasterConfig | undefined {
  return MASTER_DEPENDENCIES[masterType];
}

// New function to dynamically generate complete template headers with all nested dependencies
export function generateCompleteTemplateHeaders(masterType: string): { headers: string[], sampleData: string[][] } {
  const config = getMasterConfig(masterType);
  if (!config) {
    return { headers: [], sampleData: [] };
  }

  const allHeaders: string[] = [];
  const allSampleData: string[][] = [];
  const processedDependencies = new Set<string>();

  // Helper function to recursively get all dependency fields with proper naming
  function getDependencyFields(dep: MasterDependency, depth: number = 0, prefix: string = ''): string[] {
    if (processedDependencies.has(dep.table)) {
      return [];
    }
    processedDependencies.add(dep.table);

    const depConfig = getMasterConfig(dep.table);
    if (!depConfig) {
      return [`${prefix}${dep.nameField} Name`];
    }

    const fields: string[] = [];
    const depPrefix = prefix || `${dep.table.charAt(0).toUpperCase() + dep.table.slice(1)} `;
    
    // Add the dependency's own fields with proper naming
    depConfig.templateHeaders.forEach(header => {
      if (header === 'Name') {
        fields.push(`${depPrefix}Name`);
      } else if (header === 'Description') {
        fields.push(`${depPrefix}Description`);
      } else if (header === 'Status') {
        fields.push(`${depPrefix}Status`);
      } else if (!header.includes('Name') || header === `${dep.nameField} Name`) {
        fields.push(`${depPrefix}${header}`);
      }
    });

    // Recursively add nested dependency fields with updated prefix
    depConfig.dependencies.forEach(nestedDep => {
      const nestedFields = getDependencyFields(nestedDep, depth + 1, `${depPrefix}`);
      fields.push(...nestedFields);
    });

    return fields;
  }

  // Start with the main master's own fields
  config.templateHeaders.forEach(header => {
    if (header === 'Name') {
      allHeaders.push(`${masterType.charAt(0).toUpperCase() + masterType.slice(1)} Name`);
    } else if (header === 'Description') {
      allHeaders.push(`${masterType.charAt(0).toUpperCase() + masterType.slice(1)} Description`);
    } else if (header === 'Status') {
      allHeaders.push(`${masterType.charAt(0).toUpperCase() + masterType.slice(1)} Status`);
    } else if (!header.includes('Name') || header === 'Name') {
      allHeaders.push(header);
    }
  });

  // Add all dependency fields
  config.dependencies.forEach(dep => {
    const depFields = getDependencyFields(dep);
    allHeaders.push(...depFields);
  });

  // Remove duplicates while preserving order
  const uniqueHeaders = allHeaders.filter((header, index) => allHeaders.indexOf(header) === index);

  // Generate sample data
  const sampleRow: string[] = [];
  uniqueHeaders.forEach(header => {
    // Generate appropriate sample data based on header type
    if (header.includes('Name')) {
      sampleRow.push('Sample ' + header);
    } else if (header.includes('Code')) {
      sampleRow.push('CODE001');
    } else if (header.includes('Price') || header.includes('Cost') || header.includes('MRP')) {
      sampleRow.push('100.00');
    } else if (header.includes('Status')) {
      sampleRow.push('active');
    } else if (header.includes('Description')) {
      sampleRow.push('Sample description');
    } else if (header.includes('Email')) {
      sampleRow.push('sample@example.com');
    } else if (header.includes('Phone')) {
      sampleRow.push('1234567890');
    } else if (header.includes('Type')) {
      sampleRow.push('sample');
    } else if (header.includes('Rate') || header.includes('Percentage')) {
      sampleRow.push('10');
    } else if (header.includes('Order') || header.includes('Position')) {
      sampleRow.push('1');
    } else if (header.includes('GSM')) {
      sampleRow.push('150');
    } else if (header.includes('UOM')) {
      sampleRow.push('meter');
    } else if (header.includes('Length') || header.includes('Height') || header.includes('Breadth')) {
      sampleRow.push('10');
    } else if (header.includes('Weight')) {
      sampleRow.push('100');
    } else if (header.includes('HSN')) {
      sampleRow.push('62011090');
    } else if (header.includes('Hex')) {
      sampleRow.push('#FF0000');
    } else if (header.includes('Link') || header.includes('Image URL') || header.includes('Logo URL')) {
      sampleRow.push('https://example.com/image.jpg');
    } else if (header.includes('Select Type')) {
      sampleRow.push('single');
    } else if (header.includes('dX') || header.includes('dY')) {
      sampleRow.push('10');
    } else if (header.includes('Height Resp')) {
      sampleRow.push('100');
    } else if (header.includes('Consumption')) {
      sampleRow.push('2.5');
    } else if (header.includes('Trims Cost')) {
      sampleRow.push('50');
    } else if (header.includes('Sample Rate')) {
      sampleRow.push('5');
    } else if (header.includes('Criteria')) {
      sampleRow.push('true');
    } else if (header.includes('Size Group Name')) {
      sampleRow.push('Small,Medium');
    } else if (header.includes('Part Names')) {
      sampleRow.push('Part A,Part B');
    } else if (header.includes('Size Group Names')) {
      sampleRow.push('Small,Medium');
    } else {
      sampleRow.push('sample');
    }
  });

  allSampleData.push(sampleRow);

  return { headers: uniqueHeaders, sampleData: allSampleData };
}

// Debug function to see what columns would be generated
export function debugTemplateHeaders(masterType: string): void {
  const result = generateCompleteTemplateHeaders(masterType);
      // Template headers and sample data generated
} 