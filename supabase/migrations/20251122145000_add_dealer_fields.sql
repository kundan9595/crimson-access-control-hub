-- Add customer_type to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type text DEFAULT 'customer';
-- Add zone_id to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zone_id uuid REFERENCES zones(id);

-- Create customer_brands table
CREATE TABLE IF NOT EXISTS customer_brands (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
    brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(customer_id, brand_id)
);

-- Add RLS policies
ALTER TABLE customer_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON customer_brands FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON customer_brands FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON customer_brands FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON customer_brands FOR DELETE USING (auth.role() = 'authenticated');
