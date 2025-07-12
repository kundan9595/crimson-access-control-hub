
-- Update the add_ons table to fix schema issues
-- 1. Remove the color_id column since we use colors JSONB field
ALTER TABLE public.add_ons DROP COLUMN IF EXISTS color_id;

-- 2. Change add_on_of and add_on_sn from text to numeric for money values
ALTER TABLE public.add_ons ALTER COLUMN add_on_of TYPE NUMERIC(10,2) USING CASE 
    WHEN add_on_of ~ '^[0-9]+\.?[0-9]*$' THEN add_on_of::NUMERIC(10,2) 
    ELSE NULL 
END;

ALTER TABLE public.add_ons ALTER COLUMN add_on_sn TYPE NUMERIC(10,2) USING CASE 
    WHEN add_on_sn ~ '^[0-9]+\.?[0-9]*$' THEN add_on_sn::NUMERIC(10,2) 
    ELSE NULL 
END;

-- Update comments to reflect the new field types
COMMENT ON COLUMN public.add_ons.add_on_of IS 'Add On OF field for pricing/money values';
COMMENT ON COLUMN public.add_ons.add_on_sn IS 'Add On SN field for pricing/money values';
