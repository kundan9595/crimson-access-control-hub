
export interface MonthlyStockLevel {
  month: number;
  year: number;
  minStock: number;
  maxStock: number;
}

export interface StockLevelsBySize {
  [sizeId: string]: MonthlyStockLevel[];
}

export const validateMonthlyStockLevels = (stockLevels: Record<string, any>): boolean => {
  if (!stockLevels || typeof stockLevels !== 'object') return false;
  
  for (const [sizeId, levels] of Object.entries(stockLevels)) {
    if (!Array.isArray(levels)) return false;
    
    for (const level of levels) {
      if (typeof level !== 'object' || 
          typeof level.month !== 'number' ||
          typeof level.year !== 'number' ||
          typeof level.minStock !== 'number' ||
          typeof level.maxStock !== 'number' ||
          level.month < 1 || level.month > 12 ||
          level.minStock < 0 || level.maxStock < 0 ||
          level.minStock > level.maxStock) {
        return false;
      }
    }
  }
  
  return true;
};

export const getDefaultStockLevels = (selectedSizes: string[]): StockLevelsBySize => {
  const currentYear = new Date().getFullYear();
  const stockLevels: StockLevelsBySize = {};
  
  selectedSizes.forEach(sizeId => {
    stockLevels[sizeId] = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      year: currentYear,
      minStock: 0,
      maxStock: 0,
    }));
  });
  
  return stockLevels;
};

export const validateSizeRatios = (ratios: Record<string, number>): boolean => {
  if (!ratios || typeof ratios !== 'object') return false;
  
  const total = Object.values(ratios).reduce((sum, ratio) => sum + (ratio || 0), 0);
  return Math.abs(total - 100) < 0.01; // Allow for small floating point errors
};

export const getTotalRatioPercentage = (ratios: Record<string, number>): number => {
  return Object.values(ratios).reduce((sum, ratio) => sum + (ratio || 0), 0);
};
