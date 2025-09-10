import type { BaseActivityEntry, ActivitySession } from '@/components/common/session-logger';

// GRN-specific entry that extends the base activity entry
export interface GRNEntry extends BaseActivityEntry {
  goodQuantity: number;
  badQuantity: number;
  pending: number;
}

// GRN session type
export type GRNSession = ActivitySession<GRNEntry>;

// Data structure for saving GRN sessions to database
export interface GRNSessionSaveData {
  item_type: 'sku' | 'misc';
  item_id: string;
  sku_id?: string;
  size_id?: string;
  misc_name?: string;
  ordered_quantity: number;
  good_quantity: number;
  bad_quantity: number;
}

// Props for the GRN modal
export interface GRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  poId: string;
  poNumber: string;
  vendorName: string;
  onRefresh?: () => void;
}
