
-- Create app_assets table
CREATE TABLE public.app_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  dx INTEGER NOT NULL DEFAULT 0,
  dy INTEGER NOT NULL DEFAULT 0,
  mirror_dx INTEGER NOT NULL DEFAULT 0,
  asset_height_resp_to_box INTEGER NOT NULL DEFAULT 0,
  asset TEXT, -- image URL
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Add RLS policy for app assets
ALTER TABLE public.app_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage app assets" 
  ON public.app_assets 
  FOR ALL 
  USING (user_is_admin(auth.uid()));

-- Add triggers for created_by and updated_at
CREATE TRIGGER handle_app_assets_created_by
  BEFORE INSERT ON public.app_assets
  FOR EACH ROW EXECUTE PROCEDURE public.handle_created_by();

CREATE TRIGGER handle_app_assets_updated_at
  BEFORE UPDATE ON public.app_assets
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
