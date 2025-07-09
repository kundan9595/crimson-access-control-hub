
-- Create the classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  style_id UUID REFERENCES public.styles(id),
  color_id UUID REFERENCES public.colors(id),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  tax_percentage DECIMAL(5,2) DEFAULT 0 CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
  primary_image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for admins
CREATE POLICY "Admins can manage classes" 
ON public.classes 
FOR ALL 
USING (user_is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_classes_style_id ON public.classes(style_id);
CREATE INDEX idx_classes_color_id ON public.classes(color_id);
CREATE INDEX idx_classes_status ON public.classes(status);

-- Add triggers for automatic timestamp and user tracking
CREATE TRIGGER handle_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_classes_created_by
  BEFORE INSERT ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_by();
