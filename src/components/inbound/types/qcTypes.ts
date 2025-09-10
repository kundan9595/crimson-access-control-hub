import type { BaseActivityEntry, ActivitySession } from '@/components/common/session-logger';

// QC-specific entry that extends the base activity entry
export interface QCEntry extends BaseActivityEntry {
  received_qty: number;
  samples_checked: number;
  samples_ok: number;
  samples_not_ok: number;
  qc_percentage: number;
  pending: number;
}

// QC session type
export type QCSession = ActivitySession<QCEntry>;

// Data structure for saving QC sessions to database
export interface QCSessionSaveData {
  item_type: 'sku' | 'misc';
  item_id: string;
  sku_id?: string;
  size_id?: string;
  misc_name?: string;
  received_qty: number;
  samples_checked: number;
  samples_ok: number;
  samples_not_ok: number;
  qc_percentage: number;
}

// Props for the QC modal
export interface QCModalProps {
  isOpen: boolean;
  onClose: () => void;
  poId: string;
  poNumber: string;
  vendorName: string;
  onRefresh?: () => void;
}
