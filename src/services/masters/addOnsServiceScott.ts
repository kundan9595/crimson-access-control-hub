import {
  callScottDashboard,
  extractRecords,
  extractScottEntity,
  normalizeId,
  fileToScottPayload,
} from '@/services/scott/callScottDashboard';
import {
  buildScottPaginatedMeta,
  fetchAllScottPages,
  normalizeScottPageParams,
  type ScottPageParams,
  type ScottPaginatedResult,
} from '@/services/scott/scottPagination';

export interface AddOn {
  id: string;
  name: string;
  price: number;
  add_on_of: number;
  add_on_sn: number;
  has_color: boolean;
  select_type: 'single' | 'multiple' | 'checked';
  group_name: string;
  sort_order: number;
  layer_sort: number;
  status: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

function normalizeAddOn(r: Record<string, unknown>): AddOn {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'inactive'
        : 'active';

  return {
    id: normalizeId(r.id ?? r.add_on_id),
    name: String(r.add_on ?? r.name ?? ''),
    price: Number(r.add_on_price ?? r.price ?? 0),
    add_on_of: Number(r.add_on_of ?? 0),
    add_on_sn: Number(r.add_on_sn ?? 0),
    has_color:
      r.has_color === true ||
      r.has_color === 'true' ||
      r.has_colour === true ||
      r.has_colour === 'true',
    select_type: (r.select_type as 'single' | 'multiple' | 'checked') || 'single',
    group_name: String(r.group_name ?? ''),
    sort_order: Number(r.position ?? r.sort_order ?? 0),
    layer_sort: Number(r.layer_sort ?? 0),
    status,
    image_url: typeof r.image === 'string' ? r.image : r.image_url as string | undefined,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
  };
}

async function addOnToFormData(
  addOnData: Omit<AddOn, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'image_url'>,
  imageFile?: File,
): Promise<Record<string, unknown>> {
  const isActive = addOnData.status === 'active';
  const form: Record<string, unknown> = {
    add_on: addOnData.name,
    add_on_price: String(addOnData.price ?? 0),
    add_on_of: String(addOnData.add_on_of ?? 0),
    add_on_sn: String(addOnData.add_on_sn ?? 0),
    has_color: addOnData.has_color ? 'true' : 'false',
    select_type: addOnData.select_type || 'single',
    group_name: addOnData.group_name,
    position: String(addOnData.sort_order ?? 0),
    layer_sort: String(addOnData.layer_sort ?? 0),
    is_deleted: isActive ? 'false' : 'true',
  };

  if (imageFile) {
    form.image = await fileToScottPayload(imageFile);
  }

  return form;
}

export interface AddOnFilter {
  search?: string;
}

export async function fetchAddOnsPaginated(
  params?: Partial<ScottPageParams>,
  filters?: AddOnFilter,
): Promise<ScottPaginatedResult<AddOn>> {
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
    resource: 'add_ons',
    method: 'GET',
    query,
  });
  const data = extractRecords(body).map((r) => normalizeAddOn(r));
  return {
    data,
    ...buildScottPaginatedMeta(body, p, data.length),
  };
}

export const fetchAddOns = async (): Promise<AddOn[]> =>
  fetchAllScottPages((pp) => fetchAddOnsPaginated(pp));

export const getAddOnById = async (id: string): Promise<AddOn | null> => {
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'add_ons',
    method: 'GET',
    pathSuffix: id,
  });
  const data = (body as { data?: Record<string, unknown> }).data;
  if (!data) return null;
  return normalizeAddOn(data);
};

export const createAddOn = async (
  addOnData: Omit<AddOn, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'image_url'>,
  imageFile?: File,
): Promise<AddOn> => {
  const form = await addOnToFormData(addOnData, imageFile);
  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'add_ons',
    method: 'POST',
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeAddOn(row);
  }
  throw new Error('Failed to create add-on: invalid response');
};

export const updateAddOn = async (
  id: string,
  updates: Partial<Omit<AddOn, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'image_url'>>,
  imageFile?: File,
): Promise<AddOn> => {
  const form: Record<string, unknown> = {};

  if (updates.name !== undefined) form.add_on = updates.name;
  if (updates.price !== undefined) form.add_on_price = String(updates.price);
  if (updates.add_on_of !== undefined) form.add_on_of = String(updates.add_on_of);
  if (updates.add_on_sn !== undefined) form.add_on_sn = String(updates.add_on_sn);
  if (updates.has_color !== undefined) form.has_color = updates.has_color ? 'true' : 'false';
  if (updates.select_type !== undefined) form.select_type = updates.select_type;
  if (updates.group_name !== undefined) form.group_name = updates.group_name;
  if (updates.sort_order !== undefined) form.position = String(updates.sort_order);
  if (updates.layer_sort !== undefined) form.layer_sort = String(updates.layer_sort);
  if (updates.status !== undefined) {
    form.is_deleted = updates.status === 'active' ? 'false' : 'true';
  }
  if (imageFile) {
    form.image = await fileToScottPayload(imageFile);
  }

  const { body } = await callScottDashboard<Record<string, unknown>>({
    resource: 'add_ons',
    method: 'PATCH',
    pathSuffix: id,
    body: form,
  });
  const row = extractScottEntity(body);
  if (row) {
    return normalizeAddOn(row);
  }
  throw new Error('Failed to update add-on: invalid response');
};

export const deleteAddOn = async (id: string): Promise<void> => {
  await callScottDashboard<Record<string, unknown>>({
    resource: 'add_ons',
    method: 'DELETE',
    pathSuffix: id,
  });
};

// Update add-on colors (separate endpoint: /add_ons/:id/update_colors)
export const updateAddOnColors = async (
  id: string,
  colorIds: string[],
): Promise<void> => {
  const formData: Record<string, unknown> = {};
  colorIds.forEach((colorId, index) => {
    formData[`color_ids[${index}]`] = colorId;
  });

  await callScottDashboard<Record<string, unknown>>({
    resource: 'add_ons',
    method: 'PATCH',
    pathSuffix: `${id}/update_colors`,
    body: formData,
  });
};

// Update add-on base products (separate endpoint: /add_ons/:id/update_base_products)
export const updateAddOnBaseProducts = async (
  id: string,
  baseProductIds: string[],
): Promise<void> => {
  const formData: Record<string, unknown> = {};
  baseProductIds.forEach((productId, index) => {
    formData[`base_product_ids[${index}]`] = productId;
  });

  await callScottDashboard<Record<string, unknown>>({
    resource: 'add_ons',
    method: 'PATCH',
    pathSuffix: `${id}/update_base_products`,
    body: formData,
  });
};
