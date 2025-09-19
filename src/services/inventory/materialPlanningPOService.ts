import { supabase } from '@/integrations/supabase/client';
import {
  ReorderRequest,
  CreatePORequest,
  MaterialPlanningItem
} from './materialPlanningTypes';

interface ReorderHistoryEntry {
  id?: string;
  sku_id: string;
  trigger_type: 'auto_schedule' | 'inventory_change' | 'manual';
  trigger_timestamp?: string;
  inventory_level: number;
  min_threshold: number;
  optimal_threshold: number;
  reorder_quantity: number;
  vendor_id?: string;
  purchase_order_id?: string;
  status: 'pending' | 'po_created' | 'po_approved' | 'completed' | 'failed';
  notes?: string;
}

export class MaterialPlanningPOService {
  /**
   * Check if there's already a pending reorder for this SKU
   */
  async hasPendingReorder(skuId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('reorder_history')
        .select('id')
        .eq('sku_id', skuId)
        .in('status', ['pending', 'po_created'])
        .limit(1);

      if (error) {
        console.error('Error checking pending reorder:', error);
        return false; // If error, allow reorder to prevent blocking
      }

      return (data && data.length > 0);
    } catch (error) {
      console.error('Error in hasPendingReorder:', error);
      return false;
    }
  }

  /**
   * Create reorder history entry
   */
  async createReorderHistory(entry: ReorderHistoryEntry): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('reorder_history')
        .insert(entry)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating reorder history:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in createReorderHistory:', error);
      return null;
    }
  }

  /**
   * Update reorder history status
   */
  async updateReorderHistory(id: string, updates: Partial<ReorderHistoryEntry>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reorder_history')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating reorder history:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateReorderHistory:', error);
      return false;
    }
  }

  /**
   * Calculate reorder quantity based on current inventory and thresholds
   */
  private calculateReorderQuantity(
    currentInventory: number,
    minThreshold: number,
    optimalThreshold: number
  ): number {
    if (currentInventory >= minThreshold) {
      return 0; // No reorder needed
    }

    // Calculate quantity needed to reach optimal threshold
    const quantityNeeded = optimalThreshold - currentInventory;
    
    // Ensure we don't order negative quantities
    return Math.max(0, quantityNeeded);
  }

  /**
   * Get SKU cost price for PO calculation
   */
  private async getSKUCostPrice(skuId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('skus')
        .select('cost_price')
        .eq('id', skuId)
        .single();

      if (error) {
        console.error('Error fetching SKU cost price:', error);
        return 0;
      }

      return data?.cost_price || 0;
    } catch (error) {
      console.error('Error in getSKUCostPrice:', error);
      return 0;
    }
  }

  /**
   * Generate PO number
   */
  private async generatePONumber(): Promise<string> {
    try {
      // Get the latest PO number
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('po_number')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching latest PO number:', error);
        return `PO-${Date.now()}`;
      }

      if (!data || data.length === 0) {
        return 'PO-0001';
      }

      // Extract number from latest PO and increment
      const latestPO = data[0].po_number;
      const match = latestPO.match(/PO-(\d+)/);
      
      if (match) {
        const nextNumber = String(parseInt(match[1]) + 1).padStart(4, '0');
        return `PO-${nextNumber}`;
      }

      return `PO-${Date.now()}`;
    } catch (error) {
      console.error('Error generating PO number:', error);
      return `PO-${Date.now()}`;
    }
  }

  /**
   * Create a Purchase Order for reorder request with duplicate prevention
   */
  async createReorderPO(
    request: ReorderRequest, 
    triggerType: 'auto_schedule' | 'inventory_change' | 'manual' = 'manual'
  ): Promise<{ success: boolean; po_id?: string; error?: string; reorder_history_id?: string }> {
    try {
      // Check for existing pending reorder
      const hasPending = await this.hasPendingReorder(request.sku_id);
      if (hasPending) {
        return {
          success: false,
          error: 'A reorder for this SKU is already pending. Please check existing Purchase Orders.'
        };
      }

      // Calculate reorder quantity
      const reorderQuantity = request.reorder_quantity || 
        this.calculateReorderQuantity(
          request.current_inventory,
          request.min_threshold,
          request.optimal_threshold
        );

      if (reorderQuantity <= 0) {
        return {
          success: false,
          error: 'No reorder quantity needed'
        };
      }

      // Create reorder history entry first
      const reorderHistoryEntry: ReorderHistoryEntry = {
        sku_id: request.sku_id,
        trigger_type: triggerType,
        inventory_level: request.current_inventory,
        min_threshold: request.min_threshold,
        optimal_threshold: request.optimal_threshold,
        reorder_quantity: reorderQuantity,
        vendor_id: request.preferred_vendor_id,
        status: 'pending',
        notes: `Reorder triggered: ${triggerType}, SKU: ${request.sku_code}`
      };

      const reorderHistoryId = await this.createReorderHistory(reorderHistoryEntry);
      if (!reorderHistoryId) {
        return {
          success: false,
          error: 'Failed to create reorder history entry'
        };
      }

      // Get SKU cost price
      const unitPrice = await this.getSKUCostPrice(request.sku_id);

      if (unitPrice <= 0) {
        await this.updateReorderHistory(reorderHistoryId, { 
          status: 'failed', 
          notes: 'SKU cost price not found' 
        });
        return {
          success: false,
          error: 'SKU cost price not found'
        };
      }

      // Generate PO number
      const poNumber = await this.generatePONumber();

      // Validate vendor_id is provided
      if (!request.preferred_vendor_id) {
        await this.updateReorderHistory(reorderHistoryId, { 
          status: 'failed', 
          notes: 'No vendor selected for reorder' 
        });
        return {
          success: false,
          error: 'Vendor must be selected before creating reorder'
        };
      }

      // Create PO request with enhanced tracking
      const poRequest: CreatePORequest = {
        vendor_id: request.preferred_vendor_id,
        items: [{
          sku_id: request.sku_id,
          size_id: request.size_id,
          quantity: reorderQuantity,
          unit_price: unitPrice
        }],
        notes: `Reorder for SKU ${request.sku_code} (Current: ${request.current_inventory}, Min: ${request.min_threshold}, Optimal: ${request.optimal_threshold})`,
        auto_generated: request.auto_reorder,
        source: request.auto_reorder ? 'auto_reorder' : 'manual',
        reorder_trigger_type: triggerType,
        related_sku_ids: [request.sku_id]
      };

      // Create the PO
      const result = await this.createPurchaseOrder(poRequest, poNumber);

      if (result.success && result.po_id) {
        // Update reorder history with PO ID
        await this.updateReorderHistory(reorderHistoryId, {
          purchase_order_id: result.po_id,
          status: 'po_created',
          notes: `PO created successfully: ${result.po_id}`
        });
      } else {
        // Mark as failed
        await this.updateReorderHistory(reorderHistoryId, {
          status: 'failed',
          notes: result.error || 'PO creation failed'
        });
      }

      return {
        ...result,
        reorder_history_id: reorderHistoryId
      };

    } catch (error) {
      console.error('Error creating reorder PO:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Create a Purchase Order
   */
  async createPurchaseOrder(
    request: CreatePORequest, 
    poNumber?: string
  ): Promise<{ success: boolean; po_id?: string; error?: string }> {
    try {
      // Generate PO number if not provided
      const finalPONumber = poNumber || await this.generatePONumber();

      // Calculate total amount
      const totalAmount = request.items.reduce((sum, item) => 
        sum + (item.quantity * item.unit_price), 0
      );

      // Create the purchase order with enhanced tracking
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .insert([{
          po_number: finalPONumber,
          vendor_id: request.vendor_id,
          total_amount: totalAmount,
          notes: request.notes,
          status: 'draft',
          auto_generated: request.auto_generated || false,
          reorder_source: request.source || 'manual',
          reorder_trigger_type: request.reorder_trigger_type || 'manual',
          related_sku_ids: request.related_sku_ids || []
        }])
        .select('id')
        .single();

      if (poError) {
        console.error('Error creating purchase order:', poError);
        return {
          success: false,
          error: `Failed to create purchase order: ${poError.message}`
        };
      }

      if (!poData) {
        return {
          success: false,
          error: 'Failed to create purchase order'
        };
      }

      // Create purchase order items
      const poItems = request.items.map(item => ({
        purchase_order_id: poData.id,
        sku_id: item.sku_id,
        size_id: item.size_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(poItems);

      if (itemsError) {
        console.error('Error creating purchase order items:', itemsError);
        // Try to clean up the PO
        await supabase
          .from('purchase_orders')
          .delete()
          .eq('id', poData.id);
        
        return {
          success: false,
          error: `Failed to create purchase order items: ${itemsError.message}`
        };
      }

      return {
        success: true,
        po_id: poData.id
      };

    } catch (error) {
      console.error('Error in createPurchaseOrder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check for items that need auto reorder
   */
  async checkAutoReorderItems(items: MaterialPlanningItem[]): Promise<ReorderRequest[]> {
    const reorderRequests: ReorderRequest[] = [];

    for (const item of items) {
      // Only check items with auto reorder enabled
      if (!item.auto_reorder_enabled) continue;

      // Check if current inventory is below minimum threshold
      if (item.available_inventory < item.min_threshold) {
        reorderRequests.push({
          sku_id: item.id,
          sku_code: item.sku_code,
          class_id: item.class_id,
          size_id: item.size?.id,
          current_inventory: item.available_inventory,
          min_threshold: item.min_threshold,
          optimal_threshold: item.optimal_threshold,
          preferred_vendor_id: item.preferred_vendor_id,
          auto_reorder: true
        });
      }
    }

    return reorderRequests;
  }

  /**
   * Process auto reorder for all eligible items
   */
  async processAutoReorder(items: MaterialPlanningItem[]): Promise<{
    success: boolean;
    processed_count: number;
    created_pos: string[];
    errors: string[];
  }> {
    try {
      const reorderRequests = await this.checkAutoReorderItems(items);
      const createdPOs: string[] = [];
      const errors: string[] = [];

      // Group by vendor for efficient PO creation
      const vendorGroups = new Map<string, ReorderRequest[]>();
      
      for (const request of reorderRequests) {
        const vendorId = request.preferred_vendor_id || 'default';
        if (!vendorGroups.has(vendorId)) {
          vendorGroups.set(vendorId, []);
        }
        vendorGroups.get(vendorId)!.push(request);
      }

      // Create POs for each vendor
      for (const [vendorId, requests] of vendorGroups) {
        if (vendorId === 'default' || requests.length === 0) continue;

        // Create a single PO for all items from this vendor
        const poRequest: CreatePORequest = {
          vendor_id: vendorId,
          items: [],
          notes: `Auto-generated PO for ${requests.length} items requiring reorder`,
          auto_generated: true,
          source: 'auto_reorder'
        };

        // Add all items to the PO
        for (const request of requests) {
          const unitPrice = await this.getSKUCostPrice(request.sku_id);
          if (unitPrice > 0) {
            poRequest.items.push({
              sku_id: request.sku_id,
              size_id: request.size_id,
              quantity: this.calculateReorderQuantity(
                request.current_inventory,
                request.min_threshold,
                request.optimal_threshold
              ),
              unit_price: unitPrice
            });
          }
        }

        if (poRequest.items.length > 0) {
          const result = await this.createPurchaseOrder(poRequest);
          if (result.success && result.po_id) {
            createdPOs.push(result.po_id);
          } else {
            errors.push(result.error || 'Failed to create PO');
          }
        }
      }

      return {
        success: errors.length === 0,
        processed_count: reorderRequests.length,
        created_pos: createdPOs,
        errors
      };

    } catch (error) {
      console.error('Error in processAutoReorder:', error);
      return {
        success: false,
        processed_count: 0,
        created_pos: [],
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Get vendors for dropdown selection
   */
  async getVendors(): Promise<Array<{ id: string; name: string; code: string }>> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, code')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error fetching vendors:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getVendors:', error);
      return [];
    }
  }
}

export const materialPlanningPOService = new MaterialPlanningPOService();
