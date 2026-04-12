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

// Scott API interface for Promotional Banners (RMP)
export interface ScottPromotionalBanner {
  id: string;
  title: string;
  status: string;
  position: number;
  image_url?: string;
  rmp_category_id?: string;
  rmp_class_id?: string;
  rmp_brand_id?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Populated relations
  rmp_category?: {
    id: string;
    name: string;
  };
  rmp_class?: {
    id: string;
    name: string;
  };
  rmp_brand?: {
    id: string;
    name: string;
  };
}

// Normalize Scott API response
function normalizePromotionalBanner(r: Record<string, unknown>): ScottPromotionalBanner {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  return {
    id: normalizeId(r.id ?? r.promotional_banner_id),
    title: String(r.title ?? ''),
    status,
    position: Number(r.position ?? r.sort_order ?? 0),
    image_url: typeof r.image === 'string' ? r.image : r.image_url as string | undefined,
    rmp_category_id: r.rmp_category_id ? String(r.rmp_category_id) : undefined,
    rmp_class_id: r.rmp_class_id ? String(r.rmp_class_id) : undefined,
    rmp_brand_id: r.rmp_brand_id ? String(r.rmp_brand_id) : undefined,
    is_deleted: r.is_deleted === true || r.is_deleted === 'true',
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
  };
}

// Transform UI data to Scott API form data
async function promotionalBannerToFormData(
  bannerData: Omit<ScottPromotionalBanner, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_category' | 'rmp_class' | 'rmp_brand'>,
  imageFile?: File,
): Promise<Record<string, unknown>> {
  const form: Record<string, unknown> = {
    title: bannerData.title,
    status: bannerData.status,
    position: String(bannerData.position),
  };

  // Add optional fields only if they have values
  if (bannerData.rmp_category_id) {
    form.rmp_category_id = bannerData.rmp_category_id;
  }

  if (bannerData.rmp_class_id) {
    form.rmp_class_id = bannerData.rmp_class_id;
  }

  if (bannerData.rmp_brand_id) {
    form.rmp_brand_id = bannerData.rmp_brand_id;
  }

  // Handle image upload
  if (imageFile) {
    form.image = imageFile;
  } else if (bannerData.image_url) {
    try {
      form.image = await urlToScottFile(bannerData.image_url, 'banner_image.png');
    } catch {
      // Ignore error, image is optional
    }
  }

  return form;
}

export interface PromotionalBannerFilter {
  search?: string;
}

export async function fetchPromotionalBannersPaginated(
  params?: Partial<ScottPageParams>,
  filters?: PromotionalBannerFilter,
): Promise<ScottPaginatedResult<ScottPromotionalBanner>> {
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
    resource: 'promotional_banners',
    method: 'GET',
    query,
  });
  const data = extractRecords(body).map((r) => normalizePromotionalBanner(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchPromotionalBanners = async (): Promise<ScottPromotionalBanner[]> =>
  fetchAllScottPages((pp) => fetchPromotionalBannersPaginated(pp));

export const getPromotionalBannerById = async (id: string): Promise<ScottPromotionalBanner | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'promotional_banners',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizePromotionalBanner(data);
};

export const createPromotionalBanner = async (
  bannerData: Omit<ScottPromotionalBanner, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_category' | 'rmp_class' | 'rmp_brand' | 'is_deleted'>,
  imageFile?: File,
): Promise<ScottPromotionalBanner> => {
  const form = await promotionalBannerToFormData(bannerData, imageFile);

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'promotional_banners',
    method: 'POST',
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizePromotionalBanner(row);
  }
  throw new Error('Failed to create promotional banner: invalid response');
};

export const updatePromotionalBanner = async (
  id: string,
  updates: Partial<
    Omit<
      ScottPromotionalBanner,
      'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'rmp_category' | 'rmp_class' | 'rmp_brand' | 'is_deleted'
    >
  >,
  imageFile?: File,
): Promise<ScottPromotionalBanner> => {
  const form: Record<string, unknown> = {};

  if (updates.title !== undefined) form.title = updates.title;
  if (updates.status !== undefined) form.status = updates.status;
  if (updates.position !== undefined) form.position = String(updates.position);
  if (updates.rmp_category_id !== undefined) form.rmp_category_id = updates.rmp_category_id;
  if (updates.rmp_class_id !== undefined) form.rmp_class_id = updates.rmp_class_id;
  if (updates.rmp_brand_id !== undefined) form.rmp_brand_id = updates.rmp_brand_id;

  // Handle image
  if (imageFile) {
    form.image = imageFile;
  } else if (updates.image_url) {
    try {
      form.image = await urlToScottFile(updates.image_url, 'banner_image.png');
    } catch {
      // Ignore error
    }
  }

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'promotional_banners',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizePromotionalBanner(row);
  }
  throw new Error('Failed to update promotional banner: invalid response');
};

export const deletePromotionalBanner = async (id: string): Promise<void> => {
  await callScottDashboard<Record<string, unknown>>({
    resource: 'promotional_banners',
    method: 'DELETE',
    pathSuffix: id,
  });
};
