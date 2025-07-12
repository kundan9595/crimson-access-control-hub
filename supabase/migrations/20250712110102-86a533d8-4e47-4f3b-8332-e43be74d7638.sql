
-- First, let's add the missing foreign key relationship to size_groups
ALTER TABLE public.base_products 
ADD COLUMN size_group_id UUID REFERENCES public.size_groups(id);

-- Then, let's fix the calculator field type to match our TypeScript interface
ALTER TABLE public.base_products 
ALTER COLUMN calculator TYPE NUMERIC USING calculator::NUMERIC;
