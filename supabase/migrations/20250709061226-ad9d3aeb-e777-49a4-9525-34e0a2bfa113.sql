
-- Create department enum type
CREATE TYPE public.department_type AS ENUM (
  'operations',
  'logistics',
  'warehouse',
  'customer_service',
  'administration',
  'finance',
  'it',
  'human_resources'
);

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN department department_type,
ADD COLUMN phone_number TEXT,
ADD COLUMN designation TEXT;

-- Optional: Remove warehouse admin functionality if you want to clean it up
-- UPDATE public.roles SET is_warehouse_admin = false WHERE is_warehouse_admin = true;
-- You can uncomment the above line if you want to disable all warehouse admin flags
