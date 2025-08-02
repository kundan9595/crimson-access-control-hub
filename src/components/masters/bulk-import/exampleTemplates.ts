import { getMasterConfig } from '@/constants/masterDependencies';

export function generateExampleCSV(masterType: string): string {
  const config = getMasterConfig(masterType);
  if (!config) {
    return '';
  }

  const headers = config.templateHeaders.join(',');
  const sampleRows = config.sampleData.map(row => row.join(',')).join('\n');
  
  return `${headers}\n${sampleRows}`;
}

export function downloadExampleCSV(masterType: string, filename?: string) {
  const csvContent = generateExampleCSV(masterType);
  if (!csvContent) return;

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${masterType}_template.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Example usage and documentation
export const EXAMPLE_USAGE = {
  // Independent masters - simple import
  brands: {
    description: "Simple import with no dependencies",
    example: `Name,Description,Status
Apple,Technology company,active
Samsung,Electronics manufacturer,active`
  },

  // Dependent masters - automatic dependency creation
  styles: {
    description: "Import styles with automatic brand and category creation",
    example: `Name,Description,Brand Name,Category Name,Status
Summer Collection,Lightweight summer clothing,Apple,Clothing,active
Winter Collection,Warm winter clothing,Samsung,Electronics,active`
  },

  // Deep dependent masters - multi-level dependency resolution
  skus: {
    description: "Import SKUs with automatic creation of all dependencies (Class → Style → Brand/Category, Size → SizeGroup)",
    example: `SKU Code,Class Name,Size Name,Base MRP,Cost Price,HSN Code,Description,Length (cm),Breadth (cm),Height (cm),Weight (grams),Status
SKU001,Summer T-Shirt Red,S,1000,800,62011090,Sample SKU description,30,20,10,500,active
SKU002,Winter Jacket Blue,M,1500,1200,62011090,Another sample SKU,25,15,8,400,active`
  },

  // Complex dependencies with multiple relationships
  baseProducts: {
    description: "Import base products with multiple dependencies including arrays",
    example: `Name,Sort Order,Category Name,Fabric Name,Size Group Names (comma-separated),Part Names (comma-separated),Base Price,Trims Cost,Adult Consumption,Kids Consumption,Overhead Percentage,Sample Rate,Status
Product A,1,Clothing,Cotton Fabric,Small,Medium,Part A,Part B,500,50,2.5,1.5,15,5,active`
  }
};

export function getExampleDescription(masterType: string): string {
  return EXAMPLE_USAGE[masterType as keyof typeof EXAMPLE_USAGE]?.description || 
         "Import data with automatic dependency resolution";
}

export function getExampleCSV(masterType: string): string {
  return EXAMPLE_USAGE[masterType as keyof typeof EXAMPLE_USAGE]?.example || 
         generateExampleCSV(masterType);
} 