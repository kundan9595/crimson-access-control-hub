
-- Create the add_ons table with options stored as JSON
CREATE TABLE public.add_ons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  select_type TEXT NOT NULL CHECK (select_type IN ('single', 'multiple', 'checked')),
  options JSONB DEFAULT '[]'::jsonb, -- Store options as JSON array
  display_order INTEGER DEFAULT 0,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Add RLS policies for add_ons table
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage add ons" 
  ON public.add_ons 
  FOR ALL 
  USING (user_is_admin(auth.uid()));

-- Add triggers for automatic timestamp and user tracking
CREATE TRIGGER handle_add_ons_created_by
  BEFORE INSERT ON public.add_ons
  FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

CREATE TRIGGER handle_add_ons_updated_at
  BEFORE UPDATE ON public.add_ons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_add_ons_status ON public.add_ons(status);
CREATE INDEX idx_add_ons_display_order ON public.add_ons(display_order);
CREATE INDEX idx_add_ons_options ON public.add_ons USING GIN (options);
