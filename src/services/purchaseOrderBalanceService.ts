import { supabase } from '@/integrations/supabase/client';

export interface BalanceViewData {
  class_id: string;
  class_name: string;
  size_id: string;
  size_name: string;
  size_code: string;
  total_quantity: number | string; // Can be BIGINT from database
  vendor_breakdown: VendorBreakdown[];
}

export interface VendorBreakdown {
  vendor_id: string;
  vendor_name: string;
  vendor_code: string;
  quantity: number;
  percentage: number;
}

export interface ProcessedBalanceViewData {
  classes: string[];
  sizes: string[];
  data: {
    [classId: string]: {
      [sizeId: string]: {
        quantity: number;
        vendors: VendorBreakdown[];
      };
    };
  };
  classIdToName: { [classId: string]: string };
  sizeIdToName: { [sizeId: string]: string };
}

class PurchaseOrderBalanceService {
  // Fetch raw balance view data from database
  async getBalanceViewData(): Promise<BalanceViewData[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_purchase_order_balance_view');

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching balance view data:', error);
      throw new Error('Failed to fetch balance view data');
    }
  }

  // Process raw data into format suitable for the table
  processBalanceViewData(rawData: BalanceViewData[]): ProcessedBalanceViewData {
    const classes = new Set<string>();
    const sizes = new Set<string>();
    const data: { [classId: string]: { [sizeId: string]: { quantity: number; vendors: VendorBreakdown[] } } } = {};

    // Process raw data
    rawData.forEach(item => {
      classes.add(item.class_name);
      sizes.add(item.size_name);
      
      if (!data[item.class_id]) {
        data[item.class_id] = {};
      }
      
      data[item.class_id][item.size_id] = {
        quantity: typeof item.total_quantity === 'string' ? parseInt(item.total_quantity) : item.total_quantity,
        vendors: item.vendor_breakdown
      };
    });

    // Create a mapping for easier lookup
    const classIdToName: { [classId: string]: string } = {};
    const sizeIdToName: { [sizeId: string]: string } = {};
    
    rawData.forEach(item => {
      classIdToName[item.class_id] = item.class_name;
      sizeIdToName[item.size_id] = item.size_name;
    });

    // Filter out sizes and classes that have no data (all quantities are 0)
    const sizesWithData = new Set<string>();
    const classesWithData = new Set<string>();
    
    rawData.forEach(item => {
      const quantity = typeof item.total_quantity === 'string' ? parseInt(item.total_quantity) : item.total_quantity;
      if (quantity > 0) {
        sizesWithData.add(item.size_name);
        classesWithData.add(item.class_name);
      }
    });

    return {
      classes: Array.from(classesWithData).sort(),
      sizes: Array.from(sizesWithData).sort((a, b) => {
        // Sort sizes logically (numeric first, then alphabetical)
        const aNum = parseInt(a);
        const bNum = parseInt(b);
        if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
        if (!isNaN(aNum)) return -1;
        if (!isNaN(bNum)) return 1;
        return a.localeCompare(b);
      }),
      data,
      classIdToName,
      sizeIdToName
    };
  }

  // Get balance view data with processing
  async getProcessedBalanceViewData(): Promise<ProcessedBalanceViewData> {
    const rawData = await this.getBalanceViewData();
    return this.processBalanceViewData(rawData);
  }

  // Get vendor summary for a specific class and size
  getVendorSummary(vendors: VendorBreakdown[]): string {
    if (!vendors || vendors.length === 0) return '';
    
    return vendors
      .map(vendor => `${vendor.vendor_name}: ${vendor.quantity} (${vendor.percentage}%)`)
      .join(' ');
  }

  // Get vendor badges for display
  getVendorBadges(vendors: VendorBreakdown[]) {
    if (!vendors || vendors.length === 0) return [];
    
    // Aggregate vendors by name to avoid duplicates
    const vendorMap = new Map<string, { quantity: number; percentage: number }>();
    
    vendors.forEach(vendor => {
      if (vendorMap.has(vendor.vendor_name)) {
        const existing = vendorMap.get(vendor.vendor_name)!;
        vendorMap.set(vendor.vendor_name, {
          quantity: existing.quantity + vendor.quantity,
          percentage: Math.round((existing.quantity + vendor.quantity) / vendors.reduce((sum, v) => sum + v.quantity, 0) * 100 * 10) / 10
        });
      } else {
        vendorMap.set(vendor.vendor_name, {
          quantity: vendor.quantity,
          percentage: vendor.percentage
        });
      }
    });
    
    return Array.from(vendorMap.entries()).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      percentage: data.percentage,
      variant: data.percentage > 50 ? 'secondary' : 'outline' as const
    }));
  }
}

export const purchaseOrderBalanceService = new PurchaseOrderBalanceService();
export default purchaseOrderBalanceService;
