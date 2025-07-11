
import { 
  useCreateBrand, 
  useCreateCategory, 
  useCreateColor, 
  useCreateSizeGroup, 
  useCreateZone, 
  useCreatePriceType, 
  useCreateVendor,
  useCreateStyle,
  useCreateClass,
  useCreateSku
} from '@/hooks/masters';
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
      default:
        throw new Error(`Unknown import type: ${type}`);
    }
  };

  return { getMutationForType };
};
