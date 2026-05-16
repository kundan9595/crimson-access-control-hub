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
  options?: { maxPages?: number; pageSize?: number },
): Promise<T[]> {
  const pageSize = Math.min(
    options?.pageSize ?? config.pagination.maxPageSize,
    config.pagination.maxPageSize,
  );
  const maxPages = options?.maxPages ?? 250;
  const out: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    try {
      const res = await fetchPage({ page, items: pageSize });
      out.push(...res.data);
      if (res.data.length < pageSize) break;
      if (res.totalCountIsExact && page >= res.totalPages) break;
      if (!res.totalCountIsExact && res.data.length === 0) break;
    } catch (err) {
      console.error(`fetchAllScottPages: Error on page ${page}:`, err);
      throw err;
    }
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
