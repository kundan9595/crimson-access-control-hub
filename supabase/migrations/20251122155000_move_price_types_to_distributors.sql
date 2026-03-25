-- First, set price_type_id to NULL in tables that reference price_types
-- This allows us to delete the price types without violating foreign key constraints
UPDATE order_items SET price_type_id = NULL WHERE price_type_id IS NOT NULL;
UPDATE orders SET price_type_id = NULL WHERE price_type_id IS NOT NULL;
UPDATE customers SET price_type_id = NULL WHERE price_type_id IS NOT NULL;

-- Delete all existing price types as requested
DELETE FROM price_types;

-- Add distributor_id column to price_types table
ALTER TABLE price_types 
ADD COLUMN distributor_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE;

-- Add comment to document the change
COMMENT ON COLUMN price_types.distributor_id IS 
'References the distributor (customer with customer_type = distributor) that owns this price type. Price types are now distributor-specific.';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_price_types_distributor_id ON price_types(distributor_id);

