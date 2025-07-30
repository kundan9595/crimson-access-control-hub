import { supabase } from '@/integrations/supabase/client';
import { PromotionalAsset } from './types';

export const promotionalAssetsService = {
  // Get all promotional assets
  async getAll(): Promise<PromotionalAsset[]> {
    // Note: Using promotional_assets table which exists in the database
    const { data, error } = await supabase
      .from('promotional_assets' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching promotional assets: ${error.message}`);
    }

    return (data || []) as unknown as PromotionalAsset[];
  },

  // Get promotional asset by ID
  async getById(id: string): Promise<PromotionalAsset> {
    const { data, error } = await supabase
      .from('promotional_assets' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching promotional asset: ${error.message}`);
    }

    return data as unknown as PromotionalAsset;
  },

  // Create new promotional asset
  async create(promotionalAsset: Omit<PromotionalAsset, 'id' | 'created_at' | 'updated_at'>): Promise<PromotionalAsset> {
    const { data, error } = await supabase
      .from('promotional_assets' as any)
      .insert([promotionalAsset])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating promotional asset: ${error.message}`);
    }

    return data as unknown as PromotionalAsset;
  },

  // Update promotional asset
  async update(id: string, promotionalAsset: Partial<PromotionalAsset>): Promise<PromotionalAsset> {
    const { data, error } = await supabase
      .from('promotional_assets' as any)
      .update(promotionalAsset)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating promotional asset: ${error.message}`);
    }

    return data as unknown as PromotionalAsset;
  },

  // Delete promotional asset
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('promotional_assets' as any)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting promotional asset: ${error.message}`);
    }
  },

  // Bulk create promotional assets
  async bulkCreate(promotionalAssets: Omit<PromotionalAsset, 'id' | 'created_at' | 'updated_at'>[]): Promise<PromotionalAsset[]> {
    const { data, error } = await supabase
      .from('promotional_assets' as any)
      .insert(promotionalAssets)
      .select();

    if (error) {
      throw new Error(`Error bulk creating promotional assets: ${error.message}`);
    }

    return (data || []) as unknown as PromotionalAsset[];
  }
};