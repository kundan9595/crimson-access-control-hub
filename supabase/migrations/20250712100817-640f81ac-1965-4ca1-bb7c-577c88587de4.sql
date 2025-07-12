
-- Create a table for profit margins
CREATE TABLE public.profit_margins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  min_range INTEGER NOT NULL,
  max_range INTEGER NOT NULL,
  margin_percentage NUMERIC(5,2) NOT NULL,
  branding_print NUMERIC(5,2) NOT NULL,
  branding_embroidery NUMERIC(5,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Add Row Level Security (RLS)
ALTER TABLE public.profit_margins ENABLE ROW LEVEL SECURITY;

-- Create policy that allows admins to manage profit margins
CREATE POLICY "Admins can manage profit margins" 
  ON public.profit_margins 
  FOR ALL 
  USING (user_is_admin(auth.uid()));

-- Add triggers for created_by and updated_at
CREATE TRIGGER handle_profit_margins_created_by
  BEFORE INSERT ON public.profit_margins
  FOR EACH ROW EXECUTE FUNCTION handle_created_by();

CREATE TRIGGER handle_profit_margins_updated_at
  BEFORE UPDATE ON public.profit_margins
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
