
import { supabase } from '@/integrations/supabase/client';

export interface AppAsset {
  id: string;
  name: string;
  dx: number;
  dy: number;
  mirror_dx: number;
  asset_height_resp_to_box: number;
  asset?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export const getAppAssets = async (): Promise<AppAsset[]> => {
  console.log('📊 AppAssetsService - Fetching app assets');
  
  const { data, error } = await supabase
    .from('app_assets')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('❌ AppAssetsService - Error fetching app assets:', error);
    throw error;
  }
  
  console.log('✅ AppAssetsService - Successfully fetched app assets:', data?.length);
  return data || [];
};

export const createAppAsset = async (asset: Omit<AppAsset, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<AppAsset> => {
  console.log('📊 AppAssetsService - Creating app asset:', asset);
  
  const { data, error } = await supabase
    .from('app_assets')
    .insert([asset])
    .select()
    .single();
  
  if (error) {
    console.error('❌ AppAssetsService - Error creating app asset:', error);
    throw error;
  }
  
  console.log('✅ AppAssetsService - Successfully created app asset:', data);
  return data;
};

export const updateAppAsset = async (id: string, updates: Partial<Omit<AppAsset, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>): Promise<AppAsset> => {
  console.log('📊 AppAssetsService - Updating app asset:', { id, updates });
  
  const { data, error } = await supabase
    .from('app_assets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('❌ AppAssetsService - Error updating app asset:', error);
    throw error;
  }
  
  console.log('✅ AppAssetsService - Successfully updated app asset:', data);
  return data;
};

export const deleteAppAsset = async (id: string): Promise<void> => {
  console.log('📊 AppAssetsService - Deleting app asset:', id);
  
  const { error } = await supabase
    .from('app_assets')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('❌ AppAssetsService - Error deleting app asset:', error);
    throw error;
  }
  
  console.log('✅ AppAssetsService - Successfully deleted app asset');
};
