import React from 'react';
import {
  BulkEditView,
  BulkEditPageShell,
  useBulkEditCloser,
} from '@/components/masters/bulk-edit';
import {
  rmpPriceTypesColumns,
  rmpPriceTypesGetRowId,
  rmpPriceTypesCreateEmptyRow,
  rmpPriceTypesToCreatePayload,
  rmpPriceTypesToUpdatePayload,
  rmpPriceTypesQueryKey,
} from '@/components/masters/bulk-edit/configs/rmpPriceTypesConfig';
import {
  useAllRmpPriceTypes,
  useCreateRmpPriceType,
  useUpdateRmpPriceType,
  useDeleteRmpPriceType,
} from '@/hooks/masters/useRmpPriceTypes';
import type { RmpPriceType } from '@/services/masters/rmpPriceTypesService';

const RmpPriceTypesBulkEditPage = () => {
  const closeTab = useBulkEditCloser('/masters/rmp-price-types');
  const { data: allRmpPriceTypes = [], isLoading: isLoadingAll } = useAllRmpPriceTypes();

  const createMut = useCreateRmpPriceType();
  const updateMut = useUpdateRmpPriceType();
  const deleteMut = useDeleteRmpPriceType();

  return (
    <BulkEditPageShell
      title="RMP Price Types"
      subtitle={`${allRmpPriceTypes.length} record${allRmpPriceTypes.length === 1 ? '' : 's'}`}
      onClose={closeTab}
    >
      <BulkEditView<
        RmpPriceType,
        ReturnType<typeof rmpPriceTypesToCreatePayload>,
        ReturnType<typeof rmpPriceTypesToUpdatePayload>
      >
        title="RMP Price Types"
        columns={rmpPriceTypesColumns}
        data={allRmpPriceTypes}
        isLoading={isLoadingAll}
        getRowId={rmpPriceTypesGetRowId}
        createEmptyRow={rmpPriceTypesCreateEmptyRow}
        toCreatePayload={rmpPriceTypesToCreatePayload}
        toUpdatePayload={rmpPriceTypesToUpdatePayload}
        queryKey={rmpPriceTypesQueryKey}
        createMutation={createMut.mutateAsync}
        updateMutation={updateMut.mutateAsync}
        deleteMutation={deleteMut.mutateAsync}
        onClose={closeTab}
      />
    </BulkEditPageShell>
  );
};

export default RmpPriceTypesBulkEditPage;
