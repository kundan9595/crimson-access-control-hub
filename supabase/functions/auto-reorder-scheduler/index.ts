import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface MaterialPlanningItem {
  id: string;
  sku_code: string;
  class_id: string;
  size?: { id: string };
  available_inventory: number;
  min_threshold: number;
  optimal_threshold: number;
  auto_reorder_enabled: boolean;
  preferred_vendor_id?: string;
  status: string;
}

interface ReorderRequest {
  sku_id: string;
  sku_code: string;
  class_id: string;
  size_id?: string;
  current_inventory: number;
  min_threshold: number;
  optimal_threshold: number;
  preferred_vendor_id?: string;
  auto_reorder: boolean;
  reorder_quantity?: number;
}

interface CreatePORequest {
  vendor_id: string;
  items: Array<{
    sku_id: string;
    size_id?: string;
    quantity: number;
    unit_price: number;
  }>;
  notes?: string;
  auto_generated: boolean;
  source: 'manual' | 'auto_reorder';
  reorder_trigger_type?: 'auto_schedule' | 'inventory_change' | 'manual';
  related_sku_ids?: string[];
}

interface ReorderHistoryEntry {
  sku_id: string;
  trigger_type: 'auto_schedule' | 'inventory_change' | 'manual';
  inventory_level: number;
  min_threshold: number;
  optimal_threshold: number;
  reorder_quantity: number;
  vendor_id?: string;
  purchase_order_id?: string;
  status: 'pending' | 'po_created' | 'po_approved' | 'completed' | 'failed';
  notes?: string;
}

class AutoReorderScheduler {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Check if there's already a pending reorder for this SKU
   */
  async hasPendingReorder(skuId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('reorder_history')
        .select('id')
        .eq('sku_id', skuId)
        .in('status', ['pending', 'po_created'])
        .limit(1);

      if (error) {
        console.error('Error checking pending reorder:', error);
        return false;
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
      const { data, error } = await this.supabase
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
      const { error } = await this.supabase
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
   * Get SKU cost price
   */
  async getSKUCostPrice(skuId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('skus')
        .select('cost_price')
        .eq('id', skuId)
        .single();

      if (error || !data) {
        console.error('Error fetching SKU cost price:', error);
        return 0;
      }

      return data.cost_price || 0;
    } catch (error) {
      console.error('Error in getSKUCostPrice:', error);
      return 0;
    }
  }

  /**
   * Generate PO number
   */
  async generatePONumber(): Promise<string> {
    try {
      const { data: latestPO } = await this.supabase
        .from('purchase_orders')
        .select('po_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestPO && latestPO.po_number) {
        const match = latestPO.po_number.match(/PO-(\d+)/);
        if (match) {
          const lastNumber = parseInt(match[1]);
          return `PO-${String(lastNumber + 1).padStart(4, '0')}`;
        }
      }

      return 'PO-0001';
    } catch (error) {
      console.error('Error generating PO number:', error);
      return `PO-${Date.now()}`;
    }
  }

  /**
   * Create Purchase Order
   */
  async createPurchaseOrder(request: CreatePORequest): Promise<{ success: boolean; po_id?: string; error?: string }> {
    try {
      const poNumber = await this.generatePONumber();
      const totalAmount = request.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      const { data: poData, error: poError } = await this.supabase
        .from('purchase_orders')
        .insert([{
          po_number: poNumber,
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

      // Create PO items
      const poItems = request.items.map(item => ({
        purchase_order_id: poData.id,
        sku_id: item.sku_id,
        size_id: item.size_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await this.supabase
        .from('purchase_order_items')
        .insert(poItems);

      if (itemsError) {
        console.error('Error creating purchase order items:', itemsError);
        // Clean up the PO
        await this.supabase
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
   * Process reorder for a single SKU
   */
  async processReorderForSKU(item: MaterialPlanningItem): Promise<{ success: boolean; po_id?: string; error?: string }> {
    try {
      // Check for existing pending reorder
      const hasPending = await this.hasPendingReorder(item.id);
      if (hasPending) {
        console.log(`Skipping ${item.sku_code}: pending reorder already exists`);
        return {
          success: false,
          error: 'Pending reorder already exists'
        };
      }

      // Calculate reorder quantity
      const reorderQuantity = item.optimal_threshold - item.available_inventory;
      if (reorderQuantity <= 0) {
        return {
          success: false,
          error: 'No reorder quantity needed'
        };
      }

      // Create reorder history entry
      const reorderHistoryEntry: ReorderHistoryEntry = {
        sku_id: item.id,
        trigger_type: 'auto_schedule',
        inventory_level: item.available_inventory,
        min_threshold: item.min_threshold,
        optimal_threshold: item.optimal_threshold,
        reorder_quantity: reorderQuantity,
        vendor_id: item.preferred_vendor_id,
        status: 'pending',
        notes: `Scheduled auto reorder for SKU: ${item.sku_code}`
      };

      const reorderHistoryId = await this.createReorderHistory(reorderHistoryEntry);
      if (!reorderHistoryId) {
        return {
          success: false,
          error: 'Failed to create reorder history entry'
        };
      }

      // Get SKU cost price
      const unitPrice = await this.getSKUCostPrice(item.id);
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

      // Create PO request
      const poRequest: CreatePORequest = {
        vendor_id: item.preferred_vendor_id!,
        items: [{
          sku_id: item.id,
          size_id: item.size?.id,
          quantity: reorderQuantity,
          unit_price: unitPrice
        }],
        notes: `Scheduled auto reorder for SKU ${item.sku_code} (Current: ${item.available_inventory}, Min: ${item.min_threshold}, Optimal: ${item.optimal_threshold})`,
        auto_generated: true,
        source: 'auto_reorder',
        reorder_trigger_type: 'auto_schedule',
        related_sku_ids: [item.id]
      };

      // Create the PO
      const result = await this.createPurchaseOrder(poRequest);

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

      return result;

    } catch (error) {
      console.error('Error processing reorder for SKU:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get items that need auto reorder
   */
  async getItemsNeedingReorder(): Promise<MaterialPlanningItem[]> {
    try {
      const { data: skus, error } = await this.supabase
        .from('skus')
        .select(`
          id,
          sku_code,
          class_id,
          auto_reorder_enabled,
          preferred_vendor_id,
          size:sizes(id),
          class:classes(
            overall_min_stock,
            overall_max_stock,
            stock_management_type,
            monthly_stock_levels
          )
        `)
        .eq('status', 'active')
        .eq('auto_reorder_enabled', true)
        .not('preferred_vendor_id', 'is', null);

      if (error) {
        console.error('Error fetching SKUs:', error);
        return [];
      }

      if (!skus || skus.length === 0) {
        console.log('No SKUs with auto reorder enabled found');
        return [];
      }

      // Get inventory data for these SKUs
      const skuIds = skus.map(sku => sku.id);
      const { data: inventoryData, error: inventoryError } = await this.supabase
        .from('warehouse_inventory')
        .select('sku_id, total_quantity, reserved_quantity, available_quantity')
        .in('sku_id', skuIds);

      if (inventoryError) {
        console.error('Error fetching inventory data:', inventoryError);
        return [];
      }

      // Combine data and filter items needing reorder
      const itemsNeedingReorder: MaterialPlanningItem[] = [];
      const currentMonth = new Date().getMonth() + 1;

      for (const sku of skus) {
        const inventory = inventoryData?.find(inv => inv.sku_id === sku.id);
        const availableInventory = inventory?.available_quantity || 0;

        // Calculate thresholds
        let minThreshold = 0;
        let optimalThreshold = 0;

        if (sku.class?.stock_management_type === 'monthly' && sku.class?.monthly_stock_levels) {
          const monthlyData = sku.class.monthly_stock_levels.find((m: any) => m.month === currentMonth);
          if (monthlyData) {
            minThreshold = monthlyData.min_stock || 0;
            optimalThreshold = monthlyData.max_stock || 0;
          }
        } else {
          minThreshold = sku.class?.overall_min_stock || 0;
          optimalThreshold = sku.class?.overall_max_stock || 0;
        }

        // Check if reorder is needed
        if (availableInventory < minThreshold && minThreshold > 0) {
          let status = 'Normal';
          if (availableInventory <= minThreshold * 0.5) {
            status = 'Critical';
          } else if (availableInventory < minThreshold) {
            status = 'Low';
          }

          itemsNeedingReorder.push({
            id: sku.id,
            sku_code: sku.sku_code,
            class_id: sku.class_id,
            size: sku.size,
            available_inventory: availableInventory,
            min_threshold: minThreshold,
            optimal_threshold: optimalThreshold,
            auto_reorder_enabled: sku.auto_reorder_enabled,
            preferred_vendor_id: sku.preferred_vendor_id,
            status: status
          });
        }
      }

      return itemsNeedingReorder;

    } catch (error) {
      console.error('Error in getItemsNeedingReorder:', error);
      return [];
    }
  }

  /**
   * Run the scheduled auto reorder process
   */
  async runScheduledAutoReorder(): Promise<{
    success: boolean;
    processed_count: number;
    created_pos: string[];
    errors: string[];
  }> {
    console.log('Starting scheduled auto reorder process...');

    try {
      const itemsNeedingReorder = await this.getItemsNeedingReorder();
      
      console.log(`Found ${itemsNeedingReorder.length} items needing reorder`);

      const createdPos: string[] = [];
      const errors: string[] = [];
      let processedCount = 0;

      // Group by vendor to create one PO per vendor
      const itemsByVendor = itemsNeedingReorder.reduce((acc, item) => {
        if (item.preferred_vendor_id) {
          if (!acc[item.preferred_vendor_id]) {
            acc[item.preferred_vendor_id] = [];
          }
          acc[item.preferred_vendor_id].push(item);
        }
        return acc;
      }, {} as Record<string, MaterialPlanningItem[]>);

      // Process each vendor group
      for (const [vendorId, items] of Object.entries(itemsByVendor)) {
        try {
          console.log(`Processing ${items.length} items for vendor ${vendorId}`);

          // Check each item individually to prevent duplicates
          const validItems: MaterialPlanningItem[] = [];
          for (const item of items) {
            const hasPending = await this.hasPendingReorder(item.id);
            if (!hasPending) {
              validItems.push(item);
            } else {
              console.log(`Skipping ${item.sku_code}: pending reorder exists`);
            }
          }

          if (validItems.length === 0) {
            console.log(`No valid items for vendor ${vendorId}`);
            continue;
          }

          // Create reorder history entries for all items
          const reorderHistoryIds: string[] = [];
          const poItems: any[] = [];

          for (const item of validItems) {
            const reorderQuantity = item.optimal_threshold - item.available_inventory;
            const unitPrice = await this.getSKUCostPrice(item.id);

            if (unitPrice <= 0) {
              errors.push(`SKU ${item.sku_code}: cost price not found`);
              continue;
            }

            // Create reorder history entry
            const reorderHistoryEntry: ReorderHistoryEntry = {
              sku_id: item.id,
              trigger_type: 'auto_schedule',
              inventory_level: item.available_inventory,
              min_threshold: item.min_threshold,
              optimal_threshold: item.optimal_threshold,
              reorder_quantity: reorderQuantity,
              vendor_id: vendorId,
              status: 'pending',
              notes: `Scheduled auto reorder for SKU: ${item.sku_code}`
            };

            const historyId = await this.createReorderHistory(reorderHistoryEntry);
            if (historyId) {
              reorderHistoryIds.push(historyId);
              poItems.push({
                sku_id: item.id,
                size_id: item.size?.id,
                quantity: reorderQuantity,
                unit_price: unitPrice
              });
              processedCount++;
            }
          }

          if (poItems.length === 0) {
            continue;
          }

          // Create single PO for all items from this vendor
          const poRequest: CreatePORequest = {
            vendor_id: vendorId,
            items: poItems,
            notes: `Scheduled auto reorder for ${poItems.length} SKUs`,
            auto_generated: true,
            source: 'auto_reorder',
            reorder_trigger_type: 'auto_schedule',
            related_sku_ids: validItems.map(item => item.id)
          };

          const result = await this.createPurchaseOrder(poRequest);

          // Update all reorder history entries
          for (const historyId of reorderHistoryIds) {
            if (result.success && result.po_id) {
              await this.updateReorderHistory(historyId, {
                purchase_order_id: result.po_id,
                status: 'po_created',
                notes: `PO created successfully: ${result.po_id}`
              });
            } else {
              await this.updateReorderHistory(historyId, {
                status: 'failed',
                notes: result.error || 'PO creation failed'
              });
            }
          }

          if (result.success && result.po_id) {
            createdPos.push(result.po_id);
            console.log(`Created PO ${result.po_id} for vendor ${vendorId} with ${poItems.length} items`);
          } else {
            errors.push(`Failed to create PO for vendor ${vendorId}: ${result.error}`);
          }

        } catch (error) {
          const errorMsg = `Error processing vendor ${vendorId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`Scheduled auto reorder completed. Processed: ${processedCount}, Created POs: ${createdPos.length}, Errors: ${errors.length}`);

      return {
        success: errors.length === 0,
        processed_count: processedCount,
        created_pos: createdPos,
        errors: errors
      };

    } catch (error) {
      console.error('Error in runScheduledAutoReorder:', error);
      return {
        success: false,
        processed_count: 0,
        created_pos: [],
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }
}

Deno.serve(async (req: Request) => {
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the request is from a cron job or authorized source
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const scheduler = new AutoReorderScheduler(supabaseUrl, supabaseServiceKey);
    const result = await scheduler.runScheduledAutoReorder();

    return new Response(
      JSON.stringify({
        message: 'Scheduled auto reorder completed',
        ...result
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Connection': 'keep-alive'
        }
      }
    );

  } catch (error) {
    console.error('Error in auto-reorder-scheduler:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
