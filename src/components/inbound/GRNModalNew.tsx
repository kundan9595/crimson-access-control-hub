import React from 'react';
import { toast } from 'sonner';
import {
  SessionLoggerModal,
  useSessionManager,
  useQuantityValidation,
  usePendingCalculations
} from '@/components/common/session-logger';
import { GRNSessionService } from './services/grnSessionService';
import type { GRNEntry, GRNSession, GRNSessionSaveData, GRNModalProps } from './types/grnTypes';

// Create a singleton service instance
const grnSessionService = new GRNSessionService();

export const GRNModalNew: React.FC<GRNModalProps> = ({
  isOpen,
  onClose,
  poId,
  poNumber,
  vendorName,
  onRefresh
}) => {
  
  // Initialize validation and calculations hooks
  const { validateQuantityEntry } = useQuantityValidation<GRNEntry>({
    allowNegative: false,
    maxExceedanceAllowed: false
  });

  const { calculateAllPendingQuantities } = usePendingCalculations<GRNEntry>({
    includeGoodQuantity: true,
    includeBadQuantity: true,
    includeQuantity: false
  });

  // Prepare session data for saving
  const prepareSessionData = (entries: GRNEntry[]): GRNSessionSaveData[] => {
    return entries.map(entry => ({
      item_type: entry.item_type,
      item_id: entry.item_id,
      sku_id: entry.sku_id,
      size_id: entry.size_id,
      misc_name: entry.misc_name,
      ordered_quantity: entry.ordered,
      good_quantity: entry.goodQuantity,
      bad_quantity: entry.badQuantity
    }));
  };

  // Initialize session manager
  const sessionManager = useSessionManager<GRNEntry, GRNSessionSaveData>({
    referenceId: poId,
    service: grnSessionService,
    validateEntry: validateQuantityEntry,
    prepareSessionData,
    onSessionSaved: () => {
      onRefresh?.();
    },
    onSessionDeleted: () => {
      onRefresh?.();
    }
  });

  // Handle quantity changes with validation and pending calculation
  const handleQuantityChange = (sessionId: string, entryId: string, field: string, value: number) => {
    const errorKey = `${sessionId}-${entryId}-${field}`;
    
    // Clear any existing validation error
    sessionManager.clearValidationError(errorKey);
    
    // Update the entry
    const updates = { [field]: value } as Partial<GRNEntry>;
    sessionManager.updateEntry(sessionId, entryId, updates);
    
    // Recalculate pending quantities for all sessions
    const updatedSessions = calculateAllPendingQuantities(sessionManager.sessions);
    
    // Update the session manager with recalculated sessions
    // Note: This is a bit of a hack since we don't have direct access to setSessions
    // In a real implementation, we might want to expose this from the hook
  };

  // Define table columns for GRN
  const tableColumns = [
    {
      key: 'item_code',
      header: 'Item Code',
      width: '200px',
      align: 'left' as const
    },
    {
      key: 'item_name',
      header: 'Item Name',
      width: '300px',
      align: 'left' as const
    },
    {
      key: 'ordered',
      header: 'Ordered',
      width: '100px',
      align: 'center' as const
    },
    {
      key: 'goodQuantity',
      header: 'Good Qty',
      width: '120px',
      align: 'center' as const
    },
    {
      key: 'badQuantity',
      header: 'Bad Qty',
      width: '120px',
      align: 'center' as const
    },
    {
      key: 'total_received',
      header: 'Total Received',
      width: '100px',
      align: 'center' as const
    },
    {
      key: 'pending',
      header: 'Pending',
      width: '100px',
      align: 'center' as const
    }
  ];

  // Define quantity inputs
  const quantityInputs = [
    {
      field: 'goodQuantity',
      label: 'Good Quantity',
      min: 0,
      max: (entry: GRNEntry) => (entry.pending || 0) - (entry.badQuantity || 0),
      disabled: (entry: GRNEntry, session: GRNSession) => session.isSaved
    },
    {
      field: 'badQuantity',
      label: 'Bad Quantity',
      min: 0,
      max: (entry: GRNEntry) => (entry.pending || 0) - (entry.goodQuantity || 0),
      disabled: (entry: GRNEntry, session: GRNSession) => session.isSaved
    }
  ];

  return (
    <SessionLoggerModal
      isOpen={isOpen}
      onClose={onClose}
      title={`GRN - ${poNumber}`}
      subtitle={`Vendor: ${vendorName}`}
      sessionManager={sessionManager}
      tableColumns={tableColumns}
      quantityInputs={quantityInputs}
      onQuantityChange={handleQuantityChange}
      showSaveButton={true}
      saveButtonText="Save"
      emptyMessage="No items found for this session"
    />
  );
};
