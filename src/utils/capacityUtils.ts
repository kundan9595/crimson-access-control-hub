
export const calculateCapacityAllocation = (
  totalCapacity: number,
  sizeRatios: Record<string, number>
): Record<string, number> => {
  const totalRatio = Object.values(sizeRatios).reduce((sum, ratio) => sum + ratio, 0);
  
  if (totalRatio === 0) return {};
  
  const allocation: Record<string, number> = {};
  
  Object.entries(sizeRatios).forEach(([sizeId, ratio]) => {
    allocation[sizeId] = Math.round((ratio / totalRatio) * totalCapacity);
  });
  
  return allocation;
};

export const validateSizeRatios = (ratios: Record<string, number>): boolean => {
  return Object.values(ratios).every(ratio => ratio >= 0 && ratio <= 100);
};

export const getTotalRatioPercentage = (ratios: Record<string, number>): number => {
  return Object.values(ratios).reduce((sum, ratio) => sum + ratio, 0);
};
