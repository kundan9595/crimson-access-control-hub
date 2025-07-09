
-- Create Size Groups table
CREATE TABLE public.size_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Create Sizes table (nested under Size Groups)
CREATE TABLE public.sizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  size_group_id UUID NOT NULL REFERENCES public.size_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(size_group_id, code)
);

-- Create Zones table
CREATE TABLE public.zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  warehouse_assignments JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Create Price Types table
CREATE TABLE public.price_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  multiplier DECIMAL(10,4) DEFAULT 1.0000,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Create Vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  payment_terms TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS on all new tables
ALTER TABLE public.size_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for Size Groups
CREATE POLICY "Admins can manage size groups" ON public.size_groups
  FOR ALL USING (user_is_admin(auth.uid()));

-- Create RLS policies for Sizes
CREATE POLICY "Admins can manage sizes" ON public.sizes
  FOR ALL USING (user_is_admin(auth.uid()));

-- Create RLS policies for Zones
CREATE POLICY "Admins can manage zones" ON public.zones
  FOR ALL USING (user_is_admin(auth.uid()));

-- Create RLS policies for Price Types
CREATE POLICY "Admins can manage price types" ON public.price_types
  FOR ALL USING (user_is_admin(auth.uid()));

-- Create RLS policies for Vendors
CREATE POLICY "Admins can manage vendors" ON public.vendors
  FOR ALL USING (user_is_admin(auth.uid()));

-- Add triggers for automatic timestamp updates
CREATE TRIGGER handle_size_groups_updated_at BEFORE UPDATE ON public.size_groups
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_sizes_updated_at BEFORE UPDATE ON public.sizes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_zones_updated_at BEFORE UPDATE ON public.zones
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_price_types_updated_at BEFORE UPDATE ON public.price_types
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Add triggers for automatic created_by/updated_by tracking
CREATE TRIGGER handle_size_groups_created_by BEFORE INSERT ON public.size_groups
  FOR EACH ROW EXECUTE PROCEDURE public.handle_created_by();

CREATE TRIGGER handle_sizes_created_by BEFORE INSERT ON public.sizes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_created_by();

CREATE TRIGGER handle_zones_created_by BEFORE INSERT ON public.zones
  FOR EACH ROW EXECUTE PROCEDURE public.handle_created_by();

CREATE TRIGGER handle_price_types_created_by BEFORE INSERT ON public.price_types
  FOR EACH ROW EXECUTE PROCEDURE public.handle_created_by();

CREATE TRIGGER handle_vendors_created_by BEFORE INSERT ON public.vendors
  FOR EACH ROW EXECUTE PROCEDURE public.handle_created_by();

-- Create indexes for better performance
CREATE INDEX idx_sizes_size_group_id ON public.sizes(size_group_id);
CREATE INDEX idx_sizes_status ON public.sizes(status);
CREATE INDEX idx_size_groups_status ON public.size_groups(status);
CREATE INDEX idx_zones_status ON public.zones(status);
CREATE INDEX idx_price_types_status ON public.price_types(status);
CREATE INDEX idx_vendors_status ON public.vendors(status);
CREATE INDEX idx_zones_code ON public.zones(code);
CREATE INDEX idx_price_types_code ON public.price_types(code);
CREATE INDEX idx_vendors_code ON public.vendors(code);
