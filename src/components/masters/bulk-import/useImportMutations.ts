
import { useCreateBrand } from '@/hooks/masters/useBrands';
import { useCreateCategory } from '@/hooks/masters/useCategories';
import { useCreateColor } from '@/hooks/masters/useColors';
import { useCreateSize } from '@/hooks/masters/useSizes';
import { useCreateZone } from '@/hooks/masters/useZones';
import { useCreatePriceType } from '@/hooks/masters/usePriceTypes';
import { useCreateVendor } from '@/hooks/masters/useVendors';
import { useCreateStyle } from '@/hooks/masters/useStyles';
import { useCreateClass } from '@/hooks/masters/useClasses';
import { useCreateSku } from '@/hooks/masters/useSkus';
import { useCreateAddOn } from '@/hooks/masters/useAddOns';
import { useCreateAppAsset } from '@/hooks/masters/useAppAssets';
import { useCreatePart } from '@/hooks/masters/useParts';
import { useCreateProfitMargin } from '@/hooks/masters/useProfitMargins';
import { useCreatePromotionalBanner } from '@/hooks/masters/usePromotionalBanners';
import { useCreatePromotionalAsset } from '@/hooks/masters/usePromotionalAssets';
import { inventoryService } from '@/services/inventory/inventoryService';
import { BulkImportType } from './types';
import type { Size } from '@/services/masters/types';

/** Map bulk-import row data to Scott `sc_sizes` create payload (size_group_id = size_type_id). */
function toCreateSizePayload(data: Record<string, unknown>): Omit<
  Size,
  'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
> {
  const name = String(data.name ?? '').trim();
  if (!name) {
    throw new Error('Name is required');
  }
  const code = String(data.code ?? data.name ?? '').trim();
  const sizeTypeId = String(
    data.size_type_id ?? data.size_group_id ?? data.size_type ?? '',
  ).trim();
  if (!sizeTypeId) {
    throw new Error(
      'Size Type ID is required. Add a "Size Type ID" column with the Scott size type id for each row.',
    );
  }
  const sortRaw = data.sort_order ?? data.sort_position;
  let sort_order: number | undefined;
  if (sortRaw !== undefined && sortRaw !== null && String(sortRaw).trim() !== '') {
    const n = Number(sortRaw);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error('Sort Order must be a non-negative number');
    }
    sort_order = n;
  }
  const statusRaw = String(data.status ?? 'active').toLowerCase();
  const status = statusRaw === 'inactive' ? 'inactive' : 'active';
  return {
    name,
    code: code || name,
    size_group_id: sizeTypeId,
    status,
    ...(sort_order !== undefined ? { sort_order } : {}),
  };
}

export const useImportMutations = () => {
  const createBrandMutation = useCreateBrand();
  const createCategoryMutation = useCreateCategory();
  const createColorMutation = useCreateColor();
  const createSizeMutation = useCreateSize();
  const createZoneMutation = useCreateZone();
  const createPriceTypeMutation = useCreatePriceType();
  const createVendorMutation = useCreateVendor();
  const createStyleMutation = useCreateStyle();
  const createClassMutation = useCreateClass();
  const createSkuMutation = useCreateSku();
  const createAddOnMutation = useCreateAddOn();
  const createAppAssetMutation = useCreateAppAsset();
  const createPartMutation = useCreatePart();
  const createProfitMarginMutation = useCreateProfitMargin();
  const createPromotionalBannerMutation = useCreatePromotionalBanner();
  const createPromotionalAssetMutation = useCreatePromotionalAsset();

  const getMutationForType = (type: BulkImportType) => {
    switch (type) {
      case 'brands':
        return createBrandMutation;
      case 'categories':
        return createCategoryMutation;
      case 'colors':
        return createColorMutation;
      case 'sizeGroups':
      case 'sizes':
        return {
          mutateAsync: async (record: Record<string, unknown>) => {
            return createSizeMutation.mutateAsync(toCreateSizePayload(record));
          },
        };
      case 'zones':
        return createZoneMutation;
      case 'priceTypes':
        return createPriceTypeMutation;
      case 'vendors':
        return createVendorMutation;
      case 'styles':
        return createStyleMutation;
      case 'classes':
        return createClassMutation;
      case 'skus':
        return createSkuMutation;
      case 'add-ons':
        return createAddOnMutation;
      case 'appAssets':
        return createAppAssetMutation;
      case 'parts':
        return createPartMutation;
      case 'profitMargins':
        return createProfitMarginMutation;
      case 'promotionalBanners':
        return createPromotionalBannerMutation;
      case 'promotionalAssets':
        return createPromotionalAssetMutation;
      case 'inventory':
        // For inventory, we'll use a custom mutation since it's not a standard master
        return {
          mutateAsync: async (data: any) => {
            // This will be handled specially in the bulk import process
            return data;
          }
        };
      default:
        throw new Error(`Unsupported import type: ${type}`);
    }
  };

  return {
    getMutationForType,
  };
};
