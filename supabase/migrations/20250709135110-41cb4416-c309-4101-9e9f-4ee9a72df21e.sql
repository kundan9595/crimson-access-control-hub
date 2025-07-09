
-- Update the styles table to match the simplified structure
-- First, add the brand_id and category_id columns
ALTER TABLE public.styles 
ADD COLUMN brand_id UUID REFERENCES public.brands(id),
ADD COLUMN category_id UUID REFERENCES public.categories(id);

-- Remove the columns we don't need for the simplified structure
ALTER TABLE public.styles 
DROP COLUMN IF EXISTS code,
DROP COLUMN IF EXISTS care_instructions,
DROP COLUMN IF EXISTS fabric_composition,
DROP COLUMN IF EXISTS gender,
DROP COLUMN IF EXISTS season,
DROP COLUMN IF EXISTS size_category,
DROP COLUMN IF EXISTS color_variants;
