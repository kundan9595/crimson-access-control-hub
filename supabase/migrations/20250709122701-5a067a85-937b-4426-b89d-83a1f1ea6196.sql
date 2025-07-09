
-- Remove unnecessary columns from price_types table
ALTER TABLE public.price_types DROP COLUMN IF EXISTS code;
ALTER TABLE public.price_types DROP COLUMN IF EXISTS multiplier;
ALTER TABLE public.price_types DROP COLUMN IF EXISTS is_default;

-- Remove the unique constraint on code since we're dropping the column
DROP INDEX IF EXISTS idx_price_types_code;
