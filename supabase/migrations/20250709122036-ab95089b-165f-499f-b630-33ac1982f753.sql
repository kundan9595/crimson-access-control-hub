
-- Add the missing updated_by column to zone_locations table
ALTER TABLE public.zone_locations 
ADD COLUMN updated_by UUID;

-- Also add updated_at column for consistency with other tables
ALTER TABLE public.zone_locations 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Add trigger for updated_at
CREATE TRIGGER handle_zone_locations_updated_at
  BEFORE UPDATE ON public.zone_locations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
