-- First, drop the existing check constraint
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_customer_type_check;

-- Add new check constraint with 'retail' and 'distributor' types
ALTER TABLE customers ADD CONSTRAINT customers_customer_type_check 
CHECK (customer_type IN ('retail', 'distributor'));
