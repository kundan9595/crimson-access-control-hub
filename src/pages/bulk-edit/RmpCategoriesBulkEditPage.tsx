import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BulkEditView,
  BulkEditPageShell,
  useBulkEditCloser,
} from '@/components/masters/bulk-edit';
import {
  rmpCategoriesColumns,
  rmpCategoriesGetRowId,
  rmpCategoriesCreateEmptyRow,
  rmpCategoriesToCreatePayload,
  rmpCategoriesToUpdatePayload,
  rmpCategoriesQueryKey,
  type RmpCategoryCreatePayload,
  type RmpCategoryUpdatePayload,
} from '@/components/masters/bulk-edit/configs/rmpCategoriesConfig';
import {
  useAllRmpCategories,
  useDeleteRmpCategory,
} from '@/hooks/masters/useRmpCategories';
import { createRmpCategory, updateRmpCategory } from '@/services/masters/rmpCategoriesService';
import type { RmpCategory } from '@/services/masters/rmpCategoriesService';

const RmpCategoriesBulkEditPage = () => {
  const closeTab = useBulkEditCloser('/masters/rmp-categories');
  const queryClient = useQueryClient();
  const { data: allRmpCategories = [], isLoading: isLoadingAll } = useAllRmpCategories();

  const deleteMut = useDeleteRmpCategory();

  // Custom create mutation that extracts imageFile from payload
  const handleCreate = async (payload: RmpCategoryCreatePayload) => {
    const { imageFile, ...data } = payload;
    await createRmpCategory(data, imageFile);
    toast.success('RMP category created successfully');
    await queryClient.invalidateQueries({ queryKey: rmpCategoriesQueryKey });
  };

  // Custom update mutation that extracts imageFile from payload
  const handleUpdate = async (params: { id: string; updates: RmpCategoryUpdatePayload }) => {
    const { imageFile, ...updates } = params.updates;
    await updateRmpCategory(params.id, updates, imageFile);
    toast.success('RMP category updated successfully');
    await queryClient.invalidateQueries({ queryKey: rmpCategoriesQueryKey });
  };

  return (
    <BulkEditPageShell
      title="RMP Categories"
      subtitle={`${allRmpCategories.length} record${allRmpCategories.length === 1 ? '' : 's'}`}
      onClose={closeTab}
    >
      <BulkEditView<
        RmpCategory,
        ReturnType<typeof rmpCategoriesToCreatePayload>,
        ReturnType<typeof rmpCategoriesToUpdatePayload>
      >
        title="RMP Categories"
        columns={rmpCategoriesColumns}
        data={allRmpCategories}
        isLoading={isLoadingAll}
        getRowId={rmpCategoriesGetRowId}
        createEmptyRow={rmpCategoriesCreateEmptyRow}
        toCreatePayload={rmpCategoriesToCreatePayload}
        toUpdatePayload={rmpCategoriesToUpdatePayload}
        queryKey={rmpCategoriesQueryKey}
        createMutation={handleCreate}
        updateMutation={handleUpdate}
        deleteMutation={deleteMut.mutateAsync}
        onClose={closeTab}
      />
    </BulkEditPageShell>
  );
};

export default RmpCategoriesBulkEditPage;
