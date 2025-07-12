
-- Remove description and display_order columns from add_ons table
ALTER TABLE public.add_ons DROP COLUMN IF EXISTS description;
ALTER TABLE public.add_ons DROP COLUMN IF EXISTS display_order;
