
-- Drop and recreate the calculator column to fix type issues
ALTER TABLE public.base_products 
DROP COLUMN IF EXISTS calculator;

ALTER TABLE public.base_products 
ADD COLUMN calculator NUMERIC;

-- Add the missing foreign key relationship to size_groups
ALTER TABLE public.base_products 
ADD COLUMN IF NOT EXISTS size_group_id UUID REFERENCES public.size_groups(id);
