
-- Update RLS policies for add_ons table to allow authenticated users
DROP POLICY IF EXISTS "Admins can manage add ons" ON public.add_ons;

CREATE POLICY "Authenticated users can view add ons" 
  ON public.add_ons 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create add ons" 
  ON public.add_ons 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update add ons" 
  ON public.add_ons 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete add ons" 
  ON public.add_ons 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Update RLS policies for add_on_options table to allow authenticated users
DROP POLICY IF EXISTS "Admins can manage add on options" ON public.add_on_options;

CREATE POLICY "Authenticated users can view add on options" 
  ON public.add_on_options 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create add on options" 
  ON public.add_on_options 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update add on options" 
  ON public.add_on_options 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete add on options" 
  ON public.add_on_options 
  FOR DELETE 
  USING (auth.role() = 'authenticated');
