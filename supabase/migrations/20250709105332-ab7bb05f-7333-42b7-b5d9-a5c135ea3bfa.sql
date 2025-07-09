
-- Create enum types for status
CREATE TYPE public.master_status AS ENUM ('active', 'inactive');

-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  status master_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Create categories table with self-referencing for nested categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  status master_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id),
  UNIQUE(name, parent_id)
);

-- Create colors table
CREATE TABLE public.colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  hex_code TEXT NOT NULL,
  status master_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Add constraint to ensure hex codes are valid
ALTER TABLE public.colors ADD CONSTRAINT valid_hex_code 
CHECK (hex_code ~ '^#[0-9A-Fa-f]{6}$');

-- Create indexes for better performance
CREATE INDEX idx_brands_name ON public.brands(name);
CREATE INDEX idx_brands_status ON public.brands(status);
CREATE INDEX idx_categories_name ON public.categories(name);
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_status ON public.categories(status);
CREATE INDEX idx_colors_name ON public.colors(name);
CREATE INDEX idx_colors_status ON public.colors(status);

-- Enable Row Level Security
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brands (admin access only)
CREATE POLICY "Admins can manage brands" ON public.brands
FOR ALL USING (user_is_admin(auth.uid()));

-- Create RLS policies for categories (admin access only)
CREATE POLICY "Admins can manage categories" ON public.categories
FOR ALL USING (user_is_admin(auth.uid()));

-- Create RLS policies for colors (admin access only)
CREATE POLICY "Admins can manage colors" ON public.colors
FOR ALL USING (user_is_admin(auth.uid()));

-- Add new permissions for masters module
INSERT INTO public.permissions (name, description) VALUES
('manage_masters', 'Can manage master data (brands, categories, colors)'),
('view_masters', 'Can view master data');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at and updated_by
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_colors_updated_at BEFORE UPDATE ON public.colors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to set created_by on insert
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically set created_by
CREATE TRIGGER set_brands_created_by BEFORE INSERT ON public.brands
FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_categories_created_by BEFORE INSERT ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

CREATE TRIGGER set_colors_created_by BEFORE INSERT ON public.colors
FOR EACH ROW EXECUTE FUNCTION public.set_created_by();
