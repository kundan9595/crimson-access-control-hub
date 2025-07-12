
-- Create fabrics table
CREATE TABLE public.fabrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  fabric_type TEXT NOT NULL CHECK (fabric_type IN ('Cotton', 'Poly Cotton', 'Polyester')),
  gsm INTEGER NOT NULL,
  uom TEXT NOT NULL CHECK (uom IN ('kg', 'meter')),
  price INTEGER NOT NULL,
  color_id UUID REFERENCES public.colors(id),
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.fabrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for admins to manage fabrics
CREATE POLICY "Admins can manage fabrics" 
  ON public.fabrics 
  FOR ALL 
  USING (user_is_admin(auth.uid()));

-- Add triggers for automatic timestamps and user tracking
CREATE TRIGGER handle_fabrics_created_by
  BEFORE INSERT ON public.fabrics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_by();

CREATE TRIGGER handle_fabrics_updated_at
  BEFORE UPDATE ON public.fabrics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
