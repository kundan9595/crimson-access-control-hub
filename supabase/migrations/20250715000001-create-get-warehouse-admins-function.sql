-- Create function to get warehouse admins
CREATE OR REPLACE FUNCTION public.get_warehouse_admins()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  department TEXT,
  phone_number TEXT,
  designation TEXT,
  is_active BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    p.department,
    p.phone_number,
    p.designation,
    p.is_active
  FROM public.profiles p
  JOIN public.user_roles ur ON p.id = ur.user_id
  JOIN public.roles r ON ur.role_id = r.id
  WHERE r.is_warehouse_admin = true
    AND p.is_active = true
  ORDER BY p.first_name ASC;
$$; 