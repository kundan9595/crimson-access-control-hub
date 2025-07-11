
-- Create media_folders table
CREATE TABLE public.media_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.media_folders(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create media_items table
CREATE TABLE public.media_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id UUID REFERENCES public.media_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_media_folders_parent_id ON public.media_folders(parent_id);
CREATE INDEX idx_media_folders_path ON public.media_folders(path);
CREATE INDEX idx_media_items_folder_id ON public.media_items(folder_id);
CREATE INDEX idx_media_items_tags ON public.media_items USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for media_folders
CREATE POLICY "Admins can manage media folders" ON public.media_folders
  FOR ALL USING (user_is_admin(auth.uid()));

-- Create RLS policies for media_items  
CREATE POLICY "Admins can manage media items" ON public.media_items
  FOR ALL USING (user_is_admin(auth.uid()));

-- Create triggers for media_folders
CREATE TRIGGER media_folders_updated_at
  BEFORE UPDATE ON public.media_folders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER media_folders_created_by
  BEFORE INSERT ON public.media_folders
  FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

-- Create triggers for media_items
CREATE TRIGGER media_items_updated_at
  BEFORE UPDATE ON public.media_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER media_items_created_by
  BEFORE INSERT ON public.media_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

-- Create a function to update folder paths when parent changes
CREATE OR REPLACE FUNCTION public.update_folder_path()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.path = NEW.name;
  ELSE
    SELECT path || '/' || NEW.name INTO NEW.path
    FROM public.media_folders
    WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update folder paths
CREATE TRIGGER media_folders_update_path
  BEFORE INSERT OR UPDATE ON public.media_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_folder_path();
