
-- Update app_assets table columns to use NUMERIC(10,2) for decimal values
ALTER TABLE public.app_assets 
  ALTER COLUMN dx TYPE NUMERIC(10,2),
  ALTER COLUMN dy TYPE NUMERIC(10,2),
  ALTER COLUMN mirror_dx TYPE NUMERIC(10,2),
  ALTER COLUMN asset_height_resp_to_box TYPE NUMERIC(10,2);
