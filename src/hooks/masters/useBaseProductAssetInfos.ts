import { useQuery } from '@tanstack/react-query';
import {
  fetchBaseProductAssetInfos,
  fetchBaseProductAssetInfosPaginated,
  createBaseProductAssetInfo,
  updateBaseProductAssetInfo,
  deleteBaseProductAssetInfo,
  type BaseProductAssetInfo,
} from '@/services/masters/baseProductAssetInfosService';
import { useCreateMutation, useUpdateMutation, useDeleteMutation } from './shared/utils';
import { config } from '@/config/environment';

export { type BaseProductAssetInfo } from '@/services/masters/baseProductAssetInfosService';

export const useBaseProductAssetInfos = (
  page: number = 1,
  pageSize: number = config.pagination.defaultPageSize,
) => {
  return useQuery({
    queryKey: ['baseProductAssetInfos', 'list', page, pageSize],
    queryFn: () => fetchBaseProductAssetInfosPaginated({ page, items: pageSize }),
    placeholderData: (prev) => prev,
  });
};

export const useAllBaseProductAssetInfos = () => {
  return useQuery({
    queryKey: ['baseProductAssetInfos', 'all'],
    queryFn: fetchBaseProductAssetInfos,
    staleTime: config.cache.staleTime,
  });
};

export const useCreateBaseProductAssetInfo = () => {
  return useCreateMutation<
    Omit<
      BaseProductAssetInfo,
      'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'base_product' | 'add_on' | 'part' | 'asset_info'
    >
  >({
    queryKey: ['baseProductAssetInfos'],
    mutationFn: createBaseProductAssetInfo,
    successMessage: 'Base product asset link created successfully',
    errorMessage: 'Failed to create base product asset link',
  });
};

export const useUpdateBaseProductAssetInfo = () => {
  return useUpdateMutation<{
    id: string;
    data: Partial<
      Omit<
        BaseProductAssetInfo,
        'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'base_product' | 'add_on' | 'part' | 'asset_info'
      >
    >;
  }>({
    queryKey: ['baseProductAssetInfos'],
    mutationFn: ({ id, data }) => updateBaseProductAssetInfo(id, data),
    successMessage: 'Base product asset link updated successfully',
    errorMessage: 'Failed to update base product asset link',
  });
};

export const useDeleteBaseProductAssetInfo = () => {
  return useDeleteMutation({
    queryKey: ['baseProductAssetInfos'],
    mutationFn: deleteBaseProductAssetInfo,
    successMessage: 'Base product asset link deleted successfully',
    errorMessage: 'Failed to delete base product asset link',
  });
};
