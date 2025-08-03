-- Create inventory tables for warehouse management

-- Create warehouse_inventory table to track inventory items in warehouses
CREATE TABLE public.warehouse_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  sku_id UUID NOT NULL REFERENCES public.skus(id) ON DELETE CASCADE,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (total_quantity - reserved_quantity) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  UNIQUE(warehouse_id, sku_id)
);

-- Create warehouse_inventory_locations table to track specific locations
CREATE TABLE public.warehouse_inventory_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_inventory_id UUID NOT NULL REFERENCES public.warehouse_inventory(id) ON DELETE CASCADE,
  floor_id UUID NOT NULL REFERENCES public.warehouse_floors(id) ON DELETE CASCADE,
  lane_id UUID NOT NULL REFERENCES public.warehouse_lanes(id) ON DELETE CASCADE,
  rack_id UUID NOT NULL REFERENCES public.warehouse_racks(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  UNIQUE(warehouse_inventory_id, floor_id, lane_id, rack_id)
);

-- Create warehouse_inventory_reservations table to track reserved inventory
CREATE TABLE public.warehouse_inventory_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_inventory_id UUID NOT NULL REFERENCES public.warehouse_inventory(id) ON DELETE CASCADE,
  order_id TEXT, -- Reference to order system (can be null for manual reservations)
  quantity INTEGER NOT NULL DEFAULT 0,
  reservation_type TEXT NOT NULL DEFAULT 'order' CHECK (reservation_type IN ('order', 'manual', 'damaged')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS on all inventory tables
ALTER TABLE public.warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_inventory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_inventory_reservations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for warehouse_inventory
CREATE POLICY "Users can view inventory if they have warehouse access" ON public.warehouse_inventory
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'view_inventory') OR
    public.user_has_permission(auth.uid(), 'manage_inventory')
  );

CREATE POLICY "Users can insert inventory if they have edit access" ON public.warehouse_inventory
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'edit_inventory') OR
    public.user_has_permission(auth.uid(), 'manage_inventory')
  );

CREATE POLICY "Users can update inventory if they have edit access" ON public.warehouse_inventory
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'edit_inventory') OR
    public.user_has_permission(auth.uid(), 'manage_inventory')
  );

CREATE POLICY "Users can delete inventory if they have manage access" ON public.warehouse_inventory
  FOR DELETE USING (
    public.user_has_permission(auth.uid(), 'manage_inventory')
  );

-- Create RLS policies for warehouse_inventory_locations
CREATE POLICY "Users can view inventory locations if they have warehouse access" ON public.warehouse_inventory_locations
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'view_inventory') OR
    public.user_has_permission(auth.uid(), 'manage_inventory')
  );

CREATE POLICY "Users can insert inventory locations if they have edit access" ON public.warehouse_inventory_locations
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'edit_inventory') OR
    public.user_has_permission(auth.uid(), 'manage_inventory')
  );

CREATE POLICY "Users can update inventory locations if they have edit access" ON public.warehouse_inventory_locations
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'edit_inventory') OR
    public.user_has_permission(auth.uid(), 'manage_inventory')
  );

CREATE POLICY "Users can delete inventory locations if they have manage access" ON public.warehouse_inventory_locations
  FOR DELETE USING (
    public.user_has_permission(auth.uid(), 'manage_inventory')
  );

-- Create RLS policies for warehouse_inventory_reservations
CREATE POLICY "Users can view inventory reservations if they have warehouse access" ON public.warehouse_inventory_reservations
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'view_inventory') OR
    public.user_has_permission(auth.uid(), 'manage_inventory')
  );

CREATE POLICY "Users can insert inventory reservations if they have edit access" ON public.warehouse_inventory_reservations
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'edit_inventory') OR
    public.user_has_permission(auth.uid(), 'manage_inventory')
  );

CREATE POLICY "Users can update inventory reservations if they have edit access" ON public.warehouse_inventory_reservations
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'edit_inventory') OR
    public.user_has_permission(auth.uid(), 'manage_inventory')
  );

CREATE POLICY "Users can delete inventory reservations if they have manage access" ON public.warehouse_inventory_reservations
  FOR DELETE USING (
    public.user_has_permission(auth.uid(), 'manage_inventory')
  );

-- Create indexes for better performance
CREATE INDEX idx_warehouse_inventory_warehouse_id ON public.warehouse_inventory(warehouse_id);
CREATE INDEX idx_warehouse_inventory_sku_id ON public.warehouse_inventory(sku_id);
CREATE INDEX idx_warehouse_inventory_available_quantity ON public.warehouse_inventory(available_quantity);
CREATE INDEX idx_warehouse_inventory_locations_inventory_id ON public.warehouse_inventory_locations(warehouse_inventory_id);
CREATE INDEX idx_warehouse_inventory_locations_rack_id ON public.warehouse_inventory_locations(rack_id);
CREATE INDEX idx_warehouse_inventory_reservations_inventory_id ON public.warehouse_inventory_reservations(warehouse_inventory_id);
CREATE INDEX idx_warehouse_inventory_reservations_status ON public.warehouse_inventory_reservations(status);

-- Create triggers for automatic timestamp and user tracking
CREATE TRIGGER handle_warehouse_inventory_updated_at
  BEFORE UPDATE ON public.warehouse_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_warehouse_inventory_created_by
  BEFORE INSERT ON public.warehouse_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_by();

CREATE TRIGGER handle_warehouse_inventory_locations_updated_at
  BEFORE UPDATE ON public.warehouse_inventory_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_warehouse_inventory_locations_created_by
  BEFORE INSERT ON public.warehouse_inventory_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_by();

CREATE TRIGGER handle_warehouse_inventory_reservations_updated_at
  BEFORE UPDATE ON public.warehouse_inventory_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_warehouse_inventory_reservations_created_by
  BEFORE INSERT ON public.warehouse_inventory_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_created_by();

-- Create function to update total and reserved quantities when locations change
CREATE OR REPLACE FUNCTION public.update_inventory_quantities()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total quantity in warehouse_inventory
  UPDATE public.warehouse_inventory
  SET total_quantity = (
    SELECT COALESCE(SUM(quantity), 0)
    FROM public.warehouse_inventory_locations
    WHERE warehouse_inventory_id = COALESCE(NEW.warehouse_inventory_id, OLD.warehouse_inventory_id)
  )
  WHERE id = COALESCE(NEW.warehouse_inventory_id, OLD.warehouse_inventory_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update quantities when locations change
CREATE TRIGGER trigger_update_inventory_quantities
  AFTER INSERT OR UPDATE OR DELETE ON public.warehouse_inventory_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_quantities();

-- Create function to update reserved quantity when reservations change
CREATE OR REPLACE FUNCTION public.update_reserved_quantities()
RETURNS TRIGGER AS $$
BEGIN
  -- Update reserved quantity in warehouse_inventory
  UPDATE public.warehouse_inventory
  SET reserved_quantity = (
    SELECT COALESCE(SUM(quantity), 0)
    FROM public.warehouse_inventory_reservations
    WHERE warehouse_inventory_id = COALESCE(NEW.warehouse_inventory_id, OLD.warehouse_inventory_id)
    AND status = 'active'
  )
  WHERE id = COALESCE(NEW.warehouse_inventory_id, OLD.warehouse_inventory_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update reserved quantities when reservations change
CREATE TRIGGER trigger_update_reserved_quantities
  AFTER INSERT OR UPDATE OR DELETE ON public.warehouse_inventory_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reserved_quantities(); 