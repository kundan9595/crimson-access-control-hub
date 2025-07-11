
import { supabase } from '@/integrations/supabase/client';

export interface MediaFolder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  path: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface MediaItem {
  id: string;
  folder_id?: string;
  name: string;
  original_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  alt_text?: string;
  tags?: string[];
  status: 'active' | 'inactive';
  usage_count?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateMediaFolderData {
  name: string;
  description?: string;
  parent_id?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateMediaFolderData {
  name?: string;
  description?: string;
  parent_id?: string;
  status?: 'active' | 'inactive';
}

export interface CreateMediaItemData {
  folder_id?: string;
  name: string;
  original_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  alt_text?: string;
  tags?: string[];
  status?: 'active' | 'inactive';
}

export interface UpdateMediaItemData {
  folder_id?: string;
  name?: string;
  alt_text?: string;
  tags?: string[];
  status?: 'active' | 'inactive';
}

// Media Folders Service
export const mediaFolderService = {
  async getAll(): Promise<MediaFolder[]> {
    const { data, error } = await supabase
      .from('media_folders')
      .select('*')
      .order('path');

    if (error) throw error;
    return data as MediaFolder[];
  },

  async getById(id: string): Promise<MediaFolder | null> {
    const { data, error } = await supabase
      .from('media_folders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as MediaFolder | null;
  },

  async create(folderData: CreateMediaFolderData): Promise<MediaFolder> {
    // Create the folder data with a temporary path that will be updated by the trigger
    const insertData = {
      ...folderData,
      path: folderData.name // Temporary path, will be updated by the trigger
    };

    const { data, error } = await supabase
      .from('media_folders')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    return data as MediaFolder;
  },

  async update(id: string, updates: UpdateMediaFolderData): Promise<MediaFolder> {
    const { data, error } = await supabase
      .from('media_folders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as MediaFolder;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('media_folders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getSubfolders(parentId?: string): Promise<MediaFolder[]> {
    let query = supabase
      .from('media_folders')
      .select('*')
      .order('name');

    if (parentId) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as MediaFolder[];
  },
};

// Media Items Service
export const mediaItemService = {
  async getAll(): Promise<MediaItem[]> {
    const { data, error } = await supabase
      .from('media_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as MediaItem[];
  },

  async getById(id: string): Promise<MediaItem | null> {
    const { data, error } = await supabase
      .from('media_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as MediaItem | null;
  },

  async getByFolder(folderId?: string): Promise<MediaItem[]> {
    let query = supabase
      .from('media_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (folderId) {
      query = query.eq('folder_id', folderId);
    } else {
      query = query.is('folder_id', null);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as MediaItem[];
  },

  async create(itemData: CreateMediaItemData): Promise<MediaItem> {
    const { data, error } = await supabase
      .from('media_items')
      .insert([itemData])
      .select()
      .single();

    if (error) throw error;
    return data as MediaItem;
  },

  async update(id: string, updates: UpdateMediaItemData): Promise<MediaItem> {
    const { data, error } = await supabase
      .from('media_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as MediaItem;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('media_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async incrementUsageCount(id: string): Promise<void> {
    // First get the current usage count, then increment it
    const { data: currentItem, error: fetchError } = await supabase
      .from('media_items')
      .select('usage_count')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const newCount = (currentItem?.usage_count || 0) + 1;

    const { error } = await supabase
      .from('media_items')
      .update({ usage_count: newCount })
      .eq('id', id);
    
    if (error) throw error;
  },
};

// File Upload Service
export const mediaUploadService = {
  async uploadFile(file: File, folder?: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from('master-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('master-images')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  },

  async deleteFile(url: string): Promise<void> {
    const path = url.split('/').pop();
    if (!path) return;

    const { error } = await supabase.storage
      .from('master-images')
      .remove([path]);

    if (error) throw error;
  },
};
