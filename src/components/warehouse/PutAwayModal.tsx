import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  SessionLoggerModal,
  useSessionManager,
  useQuantityValidation,
  usePendingCalculations
} from '@/components/common/session-logger';
import { useWarehouseData } from '@/hooks/warehouse/useWarehouseData';
import { useWarehouseStructure } from '@/hooks/warehouse/useWarehouseStructure';
import { PutAwaySessionService } from './services/putAwaySessionService';
import type { PutAwayEntry, PutAwaySession, PutAwaySessionSaveData, PutAwayModalProps } from './types/putAwayTypes';

// Create a singleton service instance
const putAwaySessionService = new PutAwaySessionService();

export const PutAwayModal: React.FC<PutAwayModalProps> = ({
  isOpen,
  onClose,
  poId,
  poNumber,
  onRefresh
}) => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  
  // Get warehouses list
  const { warehouses } = useWarehouseData();
  
  // Get warehouse structure for selected warehouse
  const {
    structure,
    loading: structureLoading,
    getFloorsByWarehouse,
    getLanesByFloor,
    getRacksByLane
  } = useWarehouseStructure(selectedWarehouseId);

  // Initialize validation and calculations hooks
  const { validateQuantityEntry } = useQuantityValidation<PutAwayEntry>({
    allowNegative: false,
    maxExceedanceAllowed: false
  });

  const { calculateAllPendingQuantities } = usePendingCalculations<PutAwayEntry>({
    includeGoodQuantity: false,
    includeBadQuantity: false,
    includeQuantity: true
  });

  // Prepare session data for saving
  const prepareSessionData = (entries: PutAwayEntry[]): PutAwaySessionSaveData[] => {
    return entries
      .filter(entry => entry.quantity > 0 && entry.warehouse_id && entry.floor_id && entry.lane_id && entry.rack_id)
      .map(entry => ({
        item_type: entry.item_type,
        item_id: entry.item_id,
        sku_id: entry.sku_id,
        size_id: entry.size_id,
        misc_name: entry.misc_name,
        warehouse_id: entry.warehouse_id,
        floor_id: entry.floor_id,
        lane_id: entry.lane_id,
        rack_id: entry.rack_id,
        quantity: entry.quantity,
        location_notes: entry.location_notes
      }));
  };

  // Custom validation for put away entries
  const validatePutAwayEntry = (entry: PutAwayEntry, sessions: PutAwaySession[], sessionId: string): string | null => {
    // Basic negative quantity check
    if (entry.quantity < 0) {
      return 'Quantity cannot be negative';
    }

    // Calculate the maximum allowed quantity for this entry
    // This should be the original available quantity minus quantities already put away in saved sessions
    let totalPutAwayInSavedSessions = 0;
    
    sessions.forEach(session => {
      if (session.isSaved && session.id !== sessionId) {
        const sessionEntry = session.entries.find(e => e.id === entry.id);
        if (sessionEntry) {
          totalPutAwayInSavedSessions += sessionEntry.quantity || 0;
        }
      }
    });
    
    const maxAllowedQuantity = (entry.ordered || 0) - totalPutAwayInSavedSessions;
    
    // Check if quantity exceeds maximum allowed
    if (entry.quantity > maxAllowedQuantity) {
      return `Quantity cannot exceed available amount (${maxAllowedQuantity})`;
    }

    // Additional put away specific validations
    if (entry.quantity > 0) {
      if (!entry.warehouse_id) return 'Warehouse must be selected';
      if (!entry.floor_id) return 'Floor must be selected';
      if (!entry.lane_id) return 'Lane must be selected';
      if (!entry.rack_id) return 'Rack must be selected';
    }

    return null;
  };

  // Initialize session manager
  const sessionManager = useSessionManager<PutAwayEntry, PutAwaySessionSaveData>({
    referenceId: poId,
    service: putAwaySessionService,
    validateEntry: validatePutAwayEntry,
    prepareSessionData,
    onSessionSaved: () => {
      onRefresh?.();
    },
    onSessionDeleted: () => {
      onRefresh?.();
    }
  });

  // Custom pending calculation for put away entries
  const calculatePutAwayPending = (entry: PutAwayEntry, sessions: PutAwaySession[], currentSessionId: string) => {
    // For put away, pending = ordered - (saved quantities + current session quantities)
    let totalPutAway = 0;
    
    // Add quantities from all saved sessions
    sessions.forEach(session => {
      if (session.isSaved) {
        const sessionEntry = session.entries.find(e => e.id === entry.id);
        if (sessionEntry) {
          totalPutAway += sessionEntry.quantity || 0;
        }
      }
    });
    
    // Add quantities from current session (if it's not saved)
    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (currentSession && !currentSession.isSaved) {
      const currentEntry = currentSession.entries.find(e => e.id === entry.id);
      if (currentEntry) {
        totalPutAway += currentEntry.quantity || 0;
      }
    }
    
    return Math.max(0, entry.ordered - totalPutAway);
  };

  // Effect to recalculate pending quantities when sessions change
  useEffect(() => {
    if (sessionManager.sessions.length > 0) {
      // Update pending quantities for all entries in all sessions
      sessionManager.sessions.forEach(session => {
        session.entries.forEach(entry => {
          const newPending = calculatePutAwayPending(entry, sessionManager.sessions, session.id);
          
          // Only update if the pending value has changed
          if (entry.pending !== newPending) {
            sessionManager.updateEntry(session.id, entry.id, { pending: newPending } as Partial<PutAwayEntry>);
          }
        });
      });
    }
  }, [sessionManager.sessions.map(s => s.entries.map(e => `${e.id}-${e.quantity}`).join(',')).join('|')]);

  // Handle quantity changes with validation and pending calculation
  const handleQuantityChange = (sessionId: string, entryId: string, field: string, value: number) => {
    const errorKey = `${sessionId}-${entryId}-${field}`;
    sessionManager.clearValidationError(errorKey);
    
    // Validate quantity against available amount BEFORE updating state
    if (field === 'quantity') {
      const session = sessionManager.sessions.find(s => s.id === sessionId);
      const entry = session?.entries.find(e => e.id === entryId);
      
      if (entry) {
        // Calculate maximum allowed quantity (same logic as save-time validation)
        let totalPutAwayInSavedSessions = 0;
        
        sessionManager.sessions.forEach(s => {
          if (s.isSaved && s.id !== sessionId) {
            const sessionEntry = s.entries.find(e => e.id === entryId);
            if (sessionEntry) {
              totalPutAwayInSavedSessions += sessionEntry.quantity || 0;
            }
          }
        });
        
        const maxAllowedQuantity = (entry.ordered || 0) - totalPutAwayInSavedSessions;
        
        if (value > maxAllowedQuantity) {
          // Set validation error and DON'T update the state
          const errorMessage = `Quantity cannot exceed available amount (${maxAllowedQuantity})`;
          (sessionManager as any).setValidationError?.(errorKey, errorMessage);
          return; // Don't update the state when there's a validation error
        }
      }
    }
    
    // Only update the entry if validation passes
    sessionManager.updateEntry(sessionId, entryId, { [field]: value } as Partial<PutAwayEntry>);
  };

  // Handle location selection changes
  const handleLocationChange = (sessionId: string, entryId: string, field: string, value: string) => {
    const updates: Partial<PutAwayEntry> = { [field]: value };
    
    // Clear dependent fields when parent location changes
    if (field === 'warehouse_id') {
      updates.floor_id = '';
      updates.lane_id = '';
      updates.rack_id = '';
      setSelectedWarehouseId(value);
    } else if (field === 'floor_id') {
      updates.lane_id = '';
      updates.rack_id = '';
    } else if (field === 'lane_id') {
      updates.rack_id = '';
    }
    
    sessionManager.updateEntry(sessionId, entryId, updates);
  };

  // Custom location selector component
  const LocationSelector = ({ entry, session }: { entry: PutAwayEntry; session: PutAwaySession }) => {
    const floors = entry.warehouse_id ? getFloorsByWarehouse(entry.warehouse_id) : [];
    const lanes = entry.floor_id ? getLanesByFloor(entry.floor_id) : [];
    const racks = entry.lane_id ? getRacksByLane(entry.lane_id) : [];

    // Get display names for selected values
    const warehouseName = warehouses.find(w => w.id === entry.warehouse_id)?.name || '';
    const floorName = floors.find(f => f.id === entry.floor_id)?.name || '';
    const laneName = lanes.find(l => l.id === entry.lane_id)?.name || '';
    const rackName = racks.find(r => r.id === entry.rack_id)?.rack_name || '';
    const rackSide = racks.find(r => r.id === entry.rack_id)?.side || '';

    // If session is saved, show read-only display
    if (session.isSaved) {
      return (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            {warehouseName && floorName && laneName && rackName ? (
              <div className="space-y-0.5">
                <div className="font-medium text-foreground">
                  {warehouseName} → {floorName} → {laneName} → {rackName} ({rackSide})
                </div>
                {entry.location_notes && (
                  <div className="text-xs text-muted-foreground italic">
                    Note: {entry.location_notes}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">No location assigned</span>
            )}
          </div>
        </div>
      );
    }

    // For editing, show the full UI
    return (
      <Card className="p-1.5">
        <CardContent className="p-0 space-y-1.5">
          {/* Warehouse Selection */}
          <div>
            <Label className="text-xs font-medium">Warehouse</Label>
            <Select
              value={entry.warehouse_id}
              onValueChange={(value) => handleLocationChange(session.id, entry.id, 'warehouse_id', value)}
              disabled={session.isSaved}
            >
              <SelectTrigger className="h-6">
                <SelectValue placeholder="Select Warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Floor, Lane, Rack Selection */}
          <div className="grid grid-cols-3 gap-1">
            <div>
              <Label className="text-xs font-medium">Floor</Label>
              <Select
                value={entry.floor_id}
                onValueChange={(value) => handleLocationChange(session.id, entry.id, 'floor_id', value)}
                disabled={session.isSaved || !entry.warehouse_id || structureLoading}
              >
                <SelectTrigger className="h-6">
                  <SelectValue placeholder="Floor" />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((floor) => (
                    <SelectItem key={floor.id} value={floor.id}>
                      {floor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs font-medium">Lane</Label>
              <Select
                value={entry.lane_id}
                onValueChange={(value) => handleLocationChange(session.id, entry.id, 'lane_id', value)}
                disabled={session.isSaved || !entry.floor_id || structureLoading}
              >
                <SelectTrigger className="h-6">
                  <SelectValue placeholder="Lane" />
                </SelectTrigger>
                <SelectContent>
                  {lanes.map((lane) => (
                    <SelectItem key={lane.id} value={lane.id}>
                      {lane.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs font-medium">Rack</Label>
              <Select
                value={entry.rack_id}
                onValueChange={(value) => handleLocationChange(session.id, entry.id, 'rack_id', value)}
                disabled={session.isSaved || !entry.lane_id || structureLoading}
              >
                <SelectTrigger className="h-6">
                  <SelectValue placeholder="Rack" />
                </SelectTrigger>
                <SelectContent>
                  {racks.map((rack) => (
                    <SelectItem key={rack.id} value={rack.id}>
                      {rack.rack_name} ({rack.side})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Location Notes */}
          <div>
            <Label className="text-xs font-medium">Notes (Optional)</Label>
            <Input
              placeholder="Location notes..."
              value={entry.location_notes || ''}
              onChange={(e) => sessionManager.updateEntry(session.id, entry.id, { location_notes: e.target.value })}
              disabled={session.isSaved}
              className="h-6 text-sm"
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  // Define table columns
  const tableColumns = [
    {
      key: 'item_code',
      header: 'Item Code',
      width: '100px',
      align: 'left' as const
    },
    {
      key: 'item_name',
      header: 'Item Name',
      width: '120px',
      align: 'left' as const
    },
    {
      key: 'ordered',
      header: 'Available',
      width: '70px',
      align: 'center' as const
    },
    {
      key: 'location',
      header: 'Location Assignment',
      width: '320px',
      align: 'left' as const,
      render: (entry: PutAwayEntry, session: PutAwaySession) => 
        <LocationSelector entry={entry} session={session} />
    },
    {
      key: 'quantity',
      header: 'Put Away Qty',
      width: '90px',
      align: 'center' as const
    },
    {
      key: 'pending',
      header: 'Remaining',
      width: '70px',
      align: 'center' as const
    }
  ];

  // Define quantity inputs
  const quantityInputs = [
    {
      field: 'quantity',
      label: 'Put Away Quantity',
      min: 0,
      max: (entry: PutAwayEntry) => entry.pending || 0,
      disabled: (entry: PutAwayEntry, session: PutAwaySession) => {
        // Disable if session is saved
        if (session.isSaved) return true;
        
        // Disable if location is not fully selected
        const isLocationComplete = entry.warehouse_id && 
                                 entry.floor_id && 
                                 entry.lane_id && 
                                 entry.rack_id;
        
        return !isLocationComplete;
      },
      placeholder: (entry: PutAwayEntry, session: PutAwaySession) => {
        // Show helpful placeholder when disabled due to missing location
        if (session.isSaved) return "0";
        
        const isLocationComplete = entry.warehouse_id && 
                                 entry.floor_id && 
                                 entry.lane_id && 
                                 entry.rack_id;
        
        if (!isLocationComplete) {
          return "Select location first";
        }
        
        return "0";
      }
    }
  ];

  return (
    <SessionLoggerModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Put Away - ${poNumber}`}
      subtitle="Assign warehouse locations for received items"
      sessionManager={sessionManager}
      tableColumns={tableColumns}
      quantityInputs={quantityInputs}
      onQuantityChange={handleQuantityChange}
      showSaveButton={true}
      saveButtonText="Put Away Items"
      emptyMessage="No items available for put away"
      maxWidth="max-w-6xl"
      maxHeight="h-[70vh]"
    />
  );
};
