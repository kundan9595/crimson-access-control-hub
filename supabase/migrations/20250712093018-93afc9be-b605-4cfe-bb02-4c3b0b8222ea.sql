
-- Create parts table
CREATE TABLE public.parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  selected_add_ons JSONB DEFAULT '[]'::jsonb,
  selected_colors JSONB DEFAULT '[]'::jsonb,
  order_criteria BOOLEAN DEFAULT false,
  sort_position INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for admins
CREATE POLICY "Admins can manage parts" 
  ON public.parts 
  FOR ALL 
  USING (user_is_admin(auth.uid()));

-- Add triggers for automatic timestamps and user tracking
CREATE TRIGGER handle_parts_updated_at 
  BEFORE UPDATE ON public.parts 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_parts_created_by 
  BEFORE INSERT ON public.parts 
  FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();
