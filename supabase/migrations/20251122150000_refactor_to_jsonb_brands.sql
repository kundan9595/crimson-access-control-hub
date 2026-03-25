-- Drop customer_brands table
DROP TABLE IF EXISTS customer_brands;

-- Add brand_ids JSONB column to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS brand_ids jsonb DEFAULT '[]'::jsonb;
