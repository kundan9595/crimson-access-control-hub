import React from 'react';
import {
  BulkEditView,
  BulkEditPageShell,
  useBulkEditCloser,
} from '@/components/masters/bulk-edit';
import {
  profitMarginsColumns,
  profitMarginsGetRowId,
  profitMarginsCreateEmptyRow,
  profitMarginsToCreatePayload,
  profitMarginsToUpdatePayload,
  profitMarginsQueryKey,
} from '@/components/masters/bulk-edit/configs/profitMarginsConfig';
import {
  useAllProfitMargins,
  useCreateProfitMargin,
  useUpdateProfitMargin,
  useDeleteProfitMargin,
} from '@/hooks/masters/useProfitMargins';
import type { ProfitMargin } from '@/services/masters/profitMarginsService';

const ProfitMarginBulkEditPage = () => {
  const closeTab = useBulkEditCloser('/masters/profit-margin');
  const { data: allProfitMargins = [], isLoading: isLoadingAll } = useAllProfitMargins();

  const createMut = useCreateProfitMargin();
  const updateMut = useUpdateProfitMargin();
  const deleteMut = useDeleteProfitMargin();

  return (
    <BulkEditPageShell
      title="Profit Margins"
      subtitle={`${allProfitMargins.length} record${allProfitMargins.length === 1 ? '' : 's'}`}
      onClose={closeTab}
    >
      <BulkEditView<
        ProfitMargin,
        ReturnType<typeof profitMarginsToCreatePayload>,
        ReturnType<typeof profitMarginsToUpdatePayload>
      >
        title="Profit Margins"
        columns={profitMarginsColumns}
        data={allProfitMargins}
        isLoading={isLoadingAll}
        getRowId={profitMarginsGetRowId}
        createEmptyRow={profitMarginsCreateEmptyRow}
        toCreatePayload={profitMarginsToCreatePayload}
        toUpdatePayload={profitMarginsToUpdatePayload}
        queryKey={profitMarginsQueryKey}
        createMutation={createMut.mutateAsync}
        updateMutation={updateMut.mutateAsync}
        deleteMutation={deleteMut.mutateAsync}
        onClose={closeTab}
      />
    </BulkEditPageShell>
  );
};

export default ProfitMarginBulkEditPage;
