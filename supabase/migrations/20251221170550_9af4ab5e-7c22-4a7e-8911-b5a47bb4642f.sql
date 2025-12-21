-- Remove the insecure public INSERT policy
DROP POLICY IF EXISTS "Anyone can add alpha rovers" ON public.alpha_rovers;