
-- Create simplified styles table with brand and category relationships
CREATE TABLE public.styles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  brand_id UUID REFERENCES public.brands(id),
  category_id UUID REFERENCES public.categories(id),
  status TEXT NOT NULL DEFAULT 'active'::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for admins to manage styles
CREATE POLICY "Admins can manage styles" 
ON public.styles 
FOR ALL 
USING (user_is_admin(auth.uid()));

-- Add triggers for automatic timestamp and user tracking
CREATE TRIGGER handle_styles_updated_at 
BEFORE UPDATE ON public.styles 
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_styles_created_by 
BEFORE INSERT ON public.styles 
FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();
