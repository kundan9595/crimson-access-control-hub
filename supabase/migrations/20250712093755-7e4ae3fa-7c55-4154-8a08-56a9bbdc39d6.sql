
-- Remove the description column from the parts table
ALTER TABLE public.parts DROP COLUMN IF EXISTS description;
