
-- Create enum for permission types
CREATE TYPE public.permission_type AS ENUM (
  'view_clients', 'edit_clients', 'delete_clients', 'manage_clients',
  'view_inventory', 'edit_inventory', 'delete_inventory', 'manage_inventory',
  'view_warehouses', 'edit_warehouses', 'delete_warehouses', 'manage_warehouses',
  'view_orders', 'edit_orders', 'delete_orders', 'process_orders',
  'view_users', 'edit_users', 'delete_users', 'manage_users',
  'view_roles', 'edit_roles', 'delete_roles', 'manage_roles',
  'admin_access'
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create roles table
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_warehouse_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create permissions table
CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name permission_type NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user permissions
CREATE OR REPLACE FUNCTION public.user_has_permission(_user_id UUID, _permission permission_type)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = _user_id
      AND p.name = _permission
  )
$$;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.user_is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.user_has_permission(_user_id, 'admin_access')
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.user_is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.user_is_admin(auth.uid()));

-- RLS Policies for roles
CREATE POLICY "Users with role permissions can view roles" ON public.roles
  FOR SELECT USING (public.user_has_permission(auth.uid(), 'view_roles'));

CREATE POLICY "Users with role permissions can manage roles" ON public.roles
  FOR ALL USING (public.user_has_permission(auth.uid(), 'manage_roles'));

-- RLS Policies for permissions
CREATE POLICY "Users with role permissions can view permissions" ON public.permissions
  FOR SELECT USING (public.user_has_permission(auth.uid(), 'view_roles'));

-- RLS Policies for role_permissions
CREATE POLICY "Users with role permissions can view role permissions" ON public.role_permissions
  FOR SELECT USING (public.user_has_permission(auth.uid(), 'view_roles'));

CREATE POLICY "Users with role permissions can manage role permissions" ON public.role_permissions
  FOR ALL USING (public.user_has_permission(auth.uid(), 'manage_roles'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users with role permissions can view all user roles" ON public.user_roles
  FOR SELECT USING (public.user_has_permission(auth.uid(), 'view_roles'));

CREATE POLICY "Users with role permissions can manage user roles" ON public.user_roles
  FOR ALL USING (public.user_has_permission(auth.uid(), 'manage_roles'));

-- Insert default permissions
INSERT INTO public.permissions (name, description) VALUES
  ('view_clients', 'View client information'),
  ('edit_clients', 'Edit client information'),
  ('delete_clients', 'Delete clients'),
  ('manage_clients', 'Full client management access'),
  ('view_inventory', 'View inventory items'),
  ('edit_inventory', 'Edit inventory items'),
  ('delete_inventory', 'Delete inventory items'),
  ('manage_inventory', 'Full inventory management access'),
  ('view_warehouses', 'View warehouse information'),
  ('edit_warehouses', 'Edit warehouse information'),
  ('delete_warehouses', 'Delete warehouses'),
  ('manage_warehouses', 'Full warehouse management access'),
  ('view_orders', 'View order information'),
  ('edit_orders', 'Edit order information'),
  ('delete_orders', 'Delete orders'),
  ('process_orders', 'Process and fulfill orders'),
  ('view_users', 'View user information'),
  ('edit_users', 'Edit user information'),
  ('delete_users', 'Delete users'),
  ('manage_users', 'Full user management access'),
  ('view_roles', 'View role information'),
  ('edit_roles', 'Edit role information'),
  ('delete_roles', 'Delete roles'),
  ('manage_roles', 'Full role management access'),
  ('admin_access', 'Full administrative access');

-- Insert default roles
INSERT INTO public.roles (name, description, is_warehouse_admin) VALUES
  ('Super Admin', 'Full system access with all permissions', false),
  ('Warehouse Admin', 'Warehouse management and inventory control', true),
  ('Manager', 'General management permissions', false),
  ('User', 'Basic user permissions', false);

-- Get role and permission IDs for setting up default role permissions
DO $$
DECLARE
  super_admin_id UUID;
  warehouse_admin_id UUID;
  manager_id UUID;
  user_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO super_admin_id FROM public.roles WHERE name = 'Super Admin';
  SELECT id INTO warehouse_admin_id FROM public.roles WHERE name = 'Warehouse Admin';
  SELECT id INTO manager_id FROM public.roles WHERE name = 'Manager';
  SELECT id INTO user_id FROM public.roles WHERE name = 'User';

  -- Super Admin gets all permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT super_admin_id, id FROM public.permissions;

  -- Warehouse Admin gets warehouse and inventory permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT warehouse_admin_id, id FROM public.permissions 
  WHERE name IN ('view_warehouses', 'edit_warehouses', 'manage_warehouses', 
                 'view_inventory', 'edit_inventory', 'manage_inventory',
                 'view_orders', 'edit_orders', 'process_orders');

  -- Manager gets view and edit permissions (no delete/manage)
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT manager_id, id FROM public.permissions 
  WHERE name IN ('view_clients', 'edit_clients', 'view_inventory', 'edit_inventory',
                 'view_orders', 'edit_orders', 'view_users');

  -- User gets basic view permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT user_id, id FROM public.permissions 
  WHERE name IN ('view_clients', 'view_inventory', 'view_orders');
END $$;

-- Create trigger function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  user_role_id UUID;
BEGIN
  -- Insert user profile
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );

  -- Assign default 'User' role to new users
  SELECT id INTO user_role_id FROM public.roles WHERE name = 'User';
  IF user_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, user_role_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
