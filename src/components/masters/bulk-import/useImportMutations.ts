
import { useCreateBrand } from '@/hooks/masters/useBrands';
import { useCreateCategory } from '@/hooks/masters/useCategories';
import { useCreateColor } from '@/hooks/masters/useColors';
import { useCreateSizeGroup } from '@/hooks/masters/useSizes';
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
import { BulkImportType } from './types';

export const useImportMutations = () => {
  const createBrandMutation = useCreateBrand();
  const createCategoryMutation = useCreateCategory();
  const createColorMutation = useCreateColor();
  const createSizeGroupMutation = useCreateSizeGroup();
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
        return createSizeGroupMutation;
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
      default:
        throw new Error(`Unsupported import type: ${type}`);
    }
  };

  return {
    getMutationForType,
  };
};
