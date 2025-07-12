
-- Update profit_margins table to use numeric type for range fields
ALTER TABLE public.profit_margins 
  ALTER COLUMN min_range TYPE NUMERIC(10,2),
  ALTER COLUMN max_range TYPE NUMERIC(10,2);
