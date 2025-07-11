
-- Add capacity management and size ratio fields to the classes table
ALTER TABLE public.classes 
ADD COLUMN total_capacity INTEGER DEFAULT NULL,
ADD COLUMN size_ratios JSONB DEFAULT '{}'::jsonb,
ADD COLUMN capacity_allocation JSONB DEFAULT '{}'::jsonb;

-- Add comments to document the new fields
COMMENT ON COLUMN public.classes.total_capacity IS 'Total production capacity for this class';
COMMENT ON COLUMN public.classes.size_ratios IS 'JSON object defining size distribution ratios (e.g., {"S": 20, "M": 40, "L": 30, "XL": 10})';
COMMENT ON COLUMN public.classes.capacity_allocation IS 'JSON object with calculated capacity allocation per size based on ratios and total capacity';
