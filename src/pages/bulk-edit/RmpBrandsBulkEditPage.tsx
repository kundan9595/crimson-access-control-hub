import React, { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BulkEditView,
  BulkEditPageShell,
  useBulkEditCloser,
} from '@/components/masters/bulk-edit';
import {
  buildRmpBrandsColumns,
  rmpBrandsGetRowId,
  rmpBrandsCreateEmptyRow,
  rmpBrandsToCreatePayload,
  rmpBrandsToUpdatePayload,
  rmpBrandsQueryKey,
  type RmpBrandCreatePayload,
  type RmpBrandUpdatePayload,
} from '@/components/masters/bulk-edit/configs/rmpBrandsConfig';
import {
  useAllRmpBrands,
  useDeleteRmpBrand,
} from '@/hooks/masters/useRmpBrands';
import { useAllBrands } from '@/hooks/masters/useBrands';
import { createRmpBrand, updateRmpBrand } from '@/services/masters/rmpBrandsService';
import type { RmpBrand } from '@/services/masters/rmpBrandsService';

const RmpBrandsBulkEditPage = () => {
  const closeTab = useBulkEditCloser('/masters/rmp-brands');
  const queryClient = useQueryClient();
  const { data: allRmpBrands = [], isLoading: isLoadingAll } = useAllRmpBrands();
  const { data: authorizedBrands = [] } = useAllBrands();

  const deleteMut = useDeleteRmpBrand();

  const authorizedBrandOptions = useMemo(
    () => authorizedBrands.map((b) => ({ value: b.id, label: b.name })),
    [authorizedBrands],
  );

  const authorizedBrandEditorOptions = useMemo(
    () =>
      authorizedBrands
        .filter((b) => b.status === 'active')
        .map((b) => ({ value: b.id, label: b.name })),
    [authorizedBrands],
  );

  const columns = useMemo(
    () =>
      buildRmpBrandsColumns({
        authorizedBrandOptions,
        authorizedBrandEditorOptions,
      }),
    [authorizedBrandOptions, authorizedBrandEditorOptions],
  );

  // Custom create mutation that extracts imageFile from payload
  const handleCreate = async (payload: RmpBrandCreatePayload) => {
    const { imageFile, ...data } = payload;
    await createRmpBrand(data, imageFile);
    toast.success('RMP brand created successfully');
    await queryClient.invalidateQueries({ queryKey: rmpBrandsQueryKey });
  };

  // Custom update mutation that extracts imageFile from payload
  const handleUpdate = async (params: { id: string; updates: RmpBrandUpdatePayload }) => {
    const { imageFile, ...updates } = params.updates;
    await updateRmpBrand(params.id, updates, imageFile);
    toast.success('RMP brand updated successfully');
    await queryClient.invalidateQueries({ queryKey: rmpBrandsQueryKey });
  };

  return (
    <BulkEditPageShell
      title="RMP Brands"
      subtitle={`${allRmpBrands.length} record${allRmpBrands.length === 1 ? '' : 's'}`}
      onClose={closeTab}
    >
      <BulkEditView<
        RmpBrand,
        ReturnType<typeof rmpBrandsToCreatePayload>,
        ReturnType<typeof rmpBrandsToUpdatePayload>
      >
        title="RMP Brands"
        columns={columns}
        data={allRmpBrands}
        isLoading={isLoadingAll}
        getRowId={rmpBrandsGetRowId}
        createEmptyRow={rmpBrandsCreateEmptyRow}
        toCreatePayload={rmpBrandsToCreatePayload}
        toUpdatePayload={rmpBrandsToUpdatePayload}
        queryKey={rmpBrandsQueryKey}
        createMutation={handleCreate}
        updateMutation={handleUpdate}
        deleteMutation={deleteMut.mutateAsync}
        onClose={closeTab}
      />
    </BulkEditPageShell>
  );
};

export default RmpBrandsBulkEditPage;
