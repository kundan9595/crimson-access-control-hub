import { BulkImportType, ValidationResult } from './types';
import { getMasterConfig, getMasterDependencies } from '@/constants/masterDependencies';

export function validateRowEnhanced(row: string[], index: number, type: BulkImportType): ValidationResult {
  const errors: string[] = [];
  let data: any = {};

  const config = getMasterConfig(type);
  if (!config) {
    errors.push('Unsupported import type');
    return { valid: false, errors };
  }

  // Validate based on template headers
  const headers = config.templateHeaders;
  
  // Map row data to headers
  headers.forEach((header, headerIndex) => {
    const value = row[headerIndex]?.trim() || '';
    
    // Handle different field types
    if (header.toLowerCase().includes('name') && !header.toLowerCase().includes('names')) {
      // Single name field
      if (!value) {
        if (isRequiredField(header, type)) {
          errors.push(`${header} is required`);
        }
      } else {
        data[header.replace(/\s+/g, '_').toLowerCase()] = value;
      }
    } else if (header.toLowerCase().includes('names') && header.toLowerCase().includes('comma-separated')) {
      // Multiple names field (comma-separated)
      if (value) {
        const names = value.split(',').map(n => n.trim()).filter(n => n);
        data[header.replace(/\s+/g, '_').toLowerCase().replace(/\(comma-separated\)/g, '').trim()] = names;
      }
    } else if (header.toLowerCase().includes('description')) {
      // Description field (optional)
      if (value) {
        data.description = value;
      }
    } else if (header.toLowerCase().includes('status')) {
      // Status field
      if (value) {
        if (!['active', 'inactive'].includes(value.toLowerCase())) {
          errors.push(`${header} must be either "active" or "inactive"`);
        } else {
          data.status = value.toLowerCase();
        }
      } else {
        data.status = 'active';
      }
    } else if (header.toLowerCase().includes('hex code')) {
      // Hex code field
      if (value) {
        if (!/^#[0-9A-F]{6}$/i.test(value)) {
          errors.push(`${header} must be in format #RRGGBB`);
        } else {
          data.hex_code = value.toUpperCase();
        }
      } else {
        errors.push(`${header} is required`);
      }
    } else if (header.toLowerCase().includes('code')) {
      // Code field
      if (value) {
        data.code = value;
      } else if (isRequiredField(header, type)) {
        errors.push(`${header} is required`);
      }
    } else if (header.toLowerCase().includes('email')) {
      // Email field
      if (value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${header} must be a valid email address`);
        } else {
          data.email = value;
        }
      }
    } else if (header.toLowerCase().includes('phone')) {
      // Phone field
      if (value) {
        data.phone = value;
      }
    } else if (header.toLowerCase().includes('contact person')) {
      // Contact person field
      if (value) {
        data.contact_person = value;
      }
    } else if (header.toLowerCase().includes('category')) {
      // Category field (for price types)
      if (value) {
        if (!['zone', 'customer'].includes(value.toLowerCase())) {
          errors.push(`${header} must be either "zone" or "customer"`);
        } else {
          data.category = value.toLowerCase();
        }
      } else {
        data.category = 'customer';
      }
    } else if (header.toLowerCase().includes('quantity')) {
      // Quantity field (for inventory)
      if (value) {
        const quantity = parseInt(value);
        if (isNaN(quantity) || quantity < 0) {
          errors.push(`${header} must be a positive number`);
        } else {
          data.quantity = quantity;
        }
      } else {
        errors.push(`${header} is required`);
      }
    } else if (header.toLowerCase().includes('sku code')) {
      // SKU Code field (for inventory)
      if (value) {
        data.sku_code = value;
      } else {
        errors.push(`${header} is required`);
      }
    } else if (header.toLowerCase().includes('floor name')) {
      // Floor Name field (for inventory)
      if (value) {
        data.floor_name = value;
      } else {
        errors.push(`${header} is required`);
      }
    } else if (header.toLowerCase().includes('lane name')) {
      // Lane Name field (for inventory)
      if (value) {
        data.lane_name = value;
      } else {
        errors.push(`${header} is required`);
      }
    } else if (header.toLowerCase().includes('rack name')) {
      // Rack Name field (for inventory)
      if (value) {
        data.rack_name = value;
      } else {
        errors.push(`${header} is required`);
      }
    } else if (header.toLowerCase().includes('type')) {
      // Type field
      if (value) {
        if (header.toLowerCase().includes('fabric')) {
          // Fabric type
          if (!['Cotton', 'Poly Cotton', 'Polyester'].includes(value)) {
            errors.push(`${header} must be one of: Cotton, Poly Cotton, Polyester`);
          } else {
            data.fabric_type = value;
          }
        } else if (header.toLowerCase().includes('select')) {
          // Select type
          if (!['single', 'multiple'].includes(value.toLowerCase())) {
            errors.push(`${header} must be either "single" or "multiple"`);
          } else {
            data.select_type = value.toLowerCase();
          }
        } else if (header.toLowerCase().includes('promotional')) {
          // Promotional asset type
          const validTypes = ['Video', 'Catalogue', 'Lifestyle Images', 'Images'];
          if (!validTypes.includes(value)) {
            errors.push(`${header} must be one of: ${validTypes.join(', ')}`);
          } else {
            data.type = value;
          }
        }
      } else if (isRequiredField(header, type)) {
        errors.push(`${header} is required`);
      }
    } else if (header.toLowerCase().includes('uom')) {
      // UOM field
      if (value) {
        if (!['kg', 'meter'].includes(value.toLowerCase())) {
          errors.push(`${header} must be either "kg" or "meter"`);
        } else {
          data.uom = value.toLowerCase();
        }
      }
    } else if (header.toLowerCase().includes('link')) {
      // Link field
      if (value) {
        try {
          new URL(value);
          data.link = value;
        } catch {
          errors.push(`${header} must be a valid URL`);
        }
      }
    } else if (header.toLowerCase().includes('position')) {
      // Position field
      if (value) {
        const position = parseInt(value);
        if (isNaN(position) || position < 0) {
          errors.push(`${header} must be a non-negative number`);
        } else {
          data.position = position;
        }
      } else {
        data.position = 0;
      }
    } else if (header.toLowerCase().includes('order criteria')) {
      // Order criteria field
      if (value) {
        const criteriaLower = value.toLowerCase();
        if (!['true', 'false', 'yes', 'no', '1', '0'].includes(criteriaLower)) {
          errors.push(`${header} must be true/false, yes/no, or 1/0`);
        } else {
          data.order_criteria = ['true', 'yes', '1'].includes(criteriaLower);
        }
      } else {
        data.order_criteria = false;
      }
    } else if (header.toLowerCase().includes('sort position') || header.toLowerCase().includes('sort order')) {
      // Sort position/order field
      if (value) {
        const sortNum = parseInt(value);
        if (isNaN(sortNum) || sortNum < 0) {
          errors.push(`${header} must be a valid non-negative number`);
        } else {
          data.sort_position = sortNum;
        }
      } else {
        data.sort_position = 0;
      }
    } else if (header.toLowerCase().includes('gst rate') || header.toLowerCase().includes('tax percentage')) {
      // GST/Tax rate field
      if (value) {
        const rate = parseFloat(value);
        if (isNaN(rate) || rate < 0 || rate > 100) {
          errors.push(`${header} must be a number between 0 and 100`);
        } else {
          data.gst_rate = rate;
        }
      }
    } else if (header.toLowerCase().includes('price') || header.toLowerCase().includes('cost') || header.toLowerCase().includes('mrp')) {
      // Price/Cost fields
      if (value) {
        const price = parseFloat(value);
        if (isNaN(price) || price < 0) {
          errors.push(`${header} must be a valid non-negative number`);
        } else {
          const fieldName = header.replace(/\s+/g, '_').toLowerCase();
          data[fieldName] = price;
        }
      }
    } else if (header.toLowerCase().includes('gsm')) {
      // GSM field
      if (value) {
        const gsm = parseInt(value);
        if (isNaN(gsm) || gsm <= 0) {
          errors.push(`${header} must be a valid positive number`);
        } else {
          data.gsm = gsm;
        }
      }
    } else if (header.toLowerCase().includes('consumption')) {
      // Consumption fields
      if (value) {
        const consumption = parseFloat(value);
        if (isNaN(consumption) || consumption < 0) {
          errors.push(`${header} must be a valid non-negative number`);
        } else {
          const fieldName = header.replace(/\s+/g, '_').toLowerCase();
          data[fieldName] = consumption;
        }
      }
    } else if (header.toLowerCase().includes('percentage')) {
      // Percentage fields
      if (value) {
        const percentage = parseFloat(value);
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
          errors.push(`${header} must be a number between 0 and 100`);
        } else {
          const fieldName = header.replace(/\s+/g, '_').toLowerCase();
          data[fieldName] = percentage;
        }
      }
    } else if (header.toLowerCase().includes('rate')) {
      // Rate fields
      if (value) {
        const rate = parseFloat(value);
        if (isNaN(rate) || rate < 0) {
          errors.push(`${header} must be a valid non-negative number`);
        } else {
          const fieldName = header.replace(/\s+/g, '_').toLowerCase();
          data[fieldName] = rate;
        }
      }
    } else if (header.toLowerCase().includes('length') || header.toLowerCase().includes('breadth') || header.toLowerCase().includes('height')) {
      // Dimension fields
      if (value) {
        const dimension = parseFloat(value);
        if (isNaN(dimension) || dimension < 0) {
          errors.push(`${header} must be a valid non-negative number`);
        } else {
          const fieldName = header.replace(/\s+/g, '_').toLowerCase().replace(/\(cm\)/g, '').trim();
          data[fieldName] = dimension;
        }
      }
    } else if (header.toLowerCase().includes('weight')) {
      // Weight field
      if (value) {
        const weight = parseFloat(value);
        if (isNaN(weight) || weight < 0) {
          errors.push(`${header} must be a valid non-negative number`);
        } else {
          data.weight_grams = weight;
        }
      }
    } else if (header.toLowerCase().includes('hsn code')) {
      // HSN code field
      if (value) {
        data.hsn_code = value;
      }
    } else if (header.toLowerCase().includes('dx') || header.toLowerCase().includes('dy') || header.toLowerCase().includes('mirror dx') || header.toLowerCase().includes('height resp')) {
      // App asset dimension fields
      if (value) {
        const dimension = parseFloat(value);
        if (isNaN(dimension) || dimension < 0) {
          errors.push(`${header} must be a valid non-negative number`);
        } else {
          const fieldName = header.replace(/\s+/g, '_').toLowerCase();
          data[fieldName] = dimension;
        }
      }
    } else if (header.toLowerCase().includes('title')) {
      // Title field
      if (!value) {
        errors.push(`${header} is required`);
      } else {
        data.title = value;
      }
    } else if (header.toLowerCase().includes('sku code')) {
      // SKU code field
      if (!value) {
        errors.push(`${header} is required`);
      } else {
        data.sku_code = value;
      }
    }
  });

  // Set default status if not provided
  if (!data.status) {
    data.status = 'active';
  }

  return { valid: errors.length === 0, errors, data };
}

function isRequiredField(header: string, type: BulkImportType): boolean {
  // Define required fields for each type
  const requiredFields: Record<BulkImportType, string[]> = {
    'brands': ['Name'],
    'categories': ['Name'],
    'colors': ['Name', 'Hex Code'],
    'sizeGroups': ['Name'],
    'zones': ['Name'],
    'priceTypes': ['Name'],
    'vendors': ['Name', 'Code'],
    'styles': ['Name'],
    'classes': ['Name'],
    'skus': ['SKU Code'],
    'add-ons': ['Name', 'Select Type'],
    'appAssets': ['Name'],
    'promotionalBanners': ['Title', 'Brand Name'],
    'promotionalAssets': ['Name'],
    'parts': ['Name'],
    'fabrics': ['Name', 'Fabric Type', 'GSM', 'UOM', 'Price'],
    'sizes': ['Name', 'Code', 'Size Group Name'],
    'baseProducts': ['Name', 'Sort Order', 'Base Price'],
  };

  const required = requiredFields[type] || [];
  return required.some(field => header.toLowerCase().includes(field.toLowerCase()));
} 