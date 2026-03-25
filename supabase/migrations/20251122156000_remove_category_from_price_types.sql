-- Remove category column from price_types table
ALTER TABLE price_types DROP COLUMN IF EXISTS category;

-- Note: The price_type_category enum type will remain in the database but unused
-- We can optionally drop it later if it's not used elsewhere

