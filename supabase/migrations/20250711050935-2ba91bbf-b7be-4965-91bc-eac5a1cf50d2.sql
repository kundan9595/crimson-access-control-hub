
-- Create the SKUs table
CREATE TABLE public.skus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku_code TEXT NOT NULL UNIQUE,
  class_id UUID REFERENCES public.classes(id) NOT NULL,
  size_id UUID REFERENCES public.sizes(id) NOT NULL,
  hsn_code TEXT,
  description TEXT,
  length_cm DECIMAL(10,2),
  breadth_cm DECIMAL(10,2),
  height_cm DECIMAL(10,2),
  weight_grams DECIMAL(10,2),
  base_mrp DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  price_type_prices JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.skus ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for admins
CREATE POLICY "Admins can manage skus" 
ON public.skus 
FOR ALL 
USING (user_is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_skus_class_id ON public.skus(class_id);
CREATE INDEX idx_skus_size_id ON public.skus(size_id);
CREATE INDEX idx_skus_status ON public.skus(status);
CREATE INDEX idx_skus_sku_code ON public.skus(sku_code);

-- Add triggers for automatic timestamp and user tracking
CREATE TRIGGER handle_skus_updated_at
  BEFORE UPDATE ON public.skus
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_skus_created_by
  BEFORE INSERT ON public.skus
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_by();
