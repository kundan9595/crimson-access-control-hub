export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  SENT_FOR_APPROVAL = 'sent_for_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SENT_TO_VENDOR = 'sent_to_vendor',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  CANCELLED = 'cancelled'
}

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.DRAFT]: 'Draft',
  [PurchaseOrderStatus.SENT_FOR_APPROVAL]: 'Sent for Approval',
  [PurchaseOrderStatus.APPROVED]: 'Approved',
  [PurchaseOrderStatus.REJECTED]: 'Rejected',
  [PurchaseOrderStatus.SENT_TO_VENDOR]: 'Sent to Vendor',
  [PurchaseOrderStatus.PARTIALLY_RECEIVED]: 'Partially Received',
  [PurchaseOrderStatus.RECEIVED]: 'Received',
  [PurchaseOrderStatus.CANCELLED]: 'Cancelled'
};

export const PURCHASE_ORDER_STATUS_VARIANTS: Record<PurchaseOrderStatus, 'secondary' | 'default' | 'destructive'> = {
  [PurchaseOrderStatus.DRAFT]: 'secondary',
  [PurchaseOrderStatus.SENT_FOR_APPROVAL]: 'default',
  [PurchaseOrderStatus.APPROVED]: 'default',
  [PurchaseOrderStatus.REJECTED]: 'destructive',
  [PurchaseOrderStatus.SENT_TO_VENDOR]: 'default',
  [PurchaseOrderStatus.PARTIALLY_RECEIVED]: 'default',
  [PurchaseOrderStatus.RECEIVED]: 'default',
  [PurchaseOrderStatus.CANCELLED]: 'destructive'
};
