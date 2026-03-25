-- Create enum type for customer_type
CREATE TYPE customer_type_enum AS ENUM ('retail', 'distributor');

-- Convert any existing 'customer' or 'wholesale' values to 'retail'
-- This handles the case where the old default was 'customer' or 'wholesale'
UPDATE customers 
SET customer_type = 'retail' 
WHERE customer_type IN ('customer', 'wholesale') OR customer_type IS NULL;

-- Ensure all values are valid before converting
-- Convert any invalid values to 'retail' as a fallback
UPDATE customers 
SET customer_type = 'retail' 
WHERE customer_type IS NOT NULL 
  AND customer_type NOT IN ('retail', 'distributor');

-- Drop the existing check constraint (we'll replace it with the enum)
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_customer_type_check;

-- Drop the existing default (if any) before converting
ALTER TABLE customers 
  ALTER COLUMN customer_type DROP DEFAULT;

-- Alter the column to use the enum type
ALTER TABLE customers 
  ALTER COLUMN customer_type TYPE customer_type_enum 
  USING customer_type::customer_type_enum;

-- Set a default value (cast to enum type)
ALTER TABLE customers 
  ALTER COLUMN customer_type SET DEFAULT 'retail'::customer_type_enum;

