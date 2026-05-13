import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BulkEditView,
  BulkEditPageShell,
  useBulkEditCloser,
} from '@/components/masters/bulk-edit';
import {
  rmpSizesColumns,
  rmpSizesGetRowId,
  rmpSizesCreateEmptyRow,
  rmpSizesToCreatePayload,
  rmpSizesToUpdatePayload,
  rmpSizesQueryKey,
  type RmpSizeCreatePayload,
  type RmpSizeUpdatePayload,
} from '@/components/masters/bulk-edit/configs/rmpSizesConfig';
import {
  useAllRmpSizes,
  useDeleteRmpSize,
} from '@/hooks/masters/useRmpSizes';
import { createRmpSize, updateRmpSize } from '@/services/masters/rmpSizesService';
import type { RmpSize } from '@/services/masters/rmpSizesService';

const RmpSizesBulkEditPage = () => {
  const closeTab = useBulkEditCloser('/masters/rmp-sizes');
  const queryClient = useQueryClient();
  const { data: allRmpSizes = [], isLoading: isLoadingAll } = useAllRmpSizes();

  const deleteMut = useDeleteRmpSize();

  // Custom create mutation that extracts imageFile from payload
  const handleCreate = async (payload: RmpSizeCreatePayload) => {
    const { imageFile, ...data } = payload;
    await createRmpSize(data, imageFile);
    toast.success('RMP size created successfully');
    await queryClient.invalidateQueries({ queryKey: rmpSizesQueryKey });
  };

  // Custom update mutation that extracts imageFile from payload
  const handleUpdate = async (params: { id: string; updates: RmpSizeUpdatePayload }) => {
    const { imageFile, ...updates } = params.updates;
    await updateRmpSize(params.id, updates, imageFile);
    toast.success('RMP size updated successfully');
    await queryClient.invalidateQueries({ queryKey: rmpSizesQueryKey });
  };

  return (
    <BulkEditPageShell
      title="RMP Sizes"
      subtitle={`${allRmpSizes.length} record${allRmpSizes.length === 1 ? '' : 's'}`}
      onClose={closeTab}
    >
      <BulkEditView<
        RmpSize,
        ReturnType<typeof rmpSizesToCreatePayload>,
        ReturnType<typeof rmpSizesToUpdatePayload>
      >
        title="RMP Sizes"
        columns={rmpSizesColumns}
        data={allRmpSizes}
        isLoading={isLoadingAll}
        getRowId={rmpSizesGetRowId}
        createEmptyRow={rmpSizesCreateEmptyRow}
        toCreatePayload={rmpSizesToCreatePayload}
        toUpdatePayload={rmpSizesToUpdatePayload}
        queryKey={rmpSizesQueryKey}
        createMutation={handleCreate}
        updateMutation={handleUpdate}
        deleteMutation={deleteMut.mutateAsync}
        onClose={closeTab}
      />
    </BulkEditPageShell>
  );
};

export default RmpSizesBulkEditPage;
