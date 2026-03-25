import {
  callScottDashboard,
  extractRecords,
  normalizeId,
} from '@/services/scott/callScottDashboard';

export interface ProfitMargin {
  id: string;
  name: string;
  min_range: number;
  max_range: number;
  margin_percentage: number;
  branding_print: number;
  branding_embroidery: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateProfitMarginData {
  name: string;
  min_range: number;
  max_range: number;
  margin_percentage: number;
  branding_print: number;
  branding_embroidery: number;
  status: string;
}

export interface UpdateProfitMarginData {
  name?: string;
  min_range?: number;
  max_range?: number;
  margin_percentage?: number;
  branding_print?: number;
  branding_embroidery?: number;
  status?: string;
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v !== '') return parseFloat(v) || fallback;
  return fallback;
}

function normalizePm(r: Record<string, unknown>): ProfitMargin {
  const status =
    typeof r.status === 'string'
      ? r.status
      : r.is_deleted === true || r.is_deleted === 'true'
        ? 'deleted'
        : 'active';
  return {
    id: normalizeId(r.id),
    name: String(r.name ?? ''),
    min_range: num(r.min_range),
    max_range: num(r.max_range),
    margin_percentage: num(r.margin_percentage),
    branding_print: num(r.branding_print),
    branding_embroidery: num(r.branding_embroidery),
    status,
    created_at:
      typeof r.created_at === 'string' ? r.created_at : new Date().toISOString(),
    updated_at:
      typeof r.updated_at === 'string' ? r.updated_at : new Date().toISOString(),
  };
}

function toFormBody(
  d: CreateProfitMarginData | (UpdateProfitMarginData & { status?: string }),
): Record<string, unknown> {
  const status = d.status ?? 'active';
  return {
    name: d.name ?? '',
    min_range: String(d.min_range ?? ''),
    max_range: String(d.max_range ?? ''),
    margin_percentage: String(d.margin_percentage ?? ''),
    branding_print: String(d.branding_print ?? ''),
    branding_embroidery: String(d.branding_embroidery ?? ''),
    status,
    is_deleted: status === 'deleted' ? 'true' : 'false',
  };
}

function firstRecord(body: Record<string, unknown>): Record<string, unknown> | null {
  const list = extractRecords(body);
  if (list.length) return list[0]!;
  const data = body.data;
  if (data && typeof data === 'object' && !Array.isArray(data) && 'id' in (data as object)) {
    return data as Record<string, unknown>;
  }
  return null;
}

export const profitMarginsService = {
  async getAll(): Promise<ProfitMargin[]> {
    const { body } = await callScottDashboard<Record<string, unknown>>({
      resource: 'profit_margins',
      method: 'GET',
      query: {
        items: 500,
        page: 1,
        is_deleted: false,
        status: 'active',
      },
    });
    return extractRecords(body).map((r) => normalizePm(r));
  },

  async getById(id: string): Promise<ProfitMargin | null> {
    const all = await this.getAll();
    return all.find((p) => p.id === id) ?? null;
  },

  async create(profitMarginData: CreateProfitMarginData): Promise<ProfitMargin> {
    const { body } = await callScottDashboard<Record<string, unknown>>({
      resource: 'profit_margins',
      method: 'POST',
      body: toFormBody(profitMarginData),
    });
    const row = firstRecord(body);
    if (row) return normalizePm(row);
    throw new Error('Unexpected create profit margin response');
  },

  async update(id: string, updates: UpdateProfitMarginData): Promise<ProfitMargin> {
    const all = await this.getAll();
    const cur = all.find((p) => p.id === id);
    if (!cur) throw new Error('Profit margin not found');
    const merged: CreateProfitMarginData = {
      name: updates.name ?? cur.name,
      min_range: updates.min_range ?? cur.min_range,
      max_range: updates.max_range ?? cur.max_range,
      margin_percentage: updates.margin_percentage ?? cur.margin_percentage,
      branding_print: updates.branding_print ?? cur.branding_print,
      branding_embroidery: updates.branding_embroidery ?? cur.branding_embroidery,
      status: updates.status ?? cur.status,
    };
    const { body } = await callScottDashboard<Record<string, unknown>>({
      resource: 'profit_margins',
      method: 'PATCH',
      pathSuffix: id,
      body: toFormBody(merged),
    });
    const row = firstRecord(body);
    if (row) return normalizePm(row);
    const again = await this.getById(id);
    if (again) return again;
    throw new Error('Unexpected update profit margin response');
  },

  async delete(id: string): Promise<ProfitMargin> {
    await callScottDashboard({
      resource: 'profit_margins',
      method: 'DELETE',
      pathSuffix: id,
    });
    const cur = await this.getById(id);
    return (
      cur ?? {
        id,
        name: '',
        min_range: 0,
        max_range: 0,
        margin_percentage: 0,
        branding_print: 0,
        branding_embroidery: 0,
        status: 'deleted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
  },

  async bulkCreate(profitMargins: CreateProfitMarginData[]): Promise<ProfitMargin[]> {
    const out: ProfitMargin[] = [];
    for (const pm of profitMargins) {
      out.push(await this.create(pm));
    }
    return out;
  },
};
