import { supabase } from '@/integrations/supabase/client';
import type { PromotionalBanner } from './types';

export type { PromotionalBanner };

export const promotionalBannersService = {
  async getAll(): Promise<PromotionalBanner[]> {
    // PromotionalBannersService - Fetching promotional banners
    
    const { data, error } = await supabase
      .from('promotional_banners' as any)
      .select(`
        *,
        category:categories(id, name),
        brand:brands(id, name),
        class:classes(id, name)
      `)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ PromotionalBannersService - Error fetching promotional banners:', error);
      throw error;
    }

          // PromotionalBannersService - Successfully fetched promotional banners
    return data as unknown as PromotionalBanner[];
  },

  async getById(id: string): Promise<PromotionalBanner | null> {
          // PromotionalBannersService - Fetching promotional banner by ID
    
    const { data, error } = await supabase
      .from('promotional_banners' as any)
      .select(`
        *,
        category:categories(id, name),
        brand:brands(id, name),
        class:classes(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ PromotionalBannersService - Error fetching promotional banner:', error);
      throw error;
    }

          // PromotionalBannersService - Successfully fetched promotional banner
    return data as unknown as PromotionalBanner;
  },

  async create(banner: Omit<PromotionalBanner, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'category' | 'brand' | 'class'>): Promise<PromotionalBanner> {
          // PromotionalBannersService - Creating promotional banner
    
    const { data, error } = await supabase
      .from('promotional_banners' as any)
      .insert([banner] as any)
      .select(`
        *,
        category:categories(id, name),
        brand:brands(id, name),
        class:classes(id, name)
      `)
      .single();

    if (error) {
      console.error('❌ PromotionalBannersService - Error creating promotional banner:', error);
      throw error;
    }

          // PromotionalBannersService - Successfully created promotional banner
    return data as unknown as PromotionalBanner;
  },

  async update(id: string, updates: Partial<PromotionalBanner>): Promise<PromotionalBanner> {
          // PromotionalBannersService - Updating promotional banner
    
    const { data, error } = await supabase
      .from('promotional_banners' as any)
      .update(updates as any)
      .eq('id', id)
      .select(`
        *,
        category:categories(id, name),
        brand:brands(id, name),
        class:classes(id, name)
      `)
      .single();

    if (error) {
      console.error('❌ PromotionalBannersService - Error updating promotional banner:', error);
      throw error;
    }

          // PromotionalBannersService - Successfully updated promotional banner
    return data as unknown as PromotionalBanner;
  },

  async delete(id: string): Promise<void> {
          // PromotionalBannersService - Deleting promotional banner
    
    const { error } = await supabase
      .from('promotional_banners' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ PromotionalBannersService - Error deleting promotional banner:', error);
      throw error;
    }

          // PromotionalBannersService - Successfully deleted promotional banner
  },

  async bulkCreate(banners: Omit<PromotionalBanner, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'category' | 'brand' | 'class'>[]): Promise<PromotionalBanner[]> {
          // PromotionalBannersService - Bulk creating promotional banners
    
    const { data, error } = await supabase
      .from('promotional_banners' as any)
      .insert(banners as any)
      .select(`
        *,
        category:categories(id, name),
        brand:brands(id, name),
        class:classes(id, name)
      `);

    if (error) {
      console.error('❌ PromotionalBannersService - Error bulk creating promotional banners:', error);
      throw error;
    }

          // PromotionalBannersService - Successfully bulk created promotional banners
    return data as unknown as PromotionalBanner[];
  }
}; 