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

// Scott API interface - matches the API exactly
export interface ScottBaseProduct {
  id: string;
  name: string;
  base_of: number;
  base_sn: number;
  tims_cost: number;
  adult_consumption: number;
  kids_consumption: number;
  over_header_percentage: number;
  calculator: number;
  branding_sides: number; // Single number, not array
  sample_rate: number;
  base_product_type_id?: string;
  asset_info_id?: string;
  image_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Relations that may be populated
  base_product_type?: {
    id: string;
    name: string;
  };
  asset_info?: {
    id: string;
    name: string;
  };
}

// Normalize Scott API response to the existing interface
function normalizeBaseProduct(r: Record<string, unknown>): ScottBaseProduct {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  return {
    id: normalizeId(r.id ?? r.base_product_id),
    name: String(r.name ?? ''),
    base_of: Number(r.base_of ?? 0),
    base_sn: Number(r.base_sn ?? 0),
    tims_cost: Number(r.tims_cost ?? r.trims_cost ?? 0),
    adult_consumption: Number(r.adult_consumption ?? 0),
    kids_consumption: Number(r.kids_consumption ?? 0),
    over_header_percentage: Number(r.over_header_percentage ?? r.overhead_percentage ?? 0),
    calculator: Number(r.calculator ?? 0),
    branding_sides: Number(r.branding_sides ?? 0),
    sample_rate: Number(r.sample_rate ?? 0),
    base_product_type_id: r.base_product_type_id ? String(r.base_product_type_id) : undefined,
    asset_info_id: r.asset_info_id ? String(r.asset_info_id) : undefined,
    image_url: typeof r.image === 'string' ? r.image : r.image_url as string | undefined,
    status,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
  };
}

/** Scott uses `base_of`; legacy rows may use `base_price`. Safe for table/list display. */
export function getBaseProductUnitPriceForDisplay(row: {
  base_of?: number;
  base_price?: number;
}): number {
  const n = Number(row.base_of ?? row.base_price ?? 0);
  return Number.isFinite(n) ? n : 0;
}

// Transform UI data to Scott API form data
async function baseProductToFormData(
  baseProductData: Omit<
    ScottBaseProduct,
    'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'base_product_type' | 'asset_info'
  >,
  imageFile?: File,
): Promise<Record<string, unknown>> {
  const isActive = baseProductData.status === 'active';

  const form: Record<string, unknown> = {
    name: baseProductData.name,
    base_of: String(baseProductData.base_of),
    base_sn: String(baseProductData.base_sn),
    tims_cost: String(baseProductData.tims_cost),
    adult_consumption: String(baseProductData.adult_consumption),
    kids_consumption: String(baseProductData.kids_consumption),
    over_header_percentage: String(baseProductData.over_header_percentage),
    calculator: String(baseProductData.calculator),
    branding_sides: String(baseProductData.branding_sides),
    sample_rate: String(baseProductData.sample_rate),
    is_deleted: isActive ? 'false' : 'true',
  };

  if (baseProductData.base_product_type_id) {
    form.base_product_type_id = baseProductData.base_product_type_id;
  }

  if (baseProductData.asset_info_id) {
    form.asset_info_id = baseProductData.asset_info_id;
  }

  // Handle image upload
  if (imageFile) {
    form.image = imageFile;
  } else if (baseProductData.image_url) {
    // If there's an existing URL but no new file, try to convert
    try {
      form.image = await urlToScottFile(baseProductData.image_url, 'base_product_image.png');
    } catch {
      // Ignore error, image is optional
    }
  }

  return form;
}

export async function fetchBaseProductsPaginated(
  params?: Partial<ScottPageParams>,
): Promise<ScottPaginatedResult<ScottBaseProduct>> {
  const p = normalizeScottPageParams(params);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'base_products',
    method: 'GET',
    query: {
      items: p.items,
      page: p.page,
      is_deleted: false,
    },
  });
  const data = extractRecords(body).map((r) => normalizeBaseProduct(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchBaseProducts = async (): Promise<ScottBaseProduct[]> =>
  fetchAllScottPages((pp) => fetchBaseProductsPaginated(pp));

export const getBaseProductById = async (id: string): Promise<ScottBaseProduct | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'base_products',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizeBaseProduct(data);
};

export const createBaseProduct = async (
  baseProductData: Omit<
    ScottBaseProduct,
    'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'base_product_type' | 'asset_info'
  >,
  imageFile?: File,
): Promise<ScottBaseProduct> => {
  const form = await baseProductToFormData(baseProductData, imageFile);

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'base_products',
    method: 'POST',
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeBaseProduct(row);
  }
  throw new Error('Failed to create base product: invalid response');
};

export const updateBaseProduct = async (
  id: string,
  updates: Partial<
    Omit<
      ScottBaseProduct,
      'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'base_product_type' | 'asset_info'
    >
  >,
  imageFile?: File,
): Promise<ScottBaseProduct> => {
  const form: Record<string, unknown> = {};

  if (updates.name !== undefined) form.name = updates.name;
  if (updates.base_of !== undefined) form.base_of = String(updates.base_of);
  if (updates.base_sn !== undefined) form.base_sn = String(updates.base_sn);
  if (updates.tims_cost !== undefined) form.tims_cost = String(updates.tims_cost);
  if (updates.adult_consumption !== undefined)
    form.adult_consumption = String(updates.adult_consumption);
  if (updates.kids_consumption !== undefined)
    form.kids_consumption = String(updates.kids_consumption);
  if (updates.over_header_percentage !== undefined)
    form.over_header_percentage = String(updates.over_header_percentage);
  if (updates.calculator !== undefined) form.calculator = String(updates.calculator);
  if (updates.branding_sides !== undefined) form.branding_sides = String(updates.branding_sides);
  if (updates.sample_rate !== undefined) form.sample_rate = String(updates.sample_rate);
  if (updates.status !== undefined) {
    form.is_deleted = updates.status === 'active' ? 'false' : 'true';
  }
  if (updates.base_product_type_id !== undefined) {
    form.base_product_type_id = updates.base_product_type_id;
  }
  if (updates.asset_info_id !== undefined) {
    form.asset_info_id = updates.asset_info_id;
  }

  // Handle image
  if (imageFile) {
    form.image = imageFile;
  } else if (updates.image_url) {
    try {
      form.image = await urlToScottFile(updates.image_url, 'base_product_image.png');
    } catch {
      // Ignore error
    }
  }

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'base_products',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeBaseProduct(row);
  }
  throw new Error('Failed to update base product: invalid response');
};

export const deleteBaseProduct = async (id: string): Promise<void> => {
  await callScottDashboard<Record<string, unknown>>({
    resource: 'base_products',
    method: 'DELETE',
    pathSuffix: id,
  });
};

// Additional endpoints for managing related entities

// Update size types for a base product
export const updateBaseProductSizeTypes = async (
  id: string,
  sizeTypeIds: string[],
): Promise<void> => {
  const formData: Record<string, unknown> = {};
  sizeTypeIds.forEach((sizeTypeId, index) => {
    formData[`size_type_ids[${index}]`] = sizeTypeId;
  });

  await callScottDashboard<Record<string, unknown>>({
    resource: 'base_products',
    method: 'PATCH',
    pathSuffix: `${id}/update_size_types`,
    body: formData,
  });
};

// Update categories for a base product
export const updateBaseProductCategories = async (
  id: string,
  categoryIds: string[],
): Promise<void> => {
  const formData: Record<string, unknown> = {};
  categoryIds.forEach((categoryId, index) => {
    formData[`category_ids[${index}]`] = categoryId;
  });

  await callScottDashboard<Record<string, unknown>>({
    resource: 'base_products',
    method: 'PATCH',
    pathSuffix: `${id}/update_categories`,
    body: formData,
  });
};

// Update fabrics for a base product
export const updateBaseProductFabrics = async (
  id: string,
  fabricIds: string[],
): Promise<void> => {
  const formData: Record<string, unknown> = {};
  fabricIds.forEach((fabricId, index) => {
    formData[`fabric_ids[${index}]`] = fabricId;
  });

  await callScottDashboard<Record<string, unknown>>({
    resource: 'base_products',
    method: 'PATCH',
    pathSuffix: `${id}/update_fabrics`,
    body: formData,
  });
};

// Update parts for a base product
export const updateBaseProductParts = async (
  id: string,
  partIds: string[],
): Promise<void> => {
  const formData: Record<string, unknown> = {};
  partIds.forEach((partId, index) => {
    formData[`part_ids[${index}]`] = partId;
  });

  await callScottDashboard<Record<string, unknown>>({
    resource: 'base_products',
    method: 'PATCH',
    pathSuffix: `${id}/update_parts`,
    body: formData,
  });
};
