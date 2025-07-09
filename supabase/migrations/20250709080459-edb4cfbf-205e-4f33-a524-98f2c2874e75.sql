
-- Add is_active column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.is_active IS 'Indicates whether the user account is active or deactivated';
