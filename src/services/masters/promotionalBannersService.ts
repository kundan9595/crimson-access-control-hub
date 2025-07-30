import { supabase } from '@/integrations/supabase/client';
import type { PromotionalBanner } from './types';

export type { PromotionalBanner };

export const promotionalBannersService = {
  async getAll(): Promise<PromotionalBanner[]> {
    console.log('📊 PromotionalBannersService - Fetching promotional banners');
    
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

    console.log('✅ PromotionalBannersService - Successfully fetched promotional banners:', data?.length || 0);
    return data as unknown as PromotionalBanner[];
  },

  async getById(id: string): Promise<PromotionalBanner | null> {
    console.log('📊 PromotionalBannersService - Fetching promotional banner by ID:', id);
    
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

    console.log('✅ PromotionalBannersService - Successfully fetched promotional banner:', (data as any)?.id);
    return data as unknown as PromotionalBanner;
  },

  async create(banner: Omit<PromotionalBanner, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'category' | 'brand' | 'class'>): Promise<PromotionalBanner> {
    console.log('📊 PromotionalBannersService - Creating promotional banner:', banner);
    
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

    console.log('✅ PromotionalBannersService - Successfully created promotional banner:', (data as any)?.id);
    return data as unknown as PromotionalBanner;
  },

  async update(id: string, updates: Partial<PromotionalBanner>): Promise<PromotionalBanner> {
    console.log('📊 PromotionalBannersService - Updating promotional banner:', id, updates);
    
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

    console.log('✅ PromotionalBannersService - Successfully updated promotional banner:', (data as any)?.id);
    return data as unknown as PromotionalBanner;
  },

  async delete(id: string): Promise<void> {
    console.log('📊 PromotionalBannersService - Deleting promotional banner:', id);
    
    const { error } = await supabase
      .from('promotional_banners' as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ PromotionalBannersService - Error deleting promotional banner:', error);
      throw error;
    }

    console.log('✅ PromotionalBannersService - Successfully deleted promotional banner');
  },

  async bulkCreate(banners: Omit<PromotionalBanner, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'category' | 'brand' | 'class'>[]): Promise<PromotionalBanner[]> {
    console.log('📊 PromotionalBannersService - Bulk creating promotional banners:', banners.length);
    
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

    console.log('✅ PromotionalBannersService - Successfully bulk created promotional banners:', data?.length || 0);
    return data as unknown as PromotionalBanner[];
  }
}; 