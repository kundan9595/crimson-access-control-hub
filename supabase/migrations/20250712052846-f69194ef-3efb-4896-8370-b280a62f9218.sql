
-- Remove the code and description columns from the zones table
ALTER TABLE public.zones 
DROP COLUMN IF EXISTS code,
DROP COLUMN IF EXISTS description;
