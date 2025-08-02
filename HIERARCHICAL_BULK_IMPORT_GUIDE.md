# Hierarchical Bulk Import System

## Overview

The Hierarchical Bulk Import System automatically resolves dependencies between masters during bulk import operations. Instead of requiring users to provide IDs for dependent masters, users can provide names, and the system will automatically create or find the dependent masters.

## Key Features

### 1. **Automatic Dependency Resolution**
- **Name-based lookups**: Use names instead of IDs for dependent masters
- **Automatic creation**: Creates missing dependent masters automatically
- **Duplicate handling**: Configurable strategy for handling existing records
- **Multi-level resolution**: Handles deep dependencies (e.g., SKU → Class → Style → Brand/Category)

### 2. **Duplicate Handling Strategies**
- **Ignore duplicates**: Skip existing records with the same name
- **Update duplicates**: Update existing records with new data

### 3. **Comprehensive Validation**
- **Enhanced validation**: Validates all fields based on master configuration
- **Dependency validation**: Ensures required dependencies are provided
- **Type validation**: Validates data types (numbers, emails, URLs, etc.)

## Master Dependency Hierarchy

### Level 0 - Independent Masters
These masters have no dependencies and can be imported directly:
- **Brands**: Product brands
- **Categories**: Product categories
- **Colors**: Color definitions
- **SizeGroups**: Size group definitions
- **Zones**: Geographical zones
- **PriceTypes**: Pricing structures
- **Vendors**: Vendor information
- **Parts**: Product parts
- **Fabrics**: Fabric definitions
- **Add-ons**: Product add-ons
- **PromotionalAssets**: Promotional materials

### Level 1 - Dependent Masters
These masters depend on Level 0 masters:
- **Styles**: Depends on Brands, Categories
- **Classes**: Depends on Styles, Colors, SizeGroups
- **AppAssets**: Depends on Add-ons
- **Sizes**: Depends on SizeGroups
- **BaseProducts**: Depends on Categories, Fabrics, SizeGroups, Parts
- **PromotionalBanners**: Depends on Categories, Brands, Classes

### Level 2 - Deep Dependent Masters
These masters depend on Level 1 masters:
- **SKUs**: Depends on Classes, Sizes

## Usage Examples

### Example 1: Import Styles with Automatic Brand/Category Creation

**CSV Format:**
```csv
Name,Description,Brand Name,Category Name,Status
Summer Collection,Lightweight summer clothing,Apple,Clothing,active
Winter Collection,Warm winter clothing,Samsung,Electronics,active
```

**What happens:**
1. System checks if "Apple" brand exists
2. If not, creates brand "Apple" with default values
3. System checks if "Clothing" category exists
4. If not, creates category "Clothing" with default values
5. Creates style "Summer Collection" linked to the brand and category IDs

### Example 2: Import SKUs with Full Dependency Chain

**CSV Format:**
```csv
SKU Code,Class Name,Size Name,Base MRP,Cost Price,HSN Code,Description,Length (cm),Breadth (cm),Height (cm),Weight (grams),Status
SKU001,Summer T-Shirt Red,S,1000,800,62011090,Sample SKU description,30,20,10,500,active
```

**What happens:**
1. System resolves "Summer T-Shirt Red" class:
   - Checks if "Summer T-Shirt Red" class exists
   - If not, creates class (which may trigger style/color/size group creation)
2. System resolves "S" size:
   - Checks if "S" size exists in the appropriate size group
   - If not, creates size
3. Creates SKU with resolved IDs

### Example 3: Complex Dependencies with Arrays

**CSV Format:**
```csv
Name,Sort Order,Category Name,Fabric Name,Size Group Names (comma-separated),Part Names (comma-separated),Base Price,Trims Cost,Adult Consumption,Kids Consumption,Overhead Percentage,Sample Rate,Status
Product A,1,Clothing,Cotton Fabric,Small,Medium,Part A,Part B,500,50,2.5,1.5,15,5,active
```

**What happens:**
1. Resolves "Clothing" category
2. Resolves "Cotton Fabric" fabric
3. Resolves "Small" and "Medium" size groups
4. Resolves "Part A" and "Part B" parts
5. Creates base product with all resolved IDs

## Configuration

### Master Configuration
Each master is configured in `src/constants/masterDependencies.ts`:

```typescript
export const MASTER_DEPENDENCIES: Record<string, MasterConfig> = {
  styles: {
    dependencies: [
      { table: 'brands', lookupField: 'brand_id', nameField: 'name', required: false },
      { table: 'categories', lookupField: 'category_id', nameField: 'name', required: false }
    ],
    independent: false,
    level: 1,
    templateHeaders: ['Name', 'Description', 'Brand Name', 'Category Name', 'Status'],
    sampleData: [
      ['Summer Collection', 'Lightweight summer clothing', 'Apple', 'Clothing', 'active']
    ],
    exportFields: ['name', 'description', 'status', 'created_at'] as const,
  }
};
```

### Dependency Configuration
```typescript
interface MasterDependency {
  table: string;           // Target table name
  lookupField: string;     // Foreign key field in current table
  nameField: string;       // Field to lookup in target table
  required?: boolean;      // Whether this dependency is required
  multiple?: boolean;      // Whether this is a multiple relationship
}
```

## Implementation Details

### 1. Dependency Resolution Service
Located in `src/services/masters/dependencyResolutionService.ts`:
- Handles dependency resolution logic
- Manages duplicate handling strategies
- Provides summary of operations performed

### 2. Enhanced Validation
Located in `src/components/masters/bulk-import/enhancedValidation.ts`:
- Validates data based on master configuration
- Handles different field types (names, numbers, emails, etc.)
- Provides detailed error messages

### 3. Enhanced Bulk Import Dialog
Located in `src/components/masters/BulkImportDialog.tsx`:
- Shows dependency information before import
- Allows configuration of duplicate handling strategy
- Displays summary of operations performed

## Best Practices

### 1. **Template Preparation**
- Use the provided CSV templates as starting points
- Ensure all required fields are populated
- Use consistent naming conventions for dependencies

### 2. **Duplicate Handling**
- **For initial setup**: Use "Update duplicates" to ensure data consistency
- **For regular imports**: Use "Ignore duplicates" to avoid overwriting existing data
- **For data updates**: Use "Update duplicates" to refresh existing records

### 3. **Data Validation**
- Validate your CSV data before import
- Check for required dependencies
- Ensure data types match expected formats

### 4. **Performance Considerations**
- Large imports may take time due to dependency resolution
- Consider breaking large imports into smaller batches
- Monitor the import progress and dependency creation summary

## Error Handling

### Common Errors and Solutions

1. **"Dependency resolution failed"**
   - Check that dependency names are spelled correctly
   - Ensure required dependencies are provided
   - Verify that dependency data is valid

2. **"Validation failed"**
   - Check field formats (emails, URLs, numbers)
   - Ensure required fields are populated
   - Verify data types match expected formats

3. **"Import failed"**
   - Check database connectivity
   - Verify user permissions
   - Review error logs for specific issues

## Migration from Old System

### Changes Required
1. **Template Headers**: Update CSV headers to use names instead of IDs
2. **Data Format**: Replace ID references with name references
3. **Validation**: Update validation logic to handle name-based lookups

### Backward Compatibility
- The old ID-based system is still supported for independent masters
- Existing imports will continue to work
- New hierarchical features are opt-in

## Future Enhancements

### Planned Features
1. **Bulk Export with Dependencies**: Export data with resolved names
2. **Dependency Visualization**: Show dependency graphs
3. **Advanced Validation**: Custom validation rules per master
4. **Import Scheduling**: Schedule large imports for off-peak hours
5. **Rollback Support**: Ability to rollback failed imports

### Extensibility
The system is designed to be easily extensible:
- Add new masters by updating the configuration
- Customize validation rules per master
- Extend dependency resolution logic
- Add new duplicate handling strategies 