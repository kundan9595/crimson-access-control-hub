-- Create a function to check if distributors in the same zone share brands
-- This will be used in a trigger to prevent duplicate brand assignments

CREATE OR REPLACE FUNCTION check_distributor_brand_uniqueness_per_zone()
RETURNS TRIGGER AS $$
DECLARE
  conflicting_distributor RECORD;
  brand_id UUID;
BEGIN
  -- Only check for distributors
  IF NEW.customer_type != 'distributor' OR NEW.zone_id IS NULL OR NEW.brand_ids IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check each brand in the new/updated distributor's brand_ids
  FOR brand_id IN SELECT jsonb_array_elements_text(NEW.brand_ids::jsonb)::uuid
  LOOP
    -- Find any other distributor in the same zone that has this brand
    SELECT id, company_name INTO conflicting_distributor
    FROM customers
    WHERE customer_type = 'distributor'
      AND zone_id = NEW.zone_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND brand_ids IS NOT NULL
      AND brand_ids::jsonb ? brand_id::text;
    
    -- If we found a conflict, raise an error
    IF FOUND THEN
      RAISE EXCEPTION 'Distributor "%" in the same zone already has brand "%". Distributors in the same zone cannot share brands.',
        conflicting_distributor.company_name,
        (SELECT name FROM brands WHERE id = brand_id);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check before insert or update
DROP TRIGGER IF EXISTS check_distributor_brand_uniqueness_trigger ON customers;
CREATE TRIGGER check_distributor_brand_uniqueness_trigger
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION check_distributor_brand_uniqueness_per_zone();

