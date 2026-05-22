import { config } from '@/config/environment';

/** Query params Scott dashboard lists accept (`items` = page size). */
export type ScottPageParams = {
  page: number;
  items: number;
};

export type ScottPaginatedResult<T> = {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  /** When false, totals are lower bounds (Scott body had no pagy). */
  totalCountIsExact: boolean;
};

export function normalizeScottPageParams(overrides?: Partial<ScottPageParams>): ScottPageParams {
  const items = Math.min(
    Math.max(1, overrides?.items ?? config.pagination.defaultPageSize),
    config.pagination.maxPageSize,
  );
  const page = Math.max(1, overrides?.page ?? 1);
  return { page, items };
}

type ScottPagyRaw = {
  count?: number;
  page?: number;
  items?: number;
  limit?: number;
  pages?: number;
};

function extractScottPagyFromBody(body: unknown): ScottPagyRaw | null {
  const visit = (v: unknown, depth: number): ScottPagyRaw | null => {
    if (depth > 20 || v === null || typeof v !== 'object' || Array.isArray(v)) {
      return null;
    }
    const o = v as Record<string, unknown>;
    if (
      typeof o.count === 'number' &&
      typeof o.page === 'number' &&
      typeof o.pages === 'number'
    ) {
      return {
        count: o.count,
        page: o.page,
        pages: o.pages,
        items: typeof o.items === 'number' ? o.items : undefined,
        limit: typeof o.limit === 'number' ? o.limit : undefined,
      };
    }
    for (const val of Object.values(o)) {
      const found = visit(val, depth + 1);
      if (found) return found;
    }
    return null;
  };
  return visit(body, 0);
}

export function buildScottPaginatedMeta(
  body: unknown,
  requested: ScottPageParams,
  rowCount: number,
): Omit<ScottPaginatedResult<never>, 'data'> {
  const pagy = extractScottPagyFromBody(body);
  const pageSize = requested.items;
  const page = requested.page;

  if (pagy && typeof pagy.count === 'number' && typeof pagy.pages === 'number') {
    const ps = pagy.items ?? pagy.limit ?? pageSize;
    return {
      page: pagy.page ?? page,
      pageSize: ps,
      totalCount: pagy.count,
      totalPages: Math.max(1, pagy.pages),
      totalCountIsExact: true,
    };
  }

  if (rowCount < pageSize) {
    const totalCount = (page - 1) * pageSize + rowCount;
    return {
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, page),
      totalCountIsExact: true,
    };
  }

  return {
    page,
    pageSize,
    totalCount: page * pageSize,
    totalPages: page + 1,
    totalCountIsExact: false,
  };
}

export function hasNextScottPage<T>(result: ScottPaginatedResult<T>): boolean {
  if (result.totalCountIsExact) {
    return result.page < result.totalPages;
  }
  return result.data.length === result.pageSize;
}

/** Load every page until the last short page or maxPages safety cap. */
export async function fetchAllScottPages<T>(
  fetchPage: (p: ScottPageParams) => Promise<ScottPaginatedResult<T>>,
  options?: { maxPages?: number; pageSize?: number; concurrency?: number },
): Promise<T[]> {
  const pageSize = Math.min(
    options?.pageSize ?? config.pagination.maxPageSize,
    config.pagination.maxPageSize,
  );
  const maxPages = options?.maxPages ?? 250;
  // Cap concurrent requests to avoid overwhelming the Edge Function
  const concurrency = options?.concurrency ?? 5;

  // Fetch page 1 to discover the total page count
  let firstResult: ScottPaginatedResult<T>;
  try {
    firstResult = await fetchPage({ page: 1, items: pageSize });
  } catch (err) {
    console.error('fetchAllScottPages: Error on page 1:', err);
    throw err;
  }

  const out: T[] = [...firstResult.data];

  // If everything fit on the first page we're done
  if (firstResult.data.length < pageSize) return out;
  if (firstResult.totalCountIsExact && firstResult.totalPages <= 1) return out;

  // Determine remaining pages
  const totalPages = firstResult.totalCountIsExact
    ? Math.min(firstResult.totalPages, maxPages)
    : maxPages;

  if (totalPages <= 1) return out;

  // Fetch remaining pages in batches to avoid overwhelming the Edge Function
  const remainingPageNums = Array.from(
    { length: totalPages - 1 },
    (_, i) => i + 2,
  );

  // Process in chunks of `concurrency` pages at a time
  const resultsByPage = new Array<ScottPaginatedResult<T>>(totalPages - 1);
  for (let i = 0; i < remainingPageNums.length; i += concurrency) {
    const batch = remainingPageNums.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (page) => {
        try {
          return { page, result: await fetchPage({ page, items: pageSize }) };
        } catch (err) {
          console.error(`fetchAllScottPages: Error on page ${page}:`, err);
          throw err;
        }
      }),
    );
    for (const { page, result } of batchResults) {
      resultsByPage[page - 2] = result;
    }
  }

  for (const res of resultsByPage) {
    if (res) out.push(...res.data);
  }

  return out;
}

/** Load every matching row (same paging rules as `fetchAllScottPages`) and return their ids. */
export async function fetchAllRecordIds<T extends { id: string }>(
  fetchPage: (p: ScottPageParams) => Promise<ScottPaginatedResult<T>>,
  options?: { maxPages?: number; pageSize?: number },
): Promise<string[]> {
  const rows = await fetchAllScottPages(fetchPage, options);
  return rows.map((r) => r.id);
}
