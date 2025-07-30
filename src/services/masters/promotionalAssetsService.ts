import { supabase } from '@/integrations/supabase/client';
import { PromotionalAsset } from './types';

export const promotionalAssetsService = {
  // Get all promotional assets
  async getAll(): Promise<PromotionalAsset[]> {
    const { data, error } = await supabase
      .from('promotional_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching promotional assets: ${error.message}`);
    }

    return data as PromotionalAsset[];
  },

  // Get promotional asset by ID
  async getById(id: string): Promise<PromotionalAsset> {
    const { data, error } = await supabase
      .from('promotional_assets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching promotional asset: ${error.message}`);
    }

    return data as PromotionalAsset;
  },

  // Create new promotional asset
  async create(promotionalAsset: Omit<PromotionalAsset, 'id' | 'created_at' | 'updated_at'>): Promise<PromotionalAsset> {
    const { data, error } = await supabase
      .from('promotional_assets')
      .insert([promotionalAsset])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating promotional asset: ${error.message}`);
    }

    return data as PromotionalAsset;
  },

  // Update promotional asset
  async update(id: string, promotionalAsset: Partial<PromotionalAsset>): Promise<PromotionalAsset> {
    const { data, error } = await supabase
      .from('promotional_assets')
      .update(promotionalAsset)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating promotional asset: ${error.message}`);
    }

    return data as PromotionalAsset;
  },

  // Delete promotional asset
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('promotional_assets')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting promotional asset: ${error.message}`);
    }
  },

  // Bulk create promotional assets
  async bulkCreate(promotionalAssets: Omit<PromotionalAsset, 'id' | 'created_at' | 'updated_at'>[]): Promise<PromotionalAsset[]> {
    const { data, error } = await supabase
      .from('promotional_assets')
      .insert(promotionalAssets)
      .select();

    if (error) {
      throw new Error(`Error bulk creating promotional assets: ${error.message}`);
    }

    return data as PromotionalAsset[];
  }
}; 