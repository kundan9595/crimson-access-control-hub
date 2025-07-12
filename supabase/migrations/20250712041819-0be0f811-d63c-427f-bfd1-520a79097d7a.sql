
-- Add sort_order column to styles table
ALTER TABLE public.styles 
ADD COLUMN sort_order integer DEFAULT 0;

-- Update existing styles to have sequential sort_order values
UPDATE public.styles 
SET sort_order = ROW_NUMBER() OVER (ORDER BY created_at)
WHERE sort_order IS NULL OR sort_order = 0;
