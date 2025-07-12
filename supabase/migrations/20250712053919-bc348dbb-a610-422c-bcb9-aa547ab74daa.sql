
-- Update the price_type_category enum to use the new values
ALTER TYPE price_type_category RENAME TO price_type_category_old;

CREATE TYPE price_type_category AS ENUM ('zone', 'customer');

-- Update the price_types table to use the new enum
ALTER TABLE price_types 
  ALTER COLUMN category DROP DEFAULT,
  ALTER COLUMN category TYPE price_type_category USING 
    CASE 
      WHEN category::text = 'retail' THEN 'customer'::price_type_category
      WHEN category::text = 'wholesale' THEN 'zone'::price_type_category  
      WHEN category::text = 'distributor' THEN 'zone'::price_type_category
      WHEN category::text = 'special' THEN 'customer'::price_type_category
      ELSE 'customer'::price_type_category
    END,
  ALTER COLUMN category SET DEFAULT 'customer'::price_type_category;

-- Drop the old enum type
DROP TYPE price_type_category_old;
