import React from 'react';
import {
  BulkEditView,
  BulkEditPageShell,
  useBulkEditCloser,
} from '@/components/masters/bulk-edit';
import {
  rmpColorsColumns,
  rmpColorsGetRowId,
  rmpColorsCreateEmptyRow,
  rmpColorsToCreatePayload,
  rmpColorsToUpdatePayload,
  rmpColorsQueryKey,
} from '@/components/masters/bulk-edit/configs/rmpColorsConfig';
import {
  useAllRmpColors,
  useCreateRmpColor,
  useUpdateRmpColor,
  useDeleteRmpColor,
} from '@/hooks/masters/useRmpColors';
import type { RmpColor } from '@/services/masters/rmpColorsService';

const RmpColorsBulkEditPage = () => {
  const closeTab = useBulkEditCloser('/masters/rmp-colors');
  const { data: allRmpColors = [], isLoading: isLoadingAll } = useAllRmpColors();

  const createMut = useCreateRmpColor();
  const updateMut = useUpdateRmpColor();
  const deleteMut = useDeleteRmpColor();

  return (
    <BulkEditPageShell
      title="RMP Colors"
      subtitle={`${allRmpColors.length} record${allRmpColors.length === 1 ? '' : 's'}`}
      onClose={closeTab}
    >
      <BulkEditView<
        RmpColor,
        ReturnType<typeof rmpColorsToCreatePayload>,
        ReturnType<typeof rmpColorsToUpdatePayload>
      >
        title="RMP Colors"
        columns={rmpColorsColumns}
        data={allRmpColors}
        isLoading={isLoadingAll}
        getRowId={rmpColorsGetRowId}
        createEmptyRow={rmpColorsCreateEmptyRow}
        toCreatePayload={rmpColorsToCreatePayload}
        toUpdatePayload={rmpColorsToUpdatePayload}
        queryKey={rmpColorsQueryKey}
        createMutation={createMut.mutateAsync}
        updateMutation={updateMut.mutateAsync}
        deleteMutation={deleteMut.mutateAsync}
        onClose={closeTab}
      />
    </BulkEditPageShell>
  );
};

export default RmpColorsBulkEditPage;
