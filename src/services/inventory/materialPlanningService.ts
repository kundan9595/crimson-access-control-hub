import { supabase } from '@/integrations/supabase/client';
import {
  MaterialPlanningItem,
  MaterialPlanningSearchParams,
  MaterialPlanningResult,
  MaterialPlanningStatistics,
  ThresholdCalculation,
  ClassWithThresholds,
  MonthlyThresholdData,
  ReorderRequest
} from './materialPlanningTypes';
import { materialPlanningPOService } from './materialPlanningPOService';

export class MaterialPlanningService {
  /**
   * Get current month (1-12)
   */
  private getCurrentMonth(): number {
    return new Date().getMonth() + 1;
  }

  /**
   * Calculate threshold values based on class configuration
   */
  private calculateThresholds(classData: ClassWithThresholds): ThresholdCalculation {
    const currentMonth = this.getCurrentMonth();

    if (classData.stock_management_type === 'monthly' && classData.monthly_stock_levels) {
      const monthKey = currentMonth.toString();
      const monthlyData = classData.monthly_stock_levels[monthKey];
      
      if (monthlyData && (monthlyData.minStock > 0 || monthlyData.maxStock > 0)) {
        return {
          min_threshold: monthlyData.minStock || 0,
          optimal_threshold: monthlyData.maxStock || 0,
          source: 'monthly',
          current_month: currentMonth,
          is_configured: true
        };
      }
    }

    // Fallback to overall thresholds
    return {
      min_threshold: classData.overall_min_stock || 0,
      optimal_threshold: classData.overall_max_stock || 0,
      source: 'overall',
      is_configured: (classData.overall_min_stock || 0) > 0 || (classData.overall_max_stock || 0) > 0
    };
  }

  /**
   * Calculate inventory status based on current inventory and thresholds
   */
  private calculateStatus(
    currentInventory: number,
    minThreshold: number,
    optimalThreshold: number
  ): { status: MaterialPlanningItem['status']; percentage: number } {
    if (minThreshold === 0 && optimalThreshold === 0) {
      return { status: 'Normal', percentage: 100 };
    }

    if (currentInventory === 0) {
      return { status: 'Critical', percentage: 0 };
    }

    if (minThreshold > 0) {
      if (currentInventory < minThreshold) {
        const percentage = Math.round((currentInventory / minThreshold) * 100);
        return {
          status: percentage <= 25 ? 'Critical' : 'Low',
          percentage
        };
      }
    }

    if (optimalThreshold > 0 && currentInventory > optimalThreshold * 1.5) {
      return { status: 'Overstocked', percentage: 150 };
    }

    return { status: 'Normal', percentage: 100 };
  }

  /**
   * Fetch all SKUs with their inventory and threshold data
   */
  async getMaterialPlanningData(params: MaterialPlanningSearchParams = {}): Promise<MaterialPlanningResult> {
    try {
      // Build the base query
      let query = supabase
        .from('skus')
        .select(`
          id,
          sku_code,
          description,
          class_id,
          status,
          auto_reorder_enabled,
          preferred_vendor_id,
          created_at,
          updated_at,
          class:classes(
            id,
            name,
            stock_management_type,
            overall_min_stock,
            overall_max_stock,
            monthly_stock_levels,
            style:styles(
              id,
              name,
              brand:brands(id, name),
              category:categories(id, name)
            ),
            color:colors(id, name, hex_code)
          ),
          size:sizes(id, name, code),
          preferred_vendor:vendors(id, name, code)
        `)
        .eq('status', 'active');

      // Apply search query
      if (params.query) {
        query = query.or(`sku_code.ilike.%${params.query}%,description.ilike.%${params.query}%`);
      }

      // Apply class filter
      if (params.class_filter) {
        query = query.eq('class_id', params.class_filter);
      }

      // Get total count for pagination
      const { count } = await supabase
        .from('skus')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Apply pagination
      const page = params.page || 1;
      const limit = params.limit || 50;
      const offset = (page - 1) * limit;

      query = query.range(offset, offset + limit - 1);

      // Apply sorting
      const sortBy = params.sort_by || 'sku_code';
      const sortOrder = params.sort_order || 'asc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data: skuData, error: skuError } = await query;

      if (skuError) {
        console.error('Error fetching SKUs:', skuError);
        throw new Error(`Failed to fetch SKUs: ${skuError.message}`);
      }

      if (!skuData || skuData.length === 0) {
        return {
          items: [],
          total_count: count || 0,
          page,
          limit,
          has_next_page: false,
          has_previous_page: false
        };
      }

      // Get inventory data for all SKUs
      const skuIds = skuData.map(sku => sku.id);
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('warehouse_inventory' as any)
        .select(`
          sku_id,
          total_quantity,
          reserved_quantity,
          available_quantity
        `)
        .in('sku_id', skuIds);

      if (inventoryError) {
        console.error('Error fetching inventory:', inventoryError);
        throw new Error(`Failed to fetch inventory: ${inventoryError.message}`);
      }

      // Aggregate inventory by SKU
      const inventoryMap = new Map<string, {
        total: number;
        reserved: number;
        available: number;
      }>();

      (inventoryData || []).forEach(inv => {
        const existing = inventoryMap.get(inv.sku_id) || { total: 0, reserved: 0, available: 0 };
        inventoryMap.set(inv.sku_id, {
          total: existing.total + (inv.total_quantity || 0),
          reserved: existing.reserved + (inv.reserved_quantity || 0),
          available: existing.available + (inv.available_quantity || 0)
        });
      });

      // Process SKUs and calculate thresholds
      const items: MaterialPlanningItem[] = skuData.map(sku => {
        const inventory = inventoryMap.get(sku.id) || { total: 0, reserved: 0, available: 0 };
        const classData = sku.class as ClassWithThresholds;
        
        // Calculate thresholds
        const thresholds = this.calculateThresholds(classData);
        
        // Calculate status
        const statusInfo = this.calculateStatus(
          inventory.available,
          thresholds.min_threshold,
          thresholds.optimal_threshold
        );

        return {
          id: sku.id,
          sku_code: sku.sku_code,
          description: sku.description,
          class_id: sku.class_id,
          class: classData,
          size: sku.size,
          current_inventory: inventory.total,
          reserved_inventory: inventory.reserved,
          available_inventory: inventory.available,
          min_threshold: thresholds.min_threshold,
          optimal_threshold: thresholds.optimal_threshold,
          status: statusInfo.status,
          status_percentage: statusInfo.percentage,
          threshold_source: thresholds.source,
          current_month: thresholds.current_month,
          auto_reorder_enabled: sku.auto_reorder_enabled || false,
          preferred_vendor_id: sku.preferred_vendor_id,
          preferred_vendor_name: sku.preferred_vendor?.name,
          last_updated: sku.updated_at
        };
      });

      // Apply status filter after processing
      let filteredItems = items;
      if (params.status_filter && params.status_filter !== 'all') {
        filteredItems = items.filter(item => item.status === params.status_filter);
      }

      // Apply threshold type filter
      if (params.threshold_type_filter && params.threshold_type_filter !== 'all') {
        filteredItems = items.filter(item => item.threshold_source === params.threshold_type_filter);
      }

      return {
        items: filteredItems,
        total_count: count || 0,
        page,
        limit,
        has_next_page: (offset + limit) < (count || 0),
        has_previous_page: page > 1
      };

    } catch (error) {
      console.error('Error in getMaterialPlanningData:', error);
      throw error;
    }
  }

  /**
   * Get material planning statistics
   */
  async getMaterialPlanningStatistics(): Promise<MaterialPlanningStatistics> {
    try {
      // Get all active SKUs with class data
      const { data: skuData, error } = await supabase
        .from('skus')
        .select(`
          id,
          class:classes(
            stock_management_type,
            overall_min_stock,
            overall_max_stock,
            monthly_stock_levels
          )
        `)
        .eq('status', 'active');

      if (error) {
        throw new Error(`Failed to fetch statistics: ${error.message}`);
      }

      if (!skuData) {
        return {
          total_skus: 0,
          normal_count: 0,
          low_count: 0,
          critical_count: 0,
          overstocked_count: 0,
          overall_threshold_count: 0,
          monthly_threshold_count: 0,
          no_threshold_count: 0
        };
      }

      // Get inventory data
      const skuIds = skuData.map(sku => sku.id);
      const { data: inventoryData } = await supabase
        .from('warehouse_inventory' as any)
        .select('sku_id, available_quantity')
        .in('sku_id', skuIds);

      // Aggregate inventory by SKU
      const inventoryMap = new Map<string, number>();
      (inventoryData || []).forEach(inv => {
        const existing = inventoryMap.get(inv.sku_id) || 0;
        inventoryMap.set(inv.sku_id, existing + (inv.available_quantity || 0));
      });

      // Calculate statistics
      let normalCount = 0;
      let lowCount = 0;
      let criticalCount = 0;
      let overstockedCount = 0;
      let overallThresholdCount = 0;
      let monthlyThresholdCount = 0;
      let noThresholdCount = 0;

      skuData.forEach(sku => {
        const classData = sku.class as ClassWithThresholds;
        const inventory = inventoryMap.get(sku.id) || 0;
        
        const thresholds = this.calculateThresholds(classData);
        
        // Count threshold types
        if (thresholds.source === 'monthly') {
          monthlyThresholdCount++;
        } else if (thresholds.is_configured) {
          overallThresholdCount++;
        } else {
          noThresholdCount++;
        }

        // Count status
        const statusInfo = this.calculateStatus(inventory, thresholds.min_threshold, thresholds.optimal_threshold);
        switch (statusInfo.status) {
          case 'Normal':
            normalCount++;
            break;
          case 'Low':
            lowCount++;
            break;
          case 'Critical':
            criticalCount++;
            break;
          case 'Overstocked':
            overstockedCount++;
            break;
        }
      });

      return {
        total_skus: skuData.length,
        normal_count: normalCount,
        low_count: lowCount,
        critical_count: criticalCount,
        overstocked_count: overstockedCount,
        overall_threshold_count: overallThresholdCount,
        monthly_threshold_count: monthlyThresholdCount,
        no_threshold_count: noThresholdCount
      };

    } catch (error) {
      console.error('Error in getMaterialPlanningStatistics:', error);
      throw error;
    }
  }

  /**
   * Get unique filter options
   */
  async getFilterOptions(): Promise<{
    classes: Array<{ id: string; name: string }>;
    brands: Array<{ id: string; name: string }>;
    categories: Array<{ id: string; name: string }>;
    vendors: Array<{ id: string; name: string; code: string }>;
  }> {
    try {
      const [classesResult, brandsResult, categoriesResult, vendorsResult] = await Promise.all([
        supabase.from('classes').select('id, name').eq('status', 'active').order('name'),
        supabase.from('brands').select('id, name').eq('status', 'active').order('name'),
        supabase.from('categories').select('id, name').eq('status', 'active').order('name'),
        supabase.from('vendors').select('id, name, code').eq('status', 'active').order('name')
      ]);

      return {
        classes: classesResult.data || [],
        brands: brandsResult.data || [],
        categories: categoriesResult.data || [],
        vendors: vendorsResult.data || []
      };
    } catch (error) {
      console.error('Error fetching filter options:', error);
      return { classes: [], brands: [], categories: [], vendors: [] };
    }
  }

  /**
   * Create a manual reorder PO for a specific SKU with selected vendor
   */
  async createManualReorder(skuId: string, vendorId: string): Promise<{ success: boolean; po_id?: string; error?: string }> {
    try {
      // Get the SKU data
      const { data: skuData, error: skuError } = await supabase
        .from('skus')
        .select(`
          id,
          sku_code,
          class_id,
          size_id,
          class:classes(
            stock_management_type,
            overall_min_stock,
            overall_max_stock,
            monthly_stock_levels
          )
        `)
        .eq('id', skuId)
        .single();

      if (skuError || !skuData) {
        return {
          success: false,
          error: 'SKU not found'
        };
      }

      // Get inventory data
      const { data: inventoryData } = await supabase
        .from('warehouse_inventory' as any)
        .select('total_quantity, reserved_quantity, available_quantity')
        .eq('sku_id', skuId);

      const inventory = inventoryData?.reduce((acc, inv) => ({
        total: acc.total + (inv.total_quantity || 0),
        reserved: acc.reserved + (inv.reserved_quantity || 0),
        available: acc.available + (inv.available_quantity || 0)
      }), { total: 0, reserved: 0, available: 0 }) || { total: 0, reserved: 0, available: 0 };

      // Calculate thresholds
      const classData = skuData.class as ClassWithThresholds;
      const thresholds = this.calculateThresholds(classData);

      // Create reorder request with the selected vendor
      const reorderRequest: ReorderRequest = {
        sku_id: skuData.id,
        sku_code: skuData.sku_code,
        class_id: skuData.class_id,
        size_id: skuData.size_id,
        current_inventory: inventory.available,
        min_threshold: thresholds.min_threshold,
        optimal_threshold: thresholds.optimal_threshold,
        preferred_vendor_id: vendorId,
        auto_reorder: false
      };

      // Create the PO
      return await materialPlanningPOService.createReorderPO(reorderRequest);

    } catch (error) {
      console.error('Error creating manual reorder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Process auto reorder for all eligible items
   */
  async processAutoReorder(): Promise<{
    success: boolean;
    processed_count: number;
    created_pos: string[];
    errors: string[];
  }> {
    try {
      // Get all items that might need reordering
      const items = await this.getMaterialPlanningData({
        status_filter: 'all',
        limit: 1000 // Get all items for auto reorder check
      });

      if (!items || items.items.length === 0) {
        return {
          success: true,
          processed_count: 0,
          created_pos: [],
          errors: []
        };
      }

      return await materialPlanningPOService.processAutoReorder(items.items);

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
   * Update auto reorder settings for a SKU
   */
  async updateAutoReorderSettings(
    skuId: string, 
    autoReorderEnabled: boolean, 
    preferredVendorId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        auto_reorder_enabled: autoReorderEnabled
      };

      if (preferredVendorId) {
        updateData.preferred_vendor_id = preferredVendorId;
      }

      const { error } = await supabase
        .from('skus')
        .update(updateData)
        .eq('id', skuId);

      if (error) {
        console.error('Error updating auto reorder settings:', error);
        return {
          success: false,
          error: `Failed to update auto reorder settings: ${error.message}`
        };
      }

      return {
        success: true
      };

    } catch (error) {
      console.error('Error updating auto reorder settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const materialPlanningService = new MaterialPlanningService();
