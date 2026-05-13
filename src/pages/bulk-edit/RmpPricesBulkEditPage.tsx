import React, { useMemo } from 'react';
import {
  BulkEditView,
  BulkEditPageShell,
  useBulkEditCloser,
} from '@/components/masters/bulk-edit';
import {
  buildRmpPricesColumns,
  rmpPricesGetRowId,
  rmpPricesCreateEmptyRow,
  rmpPricesToCreatePayload,
  rmpPricesToUpdatePayload,
  rmpPricesQueryKey,
} from '@/components/masters/bulk-edit/configs/rmpPricesConfig';
import {
  useAllRmpPrices,
  useCreateRmpPrice,
  useUpdateRmpPrice,
  useDeleteRmpPrice,
} from '@/hooks/masters/useRmpPrices';
import { useAllRmpSkus } from '@/hooks/masters/useRmpSkus';
import { useAllRmpPriceTypes } from '@/hooks/masters/useRmpPriceTypes';
import type { RmpPrice } from '@/services/masters/rmpPricesService';

const RmpPricesBulkEditPage = () => {
  const closeTab = useBulkEditCloser('/masters/rmp-prices');
  const { data: allRmpPrices = [], isLoading: isLoadingAll } = useAllRmpPrices();
  const { data: rmpSkus = [] } = useAllRmpSkus();
  const { data: rmpPriceTypes = [] } = useAllRmpPriceTypes();

  const createMut = useCreateRmpPrice();
  const updateMut = useUpdateRmpPrice();
  const deleteMut = useDeleteRmpPrice();

  const rmpSkuOptions = useMemo(
    () => rmpSkus.map((s) => ({ value: s.id, label: s.name })),
    [rmpSkus],
  );

  const rmpSkuEditorOptions = useMemo(
    () =>
      rmpSkus
        .filter((s) => s.status === 'active')
        .map((s) => ({ value: s.id, label: s.name })),
    [rmpSkus],
  );

  const rmpPriceTypeOptions = useMemo(
    () => rmpPriceTypes.map((p) => ({ value: p.id, label: p.name })),
    [rmpPriceTypes],
  );

  const rmpPriceTypeEditorOptions = useMemo(
    () =>
      rmpPriceTypes
        .filter((p) => p.status === 'active')
        .map((p) => ({ value: p.id, label: p.name })),
    [rmpPriceTypes],
  );

  const columns = useMemo(
    () =>
      buildRmpPricesColumns({
        rmpSkuOptions,
        rmpSkuEditorOptions,
        rmpPriceTypeOptions,
        rmpPriceTypeEditorOptions,
      }),
    [rmpSkuOptions, rmpSkuEditorOptions, rmpPriceTypeOptions, rmpPriceTypeEditorOptions],
  );

  return (
    <BulkEditPageShell
      title="RMP Prices"
      subtitle={`${allRmpPrices.length} record${allRmpPrices.length === 1 ? '' : 's'}`}
      onClose={closeTab}
    >
      <BulkEditView<
        RmpPrice,
        ReturnType<typeof rmpPricesToCreatePayload>,
        ReturnType<typeof rmpPricesToUpdatePayload>
      >
        title="RMP Prices"
        columns={columns}
        data={allRmpPrices}
        isLoading={isLoadingAll}
        getRowId={rmpPricesGetRowId}
        createEmptyRow={rmpPricesCreateEmptyRow}
        toCreatePayload={rmpPricesToCreatePayload}
        toUpdatePayload={rmpPricesToUpdatePayload}
        queryKey={rmpPricesQueryKey}
        createMutation={createMut.mutateAsync}
        updateMutation={updateMut.mutateAsync}
        deleteMutation={deleteMut.mutateAsync}
        onClose={closeTab}
      />
    </BulkEditPageShell>
  );
};

export default RmpPricesBulkEditPage;
