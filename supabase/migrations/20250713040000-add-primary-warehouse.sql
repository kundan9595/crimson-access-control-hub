-- Add is_primary field to warehouses table
ALTER TABLE public.warehouses 
ADD COLUMN is_primary BOOLEAN DEFAULT false;

-- Create a unique constraint to ensure only one primary warehouse
-- We'll use a partial index that only applies when is_primary is true
CREATE UNIQUE INDEX idx_warehouses_primary_unique 
ON public.warehouses (is_primary) 
WHERE is_primary = true;

-- Create a function to ensure only one warehouse can be primary
CREATE OR REPLACE FUNCTION public.ensure_single_primary_warehouse()
RETURNS TRIGGER AS $$
BEGIN
  -- If we're setting a warehouse as primary, unset all others
  IF NEW.is_primary = true THEN
    UPDATE public.warehouses 
    SET is_primary = false 
    WHERE id != NEW.id AND is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically manage primary warehouse
CREATE TRIGGER trigger_ensure_single_primary_warehouse
  BEFORE INSERT OR UPDATE ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_primary_warehouse();

-- Add RLS policy for primary warehouse management
CREATE POLICY "Users can manage primary warehouse status" ON public.warehouses
  FOR UPDATE USING (user_is_admin(auth.uid())); 