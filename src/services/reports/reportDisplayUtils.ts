/** Scott/Airtable sometimes returns a truncated order id like "OD-P-". */
export function isIncompleteOrderId(orderId?: string): boolean {
  const value = orderId?.trim() ?? '';
  return value === '' || value === 'OD-P-' || value === 'OD-P';
}

export function formatReportOrderId(orderId?: string, reportId?: string): string {
  if (!isIncompleteOrderId(orderId) && orderId?.trim()) {
    return orderId.trim();
  }
  if (reportId) {
    return `#${reportId}`;
  }
  return '-';
}

/** Fill missing row fields from other rows sharing the same order_id on the current page. */
export function enrichRowsByOrderId<T extends Record<string, unknown>>(
  rows: T[],
  fields: string[],
): T[] {
  const donors = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    const orderId = String(row.order_id ?? '').trim();
    if (!orderId || isIncompleteOrderId(orderId)) continue;

    const bucket = donors.get(orderId) ?? {};
    for (const field of fields) {
      const value = row[field];
      if (value != null && value !== '') {
        bucket[field] = value;
      }
    }
    donors.set(orderId, bucket);
  }

  return rows.map((row) => {
    const orderId = String(row.order_id ?? '').trim();
    if (!orderId || isIncompleteOrderId(orderId) || !donors.has(orderId)) {
      return row;
    }

    const donor = donors.get(orderId)!;
    const next = { ...row };
    let changed = false;

    for (const field of fields) {
      const current = next[field];
      if ((current == null || current === '') && donor[field] != null && donor[field] !== '') {
        next[field] = donor[field];
        changed = true;
      }
    }

    return changed ? next : row;
  });
}
