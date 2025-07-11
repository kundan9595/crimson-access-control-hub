
-- Add image_url column to categories table
ALTER TABLE public.categories ADD COLUMN image_url TEXT;

-- Add sort_order column to categories table  
ALTER TABLE public.categories ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Add sort_order column to brands table
ALTER TABLE public.brands ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Add sort_order column to classes table
ALTER TABLE public.classes ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Rename tax_percentage to gst_rate in classes table
ALTER TABLE public.classes RENAME COLUMN tax_percentage TO gst_rate;

-- Create enum type for price type categories
CREATE TYPE price_type_category AS ENUM ('retail', 'wholesale', 'distributor', 'special');

-- Add category column to price_types table
ALTER TABLE public.price_types ADD COLUMN category price_type_category DEFAULT 'retail';

-- Rename payment_terms to credit_terms in vendors table
ALTER TABLE public.vendors RENAME COLUMN payment_terms TO credit_terms;

-- Add gst_rate column to skus table
ALTER TABLE public.skus ADD COLUMN gst_rate NUMERIC DEFAULT 0;

-- Add unique constraint to prevent duplicate state-city combinations in zone_locations
ALTER TABLE public.zone_locations ADD CONSTRAINT unique_zone_state_city UNIQUE (zone_id, state, city);
