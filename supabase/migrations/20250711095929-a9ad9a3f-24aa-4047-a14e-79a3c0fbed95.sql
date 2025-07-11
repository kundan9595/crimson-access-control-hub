
-- Update the classes table to support the new stock management structure
ALTER TABLE public.classes 
ADD COLUMN stock_management_type text DEFAULT 'overall',
ADD COLUMN overall_min_stock integer DEFAULT 0,
ADD COLUMN overall_max_stock integer DEFAULT 0;

-- Add a check constraint to ensure valid stock management types
ALTER TABLE public.classes 
ADD CONSTRAINT valid_stock_management_type 
CHECK (stock_management_type IN ('overall', 'monthly'));

-- Update the existing monthly_stock_levels column comment to reflect new structure
COMMENT ON COLUMN public.classes.monthly_stock_levels IS 'Monthly stock levels for the class (not size-specific). Structure: {"1": {"minStock": 10, "maxStock": 50}, "2": {"minStock": 15, "maxStock": 60}, ...} where keys are month numbers 1-12';

-- Update the size_ratios column comment to reflect simplified ratios
COMMENT ON COLUMN public.classes.size_ratios IS 'Simple size ratios (not percentages). Structure: {"size_id_1": 1, "size_id_2": 2, "size_id_3": 3, ...} where values are simple ratio numbers';
