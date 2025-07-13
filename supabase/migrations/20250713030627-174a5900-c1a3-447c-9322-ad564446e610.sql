
-- Add the missing base_icon_url column to base_products table
ALTER TABLE public.base_products 
ADD COLUMN base_icon_url TEXT;

-- Change base_sn from integer to decimal (numeric)
ALTER TABLE public.base_products 
ALTER COLUMN base_sn TYPE NUMERIC;
