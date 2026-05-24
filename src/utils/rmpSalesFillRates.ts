export function formatFillRate(
  numerator?: number,
  denominator?: number,
): string {
  if (
    numerator == null ||
    denominator == null ||
    Number.isNaN(numerator) ||
    Number.isNaN(denominator) ||
    denominator === 0
  ) {
    return 'N/A';
  }
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export function fillRateTotal(
  closedOrderedQty?: number,
  orderedQty?: number,
): string {
  return formatFillRate(closedOrderedQty, orderedQty);
}

export function distributorFillRate(
  distributorClosedQty?: number,
  distributorQty?: number,
): string {
  return formatFillRate(distributorClosedQty, distributorQty);
}

export function otherFillRate(
  otherClosedQty?: number,
  otherQty?: number,
): string {
  return formatFillRate(otherClosedQty, otherQty);
}
