-- Create table for Alpha Rovers
CREATE TABLE public.alpha_rovers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image_url TEXT,
  trait_count INTEGER NOT NULL,
  traits JSONB NOT NULL DEFAULT '[]'::jsonb,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alpha_rovers ENABLE ROW LEVEL SECURITY;

-- Allow public read access (this is a public leaderboard)
CREATE POLICY "Alpha rovers are viewable by everyone" 
ON public.alpha_rovers 
FOR SELECT 
USING (true);

-- Allow public insert (anyone can discover an alpha)
CREATE POLICY "Anyone can add alpha rovers" 
ON public.alpha_rovers 
FOR INSERT 
WITH CHECK (true);

-- Create index for fast lookups
CREATE INDEX idx_alpha_rovers_token_id ON public.alpha_rovers(token_id);
CREATE INDEX idx_alpha_rovers_trait_count ON public.alpha_rovers(trait_count DESC);