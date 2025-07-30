import { BulkImportType, ValidationResult } from './types';

export function validateRow(row: string[], index: number, type: BulkImportType): ValidationResult {
  const errors: string[] = [];
  let data: any = {};

  switch (type) {
    case 'brands':
      return validateBrandRow(row, errors, data);
    case 'categories':
      return validateCategoryRow(row, errors, data);
    case 'colors':
      return validateColorRow(row, errors, data);
    case 'sizeGroups':
      return validateSizeGroupRow(row, errors, data);
    case 'zones':
      return validateZoneRow(row, errors, data);
    case 'priceTypes':
      return validatePriceTypeRow(row, errors, data);
    case 'vendors':
      return validateVendorRow(row, errors, data);
    case 'styles':
      return validateStyleRow(row, errors, data);
    case 'classes':
      return validateClassRow(row, errors, data);
    case 'skus':
      return validateSkuRow(row, errors, data);
    case 'add-ons':
      return validateAddOnRow(row, errors, data);
    case 'appAssets':
      return validateAppAssetRow(row, errors, data);
    case 'promotionalBanners':
      return validatePromotionalBannerRow(row, errors, data);
    case 'promotionalAssets':
      return validatePromotionalAssetRow(row, errors, data);
    case 'parts':
      return validatePartRow(row, errors, data);
    default:
      errors.push('Unsupported import type');
      return { valid: false, errors };
  }
}

function validateBrandRow(row: string[], errors: string[], data: any): ValidationResult {
  const [name, description, status] = row;

  if (!name?.trim()) {
    errors.push('Name is required');
  } else {
    data.name = name.trim();
  }

  if (description?.trim()) {
    data.description = description.trim();
  }

  if (status?.trim()) {
    if (!['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    } else {
      data.status = status.toLowerCase();
    }
  } else {
    data.status = 'active';
  }

  return { valid: errors.length === 0, errors, data };
}

function validateCategoryRow(row: string[], errors: string[], data: any): ValidationResult {
  const [name, description, status] = row;

  if (!name?.trim()) {
    errors.push('Name is required');
  } else {
    data.name = name.trim();
  }

  if (description?.trim()) {
    data.description = description.trim();
  }

  if (status?.trim()) {
    if (!['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    } else {
      data.status = status.toLowerCase();
    }
  } else {
    data.status = 'active';
  }

  return { valid: errors.length === 0, errors, data };
}

function validateColorRow(row: string[], errors: string[], data: any): ValidationResult {
  const [name, hexCode, status] = row;

  if (!name?.trim()) {
    errors.push('Name is required');
  } else {
    data.name = name.trim();
  }

  if (!hexCode?.trim()) {
    errors.push('Hex code is required');
  } else if (!/^#[0-9A-F]{6}$/i.test(hexCode.trim())) {
    errors.push('Hex code must be in format #RRGGBB');
  } else {
    data.hex_code = hexCode.trim().toUpperCase();
  }

  if (status?.trim()) {
    if (!['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    } else {
      data.status = status.toLowerCase();
    }
  } else {
    data.status = 'active';
  }

  return { valid: errors.length === 0, errors, data };
}

function validateSizeGroupRow(row: string[], errors: string[], data: any): ValidationResult {
  const [name, description, status] = row;

  if (!name?.trim()) {
    errors.push('Name is required');
  } else {
    data.name = name.trim();
  }

  if (description?.trim()) {
    data.description = description.trim();
  }

  if (status?.trim()) {
    if (!['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    } else {
      data.status = status.toLowerCase();
    }
  } else {
    data.status = 'active';
  }

  return { valid: errors.length === 0, errors, data };
}

function validateZoneRow(row: string[], errors: string[], data: any): ValidationResult {
  const [name, status] = row;

  if (!name?.trim()) {
    errors.push('Name is required');
  } else {
    data.name = name.trim();
  }

  if (status?.trim()) {
    if (!['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    } else {
      data.status = status.toLowerCase();
    }
  } else {
    data.status = 'active';
  }

  return { valid: errors.length === 0, errors, data };
}

function validatePriceTypeRow(row: string[], errors: string[], data: any): ValidationResult {
  const [name, category, description, status] = row;

  if (!name?.trim()) {
    errors.push('Name is required');
  } else {
    data.name = name.trim();
  }

  if (category?.trim()) {
    if (!['zone', 'customer'].includes(category.toLowerCase())) {
      errors.push('Category must be either "zone" or "customer"');
    } else {
      data.category = category.toLowerCase();
    }
  } else {
    data.category = 'customer';
  }

  if (description?.trim()) {
    data.description = description.trim();
  }

  if (status?.trim()) {
    if (!['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    } else {
      data.status = status.toLowerCase();
    }
  } else {
    data.status = 'active';
  }

  return { valid: errors.length === 0, errors, data };
}

function validateVendorRow(row: string[], errors: string[], data: any): ValidationResult {
  const [name, code, contactPerson, email, phone, status] = row;

  if (!name?.trim()) {
    errors.push('Name is required');
  } else {
    data.name = name.trim();
  }

  if (!code?.trim()) {
    errors.push('Code is required');
  } else {
    data.code = code.trim();
  }

  if (contactPerson?.trim()) {
    data.contact_person = contactPerson.trim();
  }

  if (email?.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Email must be a valid email address');
    } else {
      data.email = email.trim();
    }
  }

  if (phone?.trim()) {
    data.phone = phone.trim();
  }

  if (status?.trim()) {
    if (!['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    } else {
      data.status = status.toLowerCase();
    }
  } else {
    data.status = 'active';
  }

  return { valid: errors.length === 0, errors, data };
}

function validateStyleRow(row: string[], errors: string[], data: any): ValidationResult {
  const [name, description, status] = row;

  if (!name?.trim()) {
    errors.push('Name is required');
  } else {
    data.name = name.trim();
  }

  if (description?.trim()) {
    data.description = description.trim();
  }

  if (status?.trim()) {
    if (!['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    } else {
      data.status = status.toLowerCase();
    }
  } else {
    data.status = 'active';
  }

  return { valid: errors.length === 0, errors, data };
}

function validateClassRow(row: string[], errors: string[], data: any): ValidationResult {
  const [name, description, gstRate, status] = row;

  if (!name?.trim()) {
    errors.push('Name is required');
  } else {
    data.name = name.trim();
  }

  if (description?.trim()) {
    data.description = description.trim();
  }

  if (gstRate?.trim()) {
    const rate = parseFloat(gstRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      errors.push('GST Rate must be a number between 0 and 100');
    } else {
      data.gst_rate = rate;
    }
  }

  if (status?.trim()) {
    if (!['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    } else {
      data.status = status.toLowerCase();
    }
  } else {
    data.status = 'active';
  }

  return { valid: errors.length === 0, errors, data };
}

function validateSkuRow(row: string[], errors: string[], data: any): ValidationResult {
  const [skuCode, baseMrp, costPrice, status] = row;

  if (!skuCode?.trim()) {
    errors.push('SKU Code is required');
  } else {
    data.sku_code = skuCode.trim();
  }

  if (baseMrp?.trim()) {
    const mrp = parseFloat(baseMrp);
    if (isNaN(mrp) || mrp < 0) {
      errors.push('Base MRP must be a valid non-negative number');
    } else {
      data.base_mrp = mrp;
    }
  }

  if (costPrice?.trim()) {
    const cost = parseFloat(costPrice);
    if (isNaN(cost) || cost < 0) {
      errors.push('Cost Price must be a valid non-negative number');
    } else {
      data.cost_price = cost;
    }
  }

  if (status?.trim()) {
    if (!['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    } else {
      data.status = status.toLowerCase();
    }
  } else {
    data.status = 'active';
  }

  return { valid: errors.length === 0, errors, data };
}

function validateAddOnRow(row: string[], errors: string[], data: any): ValidationResult {
  const [name, selectType, price, status] = row;

  if (!name?.trim()) {
    errors.push('Name is required');
  } else {
    data.name = name.trim();
  }

  if (!selectType?.trim()) {
    errors.push('Select Type is required');
  } else if (!['single', 'multiple'].includes(selectType.toLowerCase())) {
    errors.push('Select Type must be either "single" or "multiple"');
  } else {
    data.select_type = selectType.toLowerCase();
  }

  if (price?.trim()) {
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.push('Price must be a valid non-negative number');
    } else {
      data.price = priceNum;
    }
  } else {
    data.price = 0;
  }

  if (status?.trim()) {
    if (!['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    } else {
      data.status = status.toLowerCase();
    }
  } else {
    data.status = 'active';
  }

  return { valid: errors.length === 0, errors, data };
}

function validateAppAssetRow(row: string[], errors: string[], data: any): ValidationResult {
  const [name, dx, dy, mirrorDx, heightResp, connectedAddOn, status] = row;

  if (!name?.trim()) {
    errors.push('Name is required');
  } else {
    data.name = name.trim();
  }

  // Validate numeric fields
  const dxNum = parseFloat(dx);
  if (isNaN(dxNum) || dxNum < 0) {
    errors.push('dX must be a valid non-negative number');
  } else {
    data.dx = dxNum;
  }

  const dyNum = parseFloat(dy);
  if (isNaN(dyNum) || dyNum < 0) {
    errors.push('dY must be a valid non-negative number');
  } else {
    data.dy = dyNum;
  }

  const mirrorDxNum = parseFloat(mirrorDx);
  if (isNaN(mirrorDxNum) || mirrorDxNum < 0) {
    errors.push('Mirror dX must be a valid non-negative number');
  } else {
    data.mirror_dx = mirrorDxNum;
  }

  const heightRespNum = parseFloat(heightResp);
  if (isNaN(heightRespNum) || heightRespNum < 0) {
    errors.push('Height Resp must be a valid non-negative number');
  } else {
    data.asset_height_resp_to_box = heightRespNum;
  }

  // Handle connected add-on (optional field)
  if (connectedAddOn?.trim()) {
    data.add_on_name = connectedAddOn.trim();
  } else {
    data.add_on_name = null;
  }

  if (status?.trim()) {
    if (!['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    } else {
      data.status = status.toLowerCase();
    }
  } else {
    data.status = 'active';
  }

  return { valid: errors.length === 0, errors, data };
}

function validatePartRow(row: string[], errors: string[], data: any): ValidationResult {
  const [name, orderCriteria, sortPosition, status] = row;

  if (!name?.trim()) {
    errors.push('Name is required');
  } else {
    data.name = name.trim();
  }

  // Validate order criteria
  if (orderCriteria?.trim()) {
    const criteriaLower = orderCriteria.toLowerCase();
    if (!['true', 'false', 'yes', 'no', '1', '0'].includes(criteriaLower)) {
      errors.push('Order Criteria must be true/false, yes/no, or 1/0');
    } else {
      data.order_criteria = ['true', 'yes', '1'].includes(criteriaLower);
    }
  } else {
    data.order_criteria = false;
  }

  // Validate sort position
  if (sortPosition?.trim()) {
    const sortNum = parseInt(sortPosition);
    if (isNaN(sortNum) || sortNum < 0) {
      errors.push('Sort Position must be a valid non-negative number');
    } else {
      data.sort_position = sortNum;
    }
  } else {
    data.sort_position = 0;
  }

  if (status?.trim()) {
    if (!['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    } else {
      data.status = status.toLowerCase();
    }
  } else {
    data.status = 'active';
  }

  return { valid: errors.length === 0, errors, data };
}

function validatePromotionalBannerRow(row: string[], errors: string[], data: any): ValidationResult {
  const [title, categoryName, brandName, className, position, status] = row;

  if (!title?.trim()) {
    errors.push('Title is required');
  } else {
    data.title = title.trim();
  }

  // Handle category (optional field)
  if (categoryName?.trim()) {
    data.category_name = categoryName.trim();
  } else {
    data.category_name = null;
  }

  // Handle brand (required field)
  if (!brandName?.trim()) {
    errors.push('Brand is required');
  } else {
    data.brand_name = brandName.trim();
  }

  // Handle class (optional field)
  if (className?.trim()) {
    data.class_name = className.trim();
  } else {
    data.class_name = null;
  }

  // Handle position
  if (position?.trim()) {
    const positionNum = parseInt(position.trim());
    if (isNaN(positionNum) || positionNum < 0) {
      errors.push('Position must be a non-negative number');
    } else {
      data.position = positionNum;
    }
  } else {
    data.position = 0;
  }

  if (status?.trim()) {
    if (!['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    } else {
      data.status = status.toLowerCase();
    }
  } else {
    data.status = 'active';
  }

  return { valid: errors.length === 0, errors, data };
}

function validatePromotionalAssetRow(row: string[], errors: string[], data: any): ValidationResult {
  const [name, type, link, status] = row;

  if (!name?.trim()) {
    errors.push('Name is required');
  } else {
    data.name = name.trim();
  }

  if (type?.trim()) {
    const validTypes = ['Video', 'Catalogue', 'Lifestyle Images', 'Images'];
    if (!validTypes.includes(type.trim())) {
      errors.push('Type must be one of: Video, Catalogue, Lifestyle Images, Images');
    } else {
      data.type = type.trim();
    }
  } else {
    data.type = 'Images';
  }

  if (link?.trim()) {
    try {
      new URL(link.trim());
      data.link = link.trim();
    } catch {
      errors.push('Link must be a valid URL');
    }
  } else {
    data.link = null;
  }

  if (status?.trim()) {
    if (!['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    } else {
      data.status = status.toLowerCase();
    }
  } else {
    data.status = 'active';
  }

  return { valid: errors.length === 0, errors, data };
}
