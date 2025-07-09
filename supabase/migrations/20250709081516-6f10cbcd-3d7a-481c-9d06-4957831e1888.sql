
-- Add RLS policy to allow admins to update any user profile
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (user_is_admin(auth.uid()));
