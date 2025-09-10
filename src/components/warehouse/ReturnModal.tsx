import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  SessionLoggerModal,
  useSessionManager,
  useQuantityValidation,
  usePendingCalculations
} from '@/components/common/session-logger';
import { ReturnSessionService } from './services/returnSessionService';
import { useWarehouseData } from '@/hooks/warehouse/useWarehouseData';
import { useWarehouseStructure } from '@/hooks/warehouse/useWarehouseStructure';
import type { ReturnEntry, ReturnSession, ReturnSessionSaveData, ReturnModalProps } from './types/returnTypes';

// Create a singleton service instance
const returnSessionService = new ReturnSessionService();

export const ReturnModal: React.FC<ReturnModalProps> = ({
  isOpen,
  onClose,
  referenceId,
  referenceType,
  referenceNumber,
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
  const { validateQuantityEntry } = useQuantityValidation<ReturnEntry>({
    allowNegative: false,
    maxExceedanceAllowed: false
  });

  const { calculateAllPendingQuantities } = usePendingCalculations<ReturnEntry>({
    includeGoodQuantity: false,
    includeBadQuantity: false,
    includeQuantity: true
  });

  // Prepare session data for saving
  const prepareSessionData = (entries: ReturnEntry[]): ReturnSessionSaveData[] => {
    return entries
      .filter(entry => (entry.return_to_vendor_qty > 0 || entry.accept_to_stock_qty > 0) && entry.return_reason && entry.condition)
      .map(entry => ({
        item_type: entry.item_type,
        item_id: entry.item_id,
        sku_id: entry.sku_id,
        size_id: entry.size_id,
        misc_name: entry.misc_name,
        return_reason: entry.return_reason,
        condition: entry.condition,
        
        // Split quantities
        return_to_vendor_qty: entry.return_to_vendor_qty,
        accept_to_stock_qty: entry.accept_to_stock_qty,
        quantity: entry.return_to_vendor_qty + entry.accept_to_stock_qty,
        
        // Location data (for accepted stock)
        warehouse_id: entry.warehouse_id,
        floor_id: entry.floor_id,
        lane_id: entry.lane_id,
        rack_id: entry.rack_id,
        accept_condition: entry.accept_condition,
        
        // Legacy fields
        notes: entry.notes,
        customer_order_id: entry.customer_order_id
      }));
  };

  // Custom validation for return entries
  const validateReturnEntry = (entry: ReturnEntry, sessions: ReturnSession[], sessionId: string): string | null => {
    // Split quantity validation
    const totalQty = entry.return_to_vendor_qty + entry.accept_to_stock_qty;
    
    if (totalQty > entry.pending) {
      return `Total quantity (${totalQty}) cannot exceed available quantity (${entry.pending})`;
    }

    // Additional return specific validations
    if (totalQty > 0) {
      if (!entry.return_reason) return 'Return reason must be selected';
      if (!entry.condition) return 'Item condition must be selected';
      
      // Location validation for accepted stock
      if (entry.accept_to_stock_qty > 0) {
        if (!entry.warehouse_id) return 'Warehouse must be selected for accepted stock';
        if (!entry.floor_id) return 'Floor must be selected for accepted stock';
        if (!entry.lane_id) return 'Lane must be selected for accepted stock';
        if (!entry.rack_id) return 'Rack must be selected for accepted stock';
        if (!entry.accept_condition) return 'Accept condition must be selected';
      }
    }

    return null;
  };

  // Initialize session manager
  const sessionManager = useSessionManager<ReturnEntry, ReturnSessionSaveData>({
    referenceId,
    service: returnSessionService,
    validateEntry: validateReturnEntry,
    prepareSessionData,
    onSessionSaved: () => {
      onRefresh?.();
    },
    onSessionDeleted: () => {
      onRefresh?.();
    }
  });

  // Custom pending calculation for return entries
  const calculateReturnPending = (entry: ReturnEntry, sessions: ReturnSession[], currentSessionId: string) => {
    // For returns, pending = available - (saved return quantities only)
    // We don't include current session quantities in pending calculation
    let totalReturned = 0;
    
    // Add quantities from all saved sessions only
    sessions.forEach(session => {
      if (session.isSaved) {
        const sessionEntry = session.entries.find(e => e.id === entry.id);
        if (sessionEntry) {
          totalReturned += (sessionEntry.return_to_vendor_qty || 0) + (sessionEntry.accept_to_stock_qty || 0);
        }
      }
    });
    
    return Math.max(0, entry.ordered - totalReturned);
  };

  // Effect to recalculate pending quantities when sessions change
  useEffect(() => {
    if (sessionManager.sessions.length > 0) {
      // Update pending quantities for all entries in all sessions
      sessionManager.sessions.forEach(session => {
        session.entries.forEach(entry => {
          const newPending = calculateReturnPending(entry, sessionManager.sessions, session.id);
          
          // Only update if the pending value has changed
          if (entry.pending !== newPending) {
            sessionManager.updateEntry(session.id, entry.id, { pending: newPending } as Partial<ReturnEntry>);
          }
        });
      });
    }
  }, [sessionManager.sessions.map(s => s.entries.map(e => `${e.id}-${e.return_to_vendor_qty}-${e.accept_to_stock_qty}`).join(',')).join('|')]);

  // Handle quantity changes for split quantities
  const handleQuantityChange = (sessionId: string, entryId: string, field: string, value: number) => {
    const errorKey = `${sessionId}-${entryId}-${field}`;
    sessionManager.clearValidationError(errorKey);
    
    // Validate combined quantities against remaining amount BEFORE updating state
    if (field === 'return_to_vendor_qty' || field === 'accept_to_stock_qty') {
      const currentEntry = sessionManager.sessions.find(s => s.id === sessionId)?.entries.find(e => e.id === entryId);
      if (currentEntry) {
        const otherField = field === 'return_to_vendor_qty' ? 'accept_to_stock_qty' : 'return_to_vendor_qty';
        const otherValue = currentEntry[otherField] || 0;
        const totalQuantity = value + otherValue;
        
        // Check if combined quantity exceeds initial available amount
        if (totalQuantity > (currentEntry.ordered || 0)) {
          const errorMessage = `Combined quantities cannot exceed available amount (${currentEntry.ordered})`;
          (sessionManager as any).setValidationError?.(errorKey, errorMessage);
          return; // Don't update the state when there's a validation error
        }
      }
    }
    
    const updates: Partial<ReturnEntry> = { [field]: value };
    
    // If this is a split quantity field, also update total_quantity and legacy quantity
    if (field === 'return_to_vendor_qty' || field === 'accept_to_stock_qty') {
      const currentEntry = sessionManager.sessions.find(s => s.id === sessionId)?.entries.find(e => e.id === entryId);
      if (currentEntry) {
        const otherField = field === 'return_to_vendor_qty' ? 'accept_to_stock_qty' : 'return_to_vendor_qty';
        const otherValue = currentEntry[otherField] || 0;
        const totalQuantity = value + otherValue;
        
        updates.total_quantity = totalQuantity;
        updates.quantity = totalQuantity; // Legacy field
      }
    }
    
    sessionManager.updateEntry(sessionId, entryId, updates);
  };

  // Handle location selection changes
  const handleLocationChange = (sessionId: string, entryId: string, field: string, value: string) => {
    const updates: Partial<ReturnEntry> = { [field]: value };
    
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

  // Location Selector Component
  const LocationSelector = ({ entry, session }: { entry: ReturnEntry; session: ReturnSession }) => {
    const floors = entry.warehouse_id ? getFloorsByWarehouse(entry.warehouse_id) : [];
    const lanes = entry.floor_id ? getLanesByFloor(entry.floor_id) : [];
    const racks = entry.lane_id ? getRacksByLane(entry.lane_id) : [];

    return (
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs font-medium">Warehouse</Label>
          <Select
            value={entry.warehouse_id}
            onValueChange={(value) => handleLocationChange(session.id, entry.id, 'warehouse_id', value)}
            disabled={session.isSaved}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select warehouse" />
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
        
        <div>
          <Label className="text-xs font-medium">Floor</Label>
          <Select
            value={entry.floor_id}
            onValueChange={(value) => handleLocationChange(session.id, entry.id, 'floor_id', value)}
            disabled={session.isSaved || !entry.warehouse_id}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select floor" />
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
            disabled={session.isSaved || !entry.floor_id}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select lane" />
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
            disabled={session.isSaved || !entry.lane_id}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select rack" />
            </SelectTrigger>
            <SelectContent>
              {racks.map((rack) => (
                <SelectItem key={rack.id} value={rack.id}>
                  {rack.rack_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  // Custom return details component
  const ReturnDetails = ({ entry, session }: { entry: ReturnEntry; session: ReturnSession }) => {
    const getReasonColor = (reason: string) => {
      switch (reason) {
        case 'damaged': return 'bg-red-100 text-red-800 border-red-200';
        case 'defective': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'wrong_item': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'excess': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'customer_return': return 'bg-purple-100 text-purple-800 border-purple-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getConditionColor = (condition: string) => {
      switch (condition) {
        case 'good': return 'bg-green-100 text-green-800 border-green-200';
        case 'damaged': return 'bg-red-100 text-red-800 border-red-200';
        case 'defective': return 'bg-orange-100 text-orange-800 border-orange-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    return (
      <Card className="p-3">
        <CardContent className="p-0 space-y-4">
          {/* Return Reason and Condition */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-medium">Return Reason</Label>
              <Select
                value={entry.return_reason}
                onValueChange={(value: any) => 
                  sessionManager.updateEntry(session.id, entry.id, { return_reason: value })
                }
                disabled={session.isSaved}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="defective">Defective</SelectItem>
                  <SelectItem value="wrong_item">Wrong Item</SelectItem>
                  <SelectItem value="excess">Excess Stock</SelectItem>
                  <SelectItem value="customer_return">Customer Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs font-medium">Item Condition</Label>
              <Select
                value={entry.condition}
                onValueChange={(value: any) => 
                  sessionManager.updateEntry(session.id, entry.id, { condition: value })
                }
                disabled={session.isSaved}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="defective">Defective</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Split Quantities */}
          <div>
            <Label className="text-xs font-medium mb-2 block">Quantity Allocation</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Return to Vendor</Label>
                <Input
                  type="number"
                  min="0"
                  max={entry.ordered}
                  value={entry.return_to_vendor_qty}
                  onChange={(e) => 
                    handleQuantityChange(session.id, entry.id, 'return_to_vendor_qty', parseInt(e.target.value) || 0)
                  }
                  disabled={session.isSaved}
                  className={`h-8 text-sm ${sessionManager.validationErrors[`${session.id}-${entry.id}-return_to_vendor_qty`] ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="0"
                />
                {sessionManager.validationErrors[`${session.id}-${entry.id}-return_to_vendor_qty`] && (
                  <p className="text-xs text-red-500 mt-1">
                    {sessionManager.validationErrors[`${session.id}-${entry.id}-return_to_vendor_qty`]}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Accept to Stock</Label>
            <Input
                  type="number"
                  min="0"
                  max={entry.ordered}
                  value={entry.accept_to_stock_qty}
              onChange={(e) => 
                    handleQuantityChange(session.id, entry.id, 'accept_to_stock_qty', parseInt(e.target.value) || 0)
              }
              disabled={session.isSaved}
                  className={`h-8 text-sm ${sessionManager.validationErrors[`${session.id}-${entry.id}-accept_to_stock_qty`] ? 'border-red-500 focus:border-red-500' : ''}`}
                  placeholder="0"
                />
                {sessionManager.validationErrors[`${session.id}-${entry.id}-accept_to_stock_qty`] && (
                  <p className="text-xs text-red-500 mt-1">
                    {sessionManager.validationErrors[`${session.id}-${entry.id}-accept_to_stock_qty`]}
                  </p>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total: {entry.return_to_vendor_qty + entry.accept_to_stock_qty} / {entry.ordered} available | Remaining: {entry.ordered - (entry.return_to_vendor_qty + entry.accept_to_stock_qty)}
            </div>
          </div>

          {/* Location Selector (only if accept_to_stock_qty > 0) */}
          {entry.accept_to_stock_qty > 0 && (
            <div>
              <Label className="text-xs font-medium mb-2 block">Stock Location</Label>
              <LocationSelector entry={entry} session={session} />
            </div>
          )}

          {/* Accept Condition (only if accept_to_stock_qty > 0) */}
          {entry.accept_to_stock_qty > 0 && (
            <div>
              <Label className="text-xs font-medium">Accept Condition</Label>
              <Select
                value={entry.accept_condition || ''}
                onValueChange={(value: any) => 
                  sessionManager.updateEntry(session.id, entry.id, { accept_condition: value })
                }
                disabled={session.isSaved}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select accept condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="defective">Defective</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          
          {/* Notes */}
          <div>
            <Label className="text-xs font-medium">Notes</Label>
            <Textarea
              placeholder="Return notes, damage description, etc..."
              value={entry.notes || ''}
              onChange={(e) => 
                sessionManager.updateEntry(session.id, entry.id, { notes: e.target.value })
              }
              disabled={session.isSaved}
              rows={2}
              className="text-sm resize-none"
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
      width: '80px',
      align: 'center' as const
    },
    {
      key: 'return_details',
      header: 'Return Configuration',
      width: '500px',
      align: 'left' as const,
      render: (entry: ReturnEntry, session: ReturnSession) => 
        <ReturnDetails entry={entry} session={session} />
    },
    {
      key: 'split_quantities',
      header: 'Vendor/Stock',
      width: '100px',
      align: 'center' as const,
      render: (entry: ReturnEntry) => (
        <div className="text-xs">
          <div className="text-red-600">V: {entry.return_to_vendor_qty}</div>
          <div className="text-green-600">S: {entry.accept_to_stock_qty}</div>
        </div>
      )
    },
    {
      key: 'remaining',
      header: 'Remaining',
      width: '80px',
      align: 'center' as const,
      render: (entry: ReturnEntry) => (
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
          {entry.ordered - (entry.return_to_vendor_qty + entry.accept_to_stock_qty)}
        </div>
      )
    }
  ];

  // Define quantity inputs (empty since we handle quantities in ReturnDetails)
  const quantityInputs: any[] = [];

  const getSubtitle = () => {
    switch (referenceType) {
      case 'order': return `Processing returns for customer order`;
      case 'grn': return `Processing returns from goods receipt`;
      case 'inventory': return `Processing inventory returns`;
      default: return `Processing returns for ${referenceType}`;
    }
  };

  return (
    <SessionLoggerModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Returns - ${referenceNumber}`}
      subtitle={getSubtitle()}
      sessionManager={sessionManager}
      tableColumns={tableColumns}
      quantityInputs={quantityInputs}
      onQuantityChange={handleQuantityChange}
      showSaveButton={true}
      saveButtonText="Process Returns"
      emptyMessage="No items available for return"
      maxWidth="max-w-7xl"
      maxHeight="h-[70vh]"
    />
  );
};
