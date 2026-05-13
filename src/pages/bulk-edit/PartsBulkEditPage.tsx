import React from 'react';
import {
  BulkEditView,
  BulkEditPageShell,
  useBulkEditCloser,
} from '@/components/masters/bulk-edit';
import {
  scottPartsColumns,
  scottPartsGetRowId,
  scottPartsCreateEmptyRow,
  scottPartsToCreatePayload,
  scottPartsToUpdatePayload,
  scottPartsQueryKey,
} from '@/components/masters/bulk-edit/configs/scottPartsConfig';
import {
  useAllParts,
  useCreatePart,
  useUpdatePart,
  useDeletePart,
} from '@/hooks/masters/useParts';
import type { Part } from '@/hooks/masters/useParts';

const PartsBulkEditPage = () => {
  const closeTab = useBulkEditCloser('/masters/parts');
  const { data: allParts = [], isLoading: isLoadingAll } = useAllParts();

  const createMut = useCreatePart();
  const updateMut = useUpdatePart();
  const deleteMut = useDeletePart();

  return (
    <BulkEditPageShell
      title="Parts"
      subtitle={`${allParts.length} record${allParts.length === 1 ? '' : 's'}`}
      onClose={closeTab}
    >
      <BulkEditView<
        Part,
        ReturnType<typeof scottPartsToCreatePayload>,
        ReturnType<typeof scottPartsToUpdatePayload>
      >
        title="Parts"
        columns={scottPartsColumns}
        data={allParts}
        isLoading={isLoadingAll}
        getRowId={scottPartsGetRowId}
        createEmptyRow={scottPartsCreateEmptyRow}
        toCreatePayload={scottPartsToCreatePayload}
        toUpdatePayload={scottPartsToUpdatePayload}
        queryKey={scottPartsQueryKey}
        createMutation={createMut.mutateAsync}
        updateMutation={({ id, updates }) => updateMut.mutateAsync({ id, updates })}
        deleteMutation={deleteMut.mutateAsync}
        onClose={closeTab}
      />
    </BulkEditPageShell>
  );
};

export default PartsBulkEditPage;
