import { useQuery } from '@tanstack/react-query';
import { purchaseOrderService } from '@/services/purchaseOrderService';
import type { PurchaseOrder } from '@/services/purchaseOrderService';

export const usePurchaseOrdersByVendor = (vendorId: string | null) => {
  return useQuery({
    queryKey: ['purchaseOrders', 'vendor', vendorId],
    queryFn: () => purchaseOrderService.getPurchaseOrders(undefined, vendorId!),
    enabled: !!vendorId,
  });
};

