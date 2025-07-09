
-- First, let's update the zones table to remove code requirement and make it optional
ALTER TABLE public.zones 
ALTER COLUMN code DROP NOT NULL,
ALTER COLUMN code SET DEFAULT NULL;

-- Create a new table for locations within zones
CREATE TABLE public.zone_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(zone_id, state, city)
);

-- Enable RLS for zone_locations
ALTER TABLE public.zone_locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for zone_locations
CREATE POLICY "Admins can manage zone locations" 
  ON public.zone_locations 
  FOR ALL 
  USING (user_is_admin(auth.uid()));

-- Add trigger for created_by
CREATE TRIGGER handle_zone_locations_created_by
  BEFORE INSERT ON public.zone_locations
  FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();
