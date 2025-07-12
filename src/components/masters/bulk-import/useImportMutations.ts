
import { useMutation } from '@tanstack/react-query';
import { useCreateBrand } from '@/hooks/masters/useBrands';
import { useBulkCreateAddOns } from '@/hooks/masters/useAddOns';
import { BulkImportType } from './types';

export const useImportMutations = () => {
  const createBrandMutation = useCreateBrand();
  const bulkCreateAddOnsMutation = useBulkCreateAddOns();

  const getMutationForType = (type: BulkImportType) => {
    switch (type) {
      case 'brands':
        return createBrandMutation;
      case 'add-ons':
        return bulkCreateAddOnsMutation;
      default:
        throw new Error(`Unsupported import type: ${type}`);
    }
  };

  return { getMutationForType };
};
