-- Add warehouse_admin_id field to warehouses table
ALTER TABLE public.warehouses 
ADD COLUMN warehouse_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_warehouses_admin_id ON public.warehouses(warehouse_admin_id);

-- Add RLS policy for warehouse admin management
CREATE POLICY "Users can manage warehouse admin assignments" ON public.warehouses
  FOR UPDATE USING (user_is_admin(auth.uid()));

-- Add RLS policy for viewing warehouse admin information
CREATE POLICY "Users can view warehouse admin information" ON public.warehouses
  FOR SELECT USING (user_has_permission(auth.uid(), 'view_warehouses')); 