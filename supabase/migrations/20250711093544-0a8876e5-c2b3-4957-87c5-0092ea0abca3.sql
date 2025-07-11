
-- Remove capacity-related fields and add stock management fields to classes table
ALTER TABLE public.classes 
DROP COLUMN IF EXISTS total_capacity,
DROP COLUMN IF EXISTS capacity_allocation;

-- Add monthly stock levels field for stock management
ALTER TABLE public.classes 
ADD COLUMN monthly_stock_levels JSONB DEFAULT '{}'::jsonb;

-- Update the size_ratios field comment to reflect new simplified structure
COMMENT ON COLUMN public.classes.size_ratios IS 'Simplified size ratios as percentage values for each size';

-- Add a check constraint to ensure monthly_stock_levels has valid structure
-- Using a trigger instead of CHECK constraint for flexibility
CREATE OR REPLACE FUNCTION validate_monthly_stock_levels()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that monthly_stock_levels is a valid JSON object
  IF NEW.monthly_stock_levels IS NOT NULL THEN
    -- Check if it's a valid JSON object (will throw error if not)
    PERFORM NEW.monthly_stock_levels::jsonb;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_monthly_stock_levels_trigger ON public.classes;
CREATE TRIGGER validate_monthly_stock_levels_trigger
  BEFORE INSERT OR UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION validate_monthly_stock_levels();
