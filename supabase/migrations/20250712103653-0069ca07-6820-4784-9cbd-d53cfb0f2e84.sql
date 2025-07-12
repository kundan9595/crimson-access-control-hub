
-- Create base_products table with all required fields
CREATE TABLE public.base_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  calculator TEXT CHECK (calculator IN ('Knit', 'Woven')),
  category_id UUID REFERENCES public.categories(id),
  fabric_id UUID REFERENCES public.fabrics(id),
  parts JSONB DEFAULT '[]'::jsonb, -- Array of part IDs
  base_price NUMERIC DEFAULT 0,
  base_sn INTEGER,
  trims_cost NUMERIC DEFAULT 0,
  adult_consumption NUMERIC DEFAULT 0,
  kids_consumption NUMERIC DEFAULT 0,
  overhead_percentage NUMERIC DEFAULT 0,
  sample_rate NUMERIC DEFAULT 0,
  image_url TEXT,
  size_type TEXT CHECK (size_type IN ('Adult', 'Kids', 'Both')) DEFAULT 'Adult',
  branding_sides JSONB DEFAULT '[]'::jsonb, -- Array of branding side objects
  status TEXT DEFAULT 'active'::text CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS on base_products table
ALTER TABLE public.base_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for admins to manage base products
CREATE POLICY "Admins can manage base products" 
  ON public.base_products 
  FOR ALL 
  USING (user_is_admin(auth.uid()));

-- Create triggers for automatic timestamp and user tracking
CREATE TRIGGER handle_base_products_created_by
  BEFORE INSERT ON public.base_products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_by();

CREATE TRIGGER handle_base_products_updated_at
  BEFORE UPDATE ON public.base_products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
