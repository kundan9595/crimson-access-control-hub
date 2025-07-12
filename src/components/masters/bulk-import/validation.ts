import { BulkImportType, ValidationResult } from './types';

export const validateRow = (row: string[], index: number, type: BulkImportType): ValidationResult => {
  const errors: string[] = [];

  if (type === 'brands') {
    const [name, description, sortOrder, status] = row;
    
    if (!name?.trim()) {
      errors.push('Name is required');
    }
    
    if (sortOrder && isNaN(Number(sortOrder))) {
      errors.push('Sort order must be a number');
    }
    
    if (status && !['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    }
    
    if (errors.length === 0) {
      return {
        valid: true,
        errors: [],
        data: {
          name: name.trim(),
          description: description?.trim() || '',
          sort_order: sortOrder ? parseInt(sortOrder) : 0,
          status: status?.toLowerCase() || 'active'
        }
      };
    }
  }

  if (type === 'add-ons') {
    const [name, groupName, addOnOf, addOnSn, selectType, price, hasColour, sortOrder, status] = row;
    
    if (!name?.trim()) {
      errors.push('Name is required');
    }
    
    if (selectType && !['single', 'multiple', 'checked'].includes(selectType.toLowerCase())) {
      errors.push('Select type must be "single", "multiple", or "checked"');
    }
    
    if (price && isNaN(Number(price))) {
      errors.push('Price must be a number');
    }
    
    if (addOnOf && isNaN(Number(addOnOf))) {
      errors.push('Add On OF must be a number');
    }
    
    if (addOnSn && isNaN(Number(addOnSn))) {
      errors.push('Add On SN must be a number');
    }
    
    if (hasColour && !['yes', 'no', 'true', 'false'].includes(hasColour.toLowerCase())) {
      errors.push('Has Colour must be "Yes", "No", "True", or "False"');
    }
    
    if (sortOrder && isNaN(Number(sortOrder))) {
      errors.push('Sort order must be a number');
    }
    
    if (status && !['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    }
    
    if (errors.length === 0) {
      return {
        valid: true,
        errors: [],
        data: {
          name: name.trim(),
          group_name: groupName?.trim() || null,
          add_on_of: addOnOf ? Number(addOnOf) : null,
          add_on_sn: addOnSn ? Number(addOnSn) : null,
          select_type: selectType?.toLowerCase() || 'single',
          price: price ? Number(price) : null,
          has_colour: hasColour ? ['yes', 'true'].includes(hasColour.toLowerCase()) : false,
          sort_order: sortOrder ? parseInt(sortOrder) : 0,
          status: status?.toLowerCase() || 'active',
          options: [],
          colors: []
        }
      };
    }
  }

  if (type === 'categories') {
    const [name, description, sortOrder, status] = row;
    
    if (!name?.trim()) {
      errors.push('Name is required');
    }
    
    if (sortOrder && isNaN(Number(sortOrder))) {
      errors.push('Sort order must be a number');
    }
    
    if (status && !['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    }
    
    if (errors.length === 0) {
      return {
        valid: true,
        errors: [],
        data: {
          name: name.trim(),
          description: description?.trim() || '',
          sort_order: sortOrder ? parseInt(sortOrder) : 0,
          status: status?.toLowerCase() || 'active'
        }
      };
    }
  }

  if (type === 'colors') {
    const [name, hexCode, status] = row;
    
    if (!name?.trim()) {
      errors.push('Name is required');
    }
    
    if (!hexCode?.trim()) {
      errors.push('Hex code is required');
    } else if (!/^#[0-9A-F]{6}$/i.test(hexCode.trim())) {
      errors.push('Hex code must be in format #RRGGBB');
    }
    
    if (status && !['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    }
    
    if (errors.length === 0) {
      return {
        valid: true,
        errors: [],
        data: {
          name: name.trim(),
          hex_code: hexCode.trim(),
          status: status?.toLowerCase() || 'active'
        }
      };
    }
  }

  if (type === 'sizeGroups') {
    const [name, description, sortOrder, status] = row;

    if (!name?.trim()) {
      errors.push('Name is required');
    }

    if (sortOrder && isNaN(Number(sortOrder))) {
      errors.push('Sort order must be a number');
    }

    if (status && !['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    }

    if (errors.length === 0) {
      return {
        valid: true,
        errors: [],
        data: {
          name: name.trim(),
          description: description?.trim() || '',
          sort_order: sortOrder ? parseInt(sortOrder) : 0,
          status: status?.toLowerCase() || 'active'
        }
      };
    }
  }

  if (type === 'zones') {
    const [name, code, status] = row;

    if (!name?.trim()) {
      errors.push('Name is required');
    }

    if (!code?.trim()) {
      errors.push('Code is required');
    }

    if (status && !['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    }

    if (errors.length === 0) {
      return {
        valid: true,
        errors: [],
        data: {
          name: name.trim(),
          code: code.trim(),
          status: status?.toLowerCase() || 'active'
        }
      };
    }
  }

  if (type === 'priceTypes') {
    const [name, description, status] = row;

    if (!name?.trim()) {
      errors.push('Name is required');
    }

    if (status && !['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    }

    if (errors.length === 0) {
      return {
        valid: true,
        errors: [],
        data: {
          name: name.trim(),
          description: description?.trim() || '',
          status: status?.toLowerCase() || 'active'
        }
      };
    }
  }

  if (type === 'vendors') {
    const [name, description, status] = row;

    if (!name?.trim()) {
      errors.push('Name is required');
    }

    if (status && !['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    }

    if (errors.length === 0) {
      return {
        valid: true,
        errors: [],
        data: {
          name: name.trim(),
          description: description?.trim() || '',
          status: status?.toLowerCase() || 'active'
        }
      };
    }
  }

  if (type === 'styles') {
    const [name, description, status] = row;

    if (!name?.trim()) {
      errors.push('Name is required');
    }

    if (status && !['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    }

    if (errors.length === 0) {
      return {
        valid: true,
        errors: [],
        data: {
          name: name.trim(),
          description: description?.trim() || '',
          status: status?.toLowerCase() || 'active'
        }
      };
    }
  }

  if (type === 'classes') {
    const [name, description, status] = row;

    if (!name?.trim()) {
      errors.push('Name is required');
    }

    if (status && !['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    }

    if (errors.length === 0) {
      return {
        valid: true,
        errors: [],
        data: {
          name: name.trim(),
          description: description?.trim() || '',
          status: status?.toLowerCase() || 'active'
        }
      };
    }
  }

  if (type === 'skus') {
    const [name, description, status] = row;

    if (!name?.trim()) {
      errors.push('Name is required');
    }

    if (status && !['active', 'inactive'].includes(status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    }

    if (errors.length === 0) {
      return {
        valid: true,
        errors: [],
        data: {
          name: name.trim(),
          description: description?.trim() || '',
          status: status?.toLowerCase() || 'active'
        }
      };
    }
  }

  return {
    valid: false,
    errors: errors.length > 0 ? errors : ['Invalid data format'],
    data: undefined
  };
};
