
export interface MonthlyStockLevel {
  month: number;
  minStock: number;
  maxStock: number;
}

export interface StockLevelsByMonth {
  [month: string]: {
    minStock: number;
    maxStock: number;
  };
}

export const validateMonthlyStockLevels = (stockLevels: Record<string, any>): boolean => {
  if (!stockLevels || typeof stockLevels !== 'object') return false;
  
  for (const [month, levels] of Object.entries(stockLevels)) {
    const monthNum = parseInt(month);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return false;
    
    if (typeof levels !== 'object' || 
        typeof levels.minStock !== 'number' ||
        typeof levels.maxStock !== 'number' ||
        levels.minStock < 0 || levels.maxStock < 0 ||
        levels.minStock > levels.maxStock) {
      return false;
    }
  }
  
  return true;
};

export const getDefaultMonthlyStockLevels = (): StockLevelsByMonth => {
  const stockLevels: StockLevelsByMonth = {};
  
  for (let month = 1; month <= 12; month++) {
    stockLevels[month.toString()] = {
      minStock: 0,
      maxStock: 0,
    };
  }
  
  return stockLevels;
};

export const validateSizeRatios = (ratios: Record<string, number>): boolean => {
  if (!ratios || typeof ratios !== 'object') return false;
  
  // Check if all values are positive numbers
  return Object.values(ratios).every(ratio => 
    typeof ratio === 'number' && ratio > 0
  );
};

export const getSizeRatioDisplay = (ratios: Record<string, number>): string => {
  if (!ratios || Object.keys(ratios).length === 0) return '';
  
  const values = Object.values(ratios);
  return values.join(':');
};
