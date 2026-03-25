-- Add is_owner_distributor column to customers table
-- This field should only be set directly in the database, not through the UI
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS is_owner_distributor boolean DEFAULT false NOT NULL;

-- Add a comment to document that this field should only be modified in the database
COMMENT ON COLUMN customers.is_owner_distributor IS 
'Indicates if this distributor is the owner distributor. Only one distributor can be the owner. This field should only be modified directly in the database.';

-- Create a unique partial index to ensure only one distributor can be the owner
-- This constraint will prevent setting a second distributor as owner if one already exists
CREATE UNIQUE INDEX IF NOT EXISTS unique_owner_distributor 
ON customers (is_owner_distributor) 
WHERE is_owner_distributor = true AND customer_type = 'distributor';

-- Add a check constraint to ensure only distributors can be owner distributors
ALTER TABLE customers 
ADD CONSTRAINT check_owner_distributor_only_for_distributors 
CHECK (
  (is_owner_distributor = true AND customer_type = 'distributor') 
  OR 
  is_owner_distributor = false
);

