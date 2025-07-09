
-- Add the missing columns to the classes table
ALTER TABLE public.classes 
ADD COLUMN size_group_id UUID REFERENCES public.size_groups(id),
ADD COLUMN selected_sizes JSONB DEFAULT '[]'::jsonb;

-- Create indexes for better performance
CREATE INDEX idx_classes_size_group_id ON public.classes(size_group_id);
