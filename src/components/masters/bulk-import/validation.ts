
import { BulkImportType, ValidationResult } from './types';

export const validateRow = (row: string[], index: number, type: BulkImportType): ValidationResult => {
  const errors: string[] = [];

  // Basic validation for all types
  if (!row[0]?.trim()) errors.push('First field is required');

  // Type-specific validation
  switch (type) {
    case 'brands':
    case 'categories':
    case 'sizeGroups':
    case 'priceTypes':
      if (row.length < 2) errors.push('Missing required fields');
      if (row[2] && !['active', 'inactive'].includes(row[2].toLowerCase())) {
        errors.push('Status must be "active" or "inactive"');
      }
      break;
      
    case 'colors':
      if (row.length < 2) errors.push('Missing required fields');
      if (!row[1]?.trim()) errors.push('Hex code is required');
      if (!/^#[0-9A-Fa-f]{6}$/.test(row[1])) {
        errors.push('Invalid hex code format');
      }
      if (row[2] && !['active', 'inactive'].includes(row[2].toLowerCase())) {
        errors.push('Status must be "active" or "inactive"');
      }
      break;
      
    case 'zones':
      if (row.length < 2) errors.push('Missing required fields');
      if (row[3] && !['active', 'inactive'].includes(row[3].toLowerCase())) {
        errors.push('Status must be "active" or "inactive"');
      }
      break;
      
    case 'vendors':
      if (row.length < 2) errors.push('Missing required fields');
      if (!row[1]?.trim()) errors.push('Code is required');
      if (row[4] && row[4].trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row[4])) {
        errors.push('Invalid email format');
      }
      if (row[6] && !['active', 'inactive'].includes(row[6].toLowerCase())) {
        errors.push('Status must be "active" or "inactive"');
      }
      break;
      
    case 'styles':
      if (row.length < 2) errors.push('Missing required fields');
      // Brand ID and Category ID are optional but should be valid UUIDs if provided
      if (row[2] && row[2].trim() && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row[2])) {
        errors.push('Invalid Brand ID format (must be UUID)');
      }
      if (row[3] && row[3].trim() && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row[3])) {
        errors.push('Invalid Category ID format (must be UUID)');
      }
      if (row[4] && !['active', 'inactive'].includes(row[4].toLowerCase())) {
        errors.push('Status must be "active" or "inactive"');
      }
      break;
      
    case 'classes':
      if (row.length < 2) errors.push('Missing required fields');
      // Style ID, Color ID, Size Group ID are optional but should be valid UUIDs if provided
      if (row[2] && row[2].trim() && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row[2])) {
        errors.push('Invalid Style ID format (must be UUID)');
      }
      if (row[3] && row[3].trim() && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row[3])) {
        errors.push('Invalid Color ID format (must be UUID)');
      }
      if (row[4] && row[4].trim() && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row[4])) {
        errors.push('Invalid Size Group ID format (must be UUID)');
      }
      if (row[5] && row[5].trim() && (isNaN(parseFloat(row[5])) || parseFloat(row[5]) < 0 || parseFloat(row[5]) > 100)) {
        errors.push('Tax percentage must be a number between 0 and 100');
      }
      if (row[6] && !['active', 'inactive'].includes(row[6].toLowerCase())) {
        errors.push('Status must be "active" or "inactive"');
      }
      break;
      
    case 'skus':
      if (row.length < 3) errors.push('Missing required fields (SKU Code, Class ID, Size ID)');
      if (!row[0]?.trim()) errors.push('SKU Code is required');
      if (!row[1]?.trim()) errors.push('Class ID is required');
      if (!row[2]?.trim()) errors.push('Size ID is required');
      
      // Validate UUIDs
      if (row[1] && row[1].trim() && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row[1])) {
        errors.push('Invalid Class ID format (must be UUID)');
      }
      if (row[2] && row[2].trim() && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row[2])) {
        errors.push('Invalid Size ID format (must be UUID)');
      }
      
      // Validate numeric fields
      if (row[3] && row[3].trim() && (isNaN(parseFloat(row[3])) || parseFloat(row[3]) < 0)) {
        errors.push('Base MRP must be a positive number');
      }
      if (row[4] && row[4].trim() && (isNaN(parseFloat(row[4])) || parseFloat(row[4]) < 0)) {
        errors.push('Cost Price must be a positive number');
      }
      if (row[7] && row[7].trim() && (isNaN(parseFloat(row[7])) || parseFloat(row[7]) < 0)) {
        errors.push('Length must be a positive number');
      }
      if (row[8] && row[8].trim() && (isNaN(parseFloat(row[8])) || parseFloat(row[8]) < 0)) {
        errors.push('Breadth must be a positive number');
      }
      if (row[9] && row[9].trim() && (isNaN(parseFloat(row[9])) || parseFloat(row[9]) < 0)) {
        errors.push('Height must be a positive number');
      }
      if (row[10] && row[10].trim() && (isNaN(parseFloat(row[10])) || parseFloat(row[10]) < 0)) {
        errors.push('Weight must be a positive number');
      }
      
      if (row[11] && !['active', 'inactive'].includes(row[11].toLowerCase())) {
        errors.push('Status must be "active" or "inactive"');
      }
      break;
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Create data object for valid records
  const data = createDataObject(row, type);
  return { valid: true, errors: [], data };
};

const createDataObject = (row: string[], type: BulkImportType): any => {
  switch (type) {
    case 'brands':
      return {
        name: row[0].trim(),
        description: row[1]?.trim() || null,
        status: (row[2]?.toLowerCase() || 'active') as 'active' | 'inactive',
        logo_url: null
      };
      
    case 'categories':
      return {
        name: row[0].trim(),
        description: row[1]?.trim() || null,
        status: (row[2]?.toLowerCase() || 'active') as 'active' | 'inactive',
        parent_id: null
      };
      
    case 'colors':
      return {
        name: row[0].trim(),
        hex_code: row[1].trim(),
        status: (row[2]?.toLowerCase() || 'active') as 'active' | 'inactive'
      };
      
    case 'sizeGroups':
      return {
        name: row[0].trim(),
        description: row[1]?.trim() || null,
        status: (row[2]?.toLowerCase() || 'active') as 'active' | 'inactive'
      };
      
    case 'zones':
      return {
        name: row[0].trim(),
        code: row[1]?.trim() || null,
        description: row[2]?.trim() || null,
        status: (row[3]?.toLowerCase() || 'active') as 'active' | 'inactive'
      };
      
    case 'priceTypes':
      return {
        name: row[0].trim(),
        description: row[1]?.trim() || null,
        status: (row[2]?.toLowerCase() || 'active') as 'active' | 'inactive'
      };
      
    case 'vendors':
      return {
        name: row[0].trim(),
        code: row[1].trim(),
        description: row[2]?.trim() || null,
        contact_person: row[3]?.trim() || null,
        email: row[4]?.trim() || null,
        phone: row[5]?.trim() || null,
        status: (row[6]?.toLowerCase() || 'active') as 'active' | 'inactive'
      };
      
    case 'styles':
      return {
        name: row[0].trim(),
        description: row[1]?.trim() || null,
        brand_id: row[2]?.trim() || null,
        category_id: row[3]?.trim() || null,
        status: (row[4]?.toLowerCase() || 'active') as 'active' | 'inactive'
      };
      
    case 'classes':
      return {
        name: row[0].trim(),
        description: row[1]?.trim() || null,
        style_id: row[2]?.trim() || null,
        color_id: row[3]?.trim() || null,
        size_group_id: row[4]?.trim() || null,
        tax_percentage: row[5]?.trim() ? parseFloat(row[5]) : 0,
        status: (row[6]?.toLowerCase() || 'active') as 'active' | 'inactive',
        selected_sizes: [],
        primary_image_url: null,
        images: []
      };
      
    case 'skus':
      return {
        sku_code: row[0].trim(),
        class_id: row[1].trim(),
        size_id: row[2].trim(),
        base_mrp: row[3]?.trim() ? parseFloat(row[3]) : null,
        cost_price: row[4]?.trim() ? parseFloat(row[4]) : null,
        hsn_code: row[5]?.trim() || null,
        description: row[6]?.trim() || null,
        length_cm: row[7]?.trim() ? parseFloat(row[7]) : null,
        breadth_cm: row[8]?.trim() ? parseFloat(row[8]) : null,
        height_cm: row[9]?.trim() ? parseFloat(row[9]) : null,
        weight_grams: row[10]?.trim() ? parseFloat(row[10]) : null,
        status: (row[11]?.toLowerCase() || 'active') as 'active' | 'inactive',
        price_type_prices: {}
      };
      
    default:
      return {};
  }
};
