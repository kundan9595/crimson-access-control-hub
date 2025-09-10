import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrderStatus } from '@/types/purchaseOrder';

export interface PurchaseOrderItem {
  sku_id: string;
  size_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface PurchaseOrderMiscItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CreatePurchaseOrderData {
  vendor_id: string;
  notes?: string;
  items: PurchaseOrderItem[];
  misc_items: PurchaseOrderMiscItem[];
}

export interface PurchaseOrderDraft {
  id: string;
  po_number: string;
  vendor_id: string | null;
  notes?: string | null;
  items: (PurchaseOrderItem & {
    sku_code?: string;
    sku_name?: string;
    size_name?: string;
  })[];
  misc_items: PurchaseOrderMiscItem[];
  current_step: number;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name: string;
  vendor_email: string;
  status: PurchaseOrderStatus;
  total_amount: number;
  item_count: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderDetails {
  po: PurchaseOrder;
  items: Array<{
    id: string;
    sku_id: string;
    sku_code: string;
    sku_name: string;
    size_id: string;
    size_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  misc_items: Array<{
    id: string;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

class PurchaseOrderService {
  async createPurchaseOrder(data: CreatePurchaseOrderData, draftId?: string): Promise<string> {
    try {
      let poId;

      if (draftId) {
        // Update existing draft to final PO
        const { data: { user } } = await supabase.auth.getUser();
        
        // Calculate total amount
        const itemsTotal = data.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
        const miscItemsTotal = data.misc_items.reduce((sum, item) => sum + (item.total_price || 0), 0);
        const totalAmount = itemsTotal + miscItemsTotal;

        // Update the draft to final status
        const { data: updateData, error: updateError } = await supabase
          .from('purchase_orders')
          .update({
            vendor_id: data.vendor_id,
            total_amount: totalAmount,
            notes: data.notes || null,
            status: 'sent_for_approval',
            updated_by: user?.id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', draftId)
          .eq('status', 'draft')
          .select('id')
          .single();

        if (updateError) throw updateError;
        poId = updateData.id;

        // Clear existing items and add new ones
        await supabase.from('purchase_order_items').delete().eq('purchase_order_id', poId);
        await supabase.from('purchase_order_misc_items').delete().eq('purchase_order_id', poId);

        // Add SKU items if any
        if (data.items.length > 0) {
          const itemsToInsert = data.items.map(item => ({
            purchase_order_id: poId,
            sku_id: item.sku_id,
            size_id: item.size_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }));
          
          const { error: itemsError } = await supabase
            .from('purchase_order_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }

        // Add misc items if any
        if (data.misc_items.length > 0) {
          const miscItemsToInsert = data.misc_items.map(item => ({
            purchase_order_id: poId,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
          }));
          
          const { error: miscError } = await supabase
            .from('purchase_order_misc_items')
            .insert(miscItemsToInsert);

          if (miscError) throw miscError;
        }
      } else {
        // Create new purchase order using RPC
        const { data: { user } } = await supabase.auth.getUser();
        
        const { data: poData, error: poError } = await supabase.rpc('create_purchase_order', {
          p_vendor_id: data.vendor_id,
          p_notes: data.notes || null,
          p_created_by: user?.id || null
        });

        if (poError) throw poError;
        poId = poData;

        // Add SKU items if any
        if (data.items.length > 0) {
          const { error: itemsError } = await supabase.rpc('add_po_sku_items', {
            p_po_id: poId,
            p_items: data.items
          });

          if (itemsError) throw itemsError;
        }

        // Add misc items if any
        if (data.misc_items.length > 0) {
          const { error: miscError } = await supabase.rpc('add_po_misc_items', {
            p_po_id: poId,
            p_items: data.misc_items
          });

          if (miscError) throw miscError;
        }
      }

      return poId;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  }

  async getPurchaseOrders(status?: PurchaseOrderStatus, vendor_id?: string): Promise<PurchaseOrder[]> {
    try {
      const { data, error } = await supabase.rpc('get_purchase_orders', {
        p_status: status || null,
        p_vendor_id: vendor_id || null
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  }

  async getPurchaseOrderDetails(poId: string): Promise<PurchaseOrderDetails> {
    try {
      const { data, error } = await supabase.rpc('get_purchase_order_details', {
        p_po_id: poId
      });

      if (error) throw error;

      // If this is a draft with items but total_amount is 0, recalculate the total
      if (data && data.po && data.po.status === 'draft' && data.po.total_amount === 0) {
        const hasItems = (data.items && data.items.length > 0) || (data.misc_items && data.misc_items.length > 0);
        if (hasItems) {
          console.log('Draft has items but total_amount is 0, recalculating...');
          await this.recalculateDraftTotal(poId);
          
          // Fetch the updated data
          const { data: updatedData, error: updatedError } = await supabase.rpc('get_purchase_order_details', {
            p_po_id: poId
          });
          
          if (updatedError) throw updatedError;
          return updatedData;
        }
      }

      return data;
    } catch (error) {
      console.error('Error fetching purchase order details:', error);
      throw error;
    }
  }

  async updatePurchaseOrderStatus(poId: string, status: PurchaseOrderStatus): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.rpc('update_po_status', {
        p_po_id: poId,
        p_status: status,
        p_updated_by: user?.id || null
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      throw error;
    }
  }

  async deletePurchaseOrder(poId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', poId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      throw error;
    }
  }

  // Helper method to generate PO number
  private async generatePONumber(): Promise<string> {
    try {
      // Get the current year
      const year = new Date().getFullYear();
      
      // Get the count of purchase orders for this year
      const { count } = await supabase
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${year}-01-01`)
        .lt('created_at', `${year + 1}-01-01`);
      
      // Generate PO number: PO-YYYY-XXXX
      const poNumber = `PO-${year}-${String((count || 0) + 1).padStart(4, '0')}`;
      return poNumber;
    } catch (error) {
      console.error('Error generating PO number:', error);
      // Fallback to timestamp-based number
      return `PO-${Date.now()}`;
    }
  }

  // Update draft without changing status
  async updateDraft(data: CreatePurchaseOrderData, draftId: string): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Calculate total amount
      const itemsTotal = data.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
      const miscItemsTotal = data.misc_items.reduce((sum, item) => sum + (item.total_price || 0), 0);
      const totalAmount = itemsTotal + miscItemsTotal;

      // Update the draft without changing status
      const { data: updateData, error: updateError } = await supabase
        .from('purchase_orders')
        .update({
          vendor_id: data.vendor_id,
          total_amount: totalAmount,
          notes: data.notes || null,
          updated_by: user?.id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', draftId)
        .eq('status', 'draft')
        .select('id')
        .single();

      if (updateError) throw updateError;
      const poId = updateData.id;

      // Clear existing items and add new ones
      await supabase.from('purchase_order_items').delete().eq('purchase_order_id', poId);
      await supabase.from('purchase_order_misc_items').delete().eq('purchase_order_id', poId);

      // Add SKU items if any
      if (data.items.length > 0) {
        const itemsToInsert = data.items.map(item => ({
          purchase_order_id: poId,
          sku_id: item.sku_id,
          size_id: item.size_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));
        
        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      // Add misc items if any
      if (data.misc_items.length > 0) {
        const miscItemsToInsert = data.misc_items.map(item => ({
          purchase_order_id: poId,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));
        
        const { error: miscError } = await supabase
          .from('purchase_order_misc_items')
          .insert(miscItemsToInsert);

        if (miscError) throw miscError;
      }

      return poId;
    } catch (error) {
      console.error('Error updating draft:', error);
      throw error;
    }
  }

  // Draft methods
  async saveDraft(data: Omit<CreatePurchaseOrderData, 'vendor_id'> & { vendor_id?: string }, currentStep: number, existingDraftId?: string): Promise<string> {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      // Calculate total amount
      const itemsTotal = (data.items || []).reduce((sum, item) => sum + (item.total_price || 0), 0);
      const miscItemsTotal = (data.misc_items || []).reduce((sum, item) => sum + (item.total_price || 0), 0);
      const totalAmount = itemsTotal + miscItemsTotal;
      
      let draftData;
      let error;

      if (existingDraftId) {
        // Update existing draft
        const { data: updateData, error: updateError } = await supabase
          .from('purchase_orders')
          .update({
            vendor_id: data.vendor_id || null,
            total_amount: totalAmount,
            notes: data.notes || null,
            status: 'draft',
            updated_by: user?.id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDraftId)
          .eq('status', 'draft')
          .select('id')
          .single();
        
        draftData = updateData;
        error = updateError;
      } else {
        // Check if user already has a draft
        const { data: existingDrafts } = await supabase
          .from('purchase_orders')
          .select('id')
          .eq('status', 'draft')
          .eq('created_by', user?.id || null)
          .limit(1);

        if (existingDrafts && existingDrafts.length > 0) {
          // Update existing draft
          const { data: updateData, error: updateError } = await supabase
            .from('purchase_orders')
            .update({
              vendor_id: data.vendor_id || null,
              total_amount: totalAmount,
              notes: data.notes || null,
              status: 'draft',
              updated_by: user?.id || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingDrafts[0].id)
            .eq('status', 'draft')
            .select('id')
            .single();
          
          draftData = updateData;
          error = updateError;
        } else {
          // Create new draft - generate proper PO number
          const poNumber = await this.generatePONumber();
          const { data: createData, error: createError } = await supabase
            .from('purchase_orders')
            .insert({
              po_number: poNumber,
              vendor_id: data.vendor_id || null,
              total_amount: totalAmount,
              notes: data.notes || null,
              status: 'draft',
              created_by: user?.id || null,
              updated_by: user?.id || null,
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single();
          
          draftData = createData;
          error = createError;
        }
      }

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      if (!draftData) {
        throw new Error('No data returned from draft save operation');
      }
      
      // Always clear existing items first, then save new ones
      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .delete()
        .eq('purchase_order_id', draftData.id);
      
      if (itemsError) {
        console.error('Error clearing existing items:', itemsError);
      }
      
      // Save items if any
      if (data.items && data.items.length > 0) {
        const itemsToInsert = data.items.map(item => ({
          purchase_order_id: draftData.id,
          sku_id: item.sku_id,
          size_id: item.size_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));
        
        const { error: insertItemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsToInsert);
        
        if (insertItemsError) {
          console.error('Error inserting items:', insertItemsError);
        }
      }
      
      // Always clear existing misc items first, then save new ones
      const { error: miscItemsError } = await supabase
        .from('purchase_order_misc_items')
        .delete()
        .eq('purchase_order_id', draftData.id);
      
      if (miscItemsError) {
        console.error('Error clearing existing misc items:', miscItemsError);
      }
      
      // Save misc items if any
      if (data.misc_items && data.misc_items.length > 0) {
        const miscItemsToInsert = data.misc_items.map(item => ({
          purchase_order_id: draftData.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));
        
        const { error: insertMiscItemsError } = await supabase
          .from('purchase_order_misc_items')
          .insert(miscItemsToInsert);
        
        if (insertMiscItemsError) {
          console.error('Error inserting misc items:', insertMiscItemsError);
        }
      }
      
      // Recalculate total amount after adding items to ensure accuracy
      await this.recalculateDraftTotal(draftData.id);
      
      return draftData.id;
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  }

  async getDraft(draftId: string): Promise<PurchaseOrderDraft | null> {
    try {
      // First, get the basic draft data
      const { data: draftData, error: draftError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items (*),
          purchase_order_misc_items (*)
        `)
        .eq('id', draftId)
        .eq('status', 'draft')
        .single();

      if (draftError) {
        if (draftError.code === 'PGRST116') return null; // Not found
        throw draftError;
      }

      if (!draftData) return null;

      // Get SKU and size information for each item
      const itemsWithNames = await Promise.all(
        (draftData.purchase_order_items || []).map(async (item) => {
          console.log('Processing draft item:', item);
          
          // Get SKU information
          const { data: skuData, error: skuError } = await supabase
            .from('skus')
            .select(`
              sku_code,
              description
            `)
            .eq('id', item.sku_id)
            .single();

          console.log('SKU data for item:', item.sku_id, skuData, skuError);

          // Get size information
          const { data: sizeData, error: sizeError } = await supabase
            .from('sizes')
            .select('name')
            .eq('id', item.size_id)
            .single();

          console.log('Size data for item:', item.size_id, sizeData, sizeError);

          return {
            ...item,
            sku_code: skuData?.sku_code || '',
            sku_name: skuData?.description || '',
            size_name: sizeData?.name || ''
          };
        })
      );

      // Transform the data to match PurchaseOrderDraft interface
      const draft: PurchaseOrderDraft = {
        id: draftData.id,
        po_number: draftData.po_number,
        vendor_id: draftData.vendor_id,
        notes: draftData.notes,
        items: itemsWithNames,
        misc_items: draftData.purchase_order_misc_items || [],
        current_step: 1, // We'll need to store this separately or calculate it
        status: draftData.status,
        created_at: draftData.created_at,
        updated_at: draftData.updated_at,
        created_by: draftData.created_by,
        updated_by: draftData.updated_by
      };

      return draft;
    } catch (error) {
      console.error('Error fetching draft:', error);
      throw error;
    }
  }

  async getDrafts(): Promise<PurchaseOrderDraft[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          purchase_order_items (*),
          purchase_order_misc_items (*)
        `)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching drafts:', error);
        throw error;
      }

      if (!data) return [];

      // Transform the data to match PurchaseOrderDraft interface
      const drafts: PurchaseOrderDraft[] = data.map(item => ({
        id: item.id,
        po_number: item.po_number,
        vendor_id: item.vendor_id,
        notes: item.notes,
        items: item.purchase_order_items || [],
        misc_items: item.purchase_order_misc_items || [],
        current_step: 1, // We'll need to store this separately or calculate it
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        created_by: item.created_by,
        updated_by: item.updated_by
      }));

      return drafts;
    } catch (error) {
      console.error('Error fetching drafts:', error);
      throw error;
    }
  }

  async deleteDraft(draftId: string): Promise<void> {
    try {
      console.log('Attempting to delete purchase order with ID:', draftId);
      
      const { data, error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', draftId)
        .in('status', ['draft', 'sent_for_approval'])
        .select();

      console.log('Delete result:', { data, error });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('No rows were deleted. Purchase order may not exist or may not be in a deletable status.');
        throw new Error('Purchase order not found or not in a deletable status');
      }

      console.log('Successfully deleted purchase order:', data);
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      throw error;
    }
  }

  // Method to recalculate and update total amount for a draft
  async recalculateDraftTotal(draftId: string): Promise<void> {
    try {
      // Get all items for this draft
      const { data: items, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select('total_price')
        .eq('purchase_order_id', draftId);

      if (itemsError) throw itemsError;

      const { data: miscItems, error: miscItemsError } = await supabase
        .from('purchase_order_misc_items')
        .select('total_price')
        .eq('purchase_order_id', draftId);

      if (miscItemsError) throw miscItemsError;

      // Calculate total amount
      const itemsTotal = (items || []).reduce((sum, item) => sum + (item.total_price || 0), 0);
      const miscItemsTotal = (miscItems || []).reduce((sum, item) => sum + (item.total_price || 0), 0);
      const totalAmount = itemsTotal + miscItemsTotal;

      // Update the draft with the calculated total
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({ 
          total_amount: totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', draftId)
        .eq('status', 'draft');

      if (updateError) throw updateError;

      console.log('Successfully recalculated total amount for draft:', draftId, 'Total:', totalAmount);
    } catch (error) {
      console.error('Error recalculating draft total:', error);
      throw error;
    }
  }

  // Method to fix all draft purchase orders with incorrect totals
  async fixAllDraftTotals(): Promise<void> {
    try {
      // Get all draft purchase orders
      const { data: drafts, error: draftsError } = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('status', 'draft');

      if (draftsError) throw draftsError;

      // Recalculate totals for each draft
      for (const draft of drafts || []) {
        await this.recalculateDraftTotal(draft.id);
      }

      console.log(`Successfully fixed totals for ${drafts?.length || 0} draft purchase orders`);
    } catch (error) {
      console.error('Error fixing draft totals:', error);
      throw error;
    }
  }
}

export const purchaseOrderService = new PurchaseOrderService();
