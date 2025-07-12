
-- Update the add_ons table to include all required fields
ALTER TABLE public.add_ons 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS add_on_of TEXT,
ADD COLUMN IF NOT EXISTS add_on_sn TEXT,
ADD COLUMN IF NOT EXISTS has_colour BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_name TEXT,
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb;

-- Create an index for better performance on sort_order
CREATE INDEX IF NOT EXISTS idx_add_ons_sort_order ON public.add_ons(sort_order);

-- Update the existing display_order column to be consistent with sort_order
UPDATE public.add_ons SET sort_order = display_order WHERE sort_order = 0;

-- Add a comment to clarify the purpose of the new columns
COMMENT ON COLUMN public.add_ons.add_on_of IS 'Add On OF field for categorization';
COMMENT ON COLUMN public.add_ons.add_on_sn IS 'Add On SN (Serial Number) field';
COMMENT ON COLUMN public.add_ons.has_colour IS 'Whether this add-on supports color variations';
COMMENT ON COLUMN public.add_ons.group_name IS 'Group name for organizing add-ons';
COMMENT ON COLUMN public.add_ons.colors IS 'Array of color options for this add-on';
