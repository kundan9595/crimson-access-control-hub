import type { PromotionalBanner } from './types';
import {
  callScottDashboard,
  extractRecords,
  extractScottEntity,
  normalizeId,
  urlToScottFile,
} from '@/services/scott/callScottDashboard';
import {
  buildScottPaginatedMeta,
  fetchAllScottPages,
  normalizeScottPageParams,
  type ScottPageParams,
  type ScottPaginatedResult,
} from '@/services/scott/scottPagination';

export type { PromotionalBanner };

function normalizePromotion(r: Record<string, unknown>): PromotionalBanner {
  const name = String(r.name ?? r.title ?? '');
  const thumb =
    typeof r.thumbnail === 'string'
      ? r.thumbnail
      : r.thumbnail && typeof r.thumbnail === 'object' && r.thumbnail !== null && 'url' in r.thumbnail
        ? String((r.thumbnail as { url?: string }).url)
        : undefined;
  const deleted = r.is_deleted === true || r.is_deleted === 'true';
  return {
    id: normalizeId(r.id),
    title: name,
    link: typeof r.link === 'string' ? r.link : undefined,
    category_label: typeof r.category === 'string' ? r.category : undefined,
    upload_date: typeof r.upload_date === 'string' ? r.upload_date : undefined,
    file_size: r.file_size != null ? String(r.file_size) : undefined,
    banner_image: thumb,
    status: deleted ? 'inactive' : 'active',
    position: 0,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
  };
}

async function toPromotionForm(data: {
  title: string;
  link?: string | null;
  category_label?: string | null;
  upload_date?: string | null;
  banner_image?: string | null;
  status: string;
  file_size?: string | null;
}): Promise<Record<string, unknown>> {
  const isDel = data.status !== 'active';
  const body: Record<string, unknown> = {
    name: data.title,
    link: data.link ?? '',
    category: data.category_label ?? '',
    upload_date: data.upload_date ?? '',
    file_size: data.file_size ?? '',
    is_deleted: isDel ? 'true' : 'false',
  };
  if (
    data.banner_image &&
    (data.banner_image.startsWith('http://') || data.banner_image.startsWith('https://'))
  ) {
    try {
      body.thumbnail = await urlToScottFile(data.banner_image, 'thumbnail.png');
    } catch {
      /* optional */
    }
  }
  return body;
}

export interface PromotionalBannerFilter {
  search?: string;
}

async function fetchPromotionsPaginated(
  params?: Partial<ScottPageParams>,
  filters?: PromotionalBannerFilter,
): Promise<ScottPaginatedResult<PromotionalBanner>> {
  const p = normalizeScottPageParams(params);
  const query: Record<string, string | number | boolean | undefined> = {
    items: p.items,
    page: p.page,
    is_deleted: false,
  };
  if (filters?.search) {
    query.search = filters.search;
  }
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'promotions',
    method: 'GET',
    query,
  });
  const data = extractRecords(body).map((r) => normalizePromotion(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const promotionalBannersService = {
  getPage: fetchPromotionsPaginated,

  async getAll(): Promise<PromotionalBanner[]> {
    return fetchAllScottPages((pp) => fetchPromotionsPaginated(pp));
  },

  async getById(id: string): Promise<PromotionalBanner | null> {
    const all = await this.getAll();
    return all.find((b) => b.id === id) ?? null;
  },

  async create(
    banner: Omit<
      PromotionalBanner,
      | 'id'
      | 'created_at'
      | 'updated_at'
      | 'created_by'
      | 'updated_by'
      | 'category'
      | 'brand'
      | 'class'
    >,
  ): Promise<PromotionalBanner> {
    const form = await toPromotionForm({
      title: banner.title,
      link: banner.link,
      category_label: banner.category_label,
      upload_date: banner.upload_date,
      banner_image: banner.banner_image,
      status: banner.status,
      file_size: banner.file_size,
    });
    const { body } = await callScottDashboard<Record<string, unknown>>({
      resource: 'promotions',
      method: 'POST',
      body: form,
    });
    const row = extractScottEntity(body);
    if (row) {
      return normalizePromotion(row);
    }
    throw new Error('Unexpected create promotion response');
  },

  async update(id: string, updates: Partial<PromotionalBanner>): Promise<PromotionalBanner> {
    const all = await this.getAll();
    const cur = all.find((b) => b.id === id);
    if (!cur) throw new Error('Promotion not found');
    const merged = { ...cur, ...updates };
    const form = await toPromotionForm({
      title: merged.title,
      link: merged.link,
      category_label: merged.category_label,
      upload_date: merged.upload_date,
      banner_image: merged.banner_image,
      status: merged.status,
      file_size: merged.file_size,
    });
    const { body } = await callScottDashboard<Record<string, unknown>>({
      resource: 'promotions',
      method: 'PATCH',
      pathSuffix: id,
      body: form,
    });
    const row = extractScottEntity(body);
    if (row) {
      return normalizePromotion(row);
    }
    const again = await this.getById(id);
    if (again) return again;
    throw new Error('Unexpected update promotion response');
  },

  async delete(id: string): Promise<void> {
    await callScottDashboard({
      resource: 'promotions',
      method: 'DELETE',
      pathSuffix: id,
    });
  },

  async bulkCreate(
    banners: Omit<
      PromotionalBanner,
      | 'id'
      | 'created_at'
      | 'updated_at'
      | 'created_by'
      | 'updated_by'
      | 'category'
      | 'brand'
      | 'class'
    >[],
  ): Promise<PromotionalBanner[]> {
    const out: PromotionalBanner[] = [];
    for (const b of banners) {
      out.push(await this.create(b));
    }
    return out;
  },
};
