import type { BaseActivityEntry, ActivitySession } from '@/components/common/session-logger';

// Put Away-specific entry that extends the base activity entry
export interface PutAwayEntry extends BaseActivityEntry {
  warehouse_id: string;
  warehouse_name?: string;
  floor_id: string;
  floor_name?: string;
  lane_id: string;
  lane_name?: string;
  rack_id: string;
  rack_name?: string;
  quantity: number;
  location_notes?: string;
  pending: number;
}

// Put Away session type
export type PutAwaySession = ActivitySession<PutAwayEntry>;

// Data structure for saving Put Away sessions to database
export interface PutAwaySessionSaveData {
  item_type: 'sku' | 'misc';
  item_id: string;
  sku_id?: string;
  size_id?: string;
  misc_name?: string;
  warehouse_id: string;
  floor_id: string;
  lane_id: string;
  rack_id: string;
  quantity: number;
  location_notes?: string;
}

// Props for the Put Away modal
export interface PutAwayModalProps {
  isOpen: boolean;
  onClose: () => void;
  poId: string;
  poNumber: string;
  onRefresh?: () => void;
}
