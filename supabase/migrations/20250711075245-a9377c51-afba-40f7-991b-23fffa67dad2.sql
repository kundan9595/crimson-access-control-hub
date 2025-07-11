
-- Fix the database trigger for folder path updates
-- The trigger should handle both INSERT and UPDATE operations properly

-- First, let's improve the update_folder_path function to handle edge cases
CREATE OR REPLACE FUNCTION public.update_folder_path()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle the case where parent_id is NULL (root folder)
  IF NEW.parent_id IS NULL THEN
    NEW.path = NEW.name;
  ELSE
    -- Get the parent folder's path and append the current folder name
    SELECT COALESCE(path, '') || '/' || NEW.name INTO NEW.path
    FROM public.media_folders
    WHERE id = NEW.parent_id;
    
    -- If parent folder doesn't exist, treat as root folder
    IF NEW.path IS NULL THEN
      NEW.path = NEW.name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS media_folders_update_path ON public.media_folders;
CREATE TRIGGER media_folders_update_path
  BEFORE INSERT OR UPDATE ON public.media_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_folder_path();

-- Update storage bucket to allow more file types (including video)
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'image/webp', 
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
],
file_size_limit = 52428800  -- 50MB limit
WHERE id = 'master-images';

-- Add indexes for better performance on media queries
CREATE INDEX IF NOT EXISTS idx_media_folders_status ON public.media_folders(status);
CREATE INDEX IF NOT EXISTS idx_media_items_status ON public.media_items(status);
CREATE INDEX IF NOT EXISTS idx_media_items_mime_type ON public.media_items(mime_type);
