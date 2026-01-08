-- Items table: weapons, armor, consumables
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('weapon', 'armor', 'consumable', 'accessory')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  power_bonus INTEGER NOT NULL DEFAULT 0,
  defense_bonus INTEGER NOT NULL DEFAULT 0,
  luck_bonus INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rover equipment: links items to rovers
CREATE TABLE public.rover_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rover_token_id TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  slot TEXT NOT NULL CHECK (slot IN ('weapon', 'armor', 'accessory')),
  equipped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(rover_token_id, slot) -- One item per slot per rover
);

-- Inventory: items owned (not yet equipped)
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  acquired_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Expeditions: missions rovers can go on
CREATE TABLE public.expeditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')),
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  required_traits TEXT[], -- Optional trait requirements
  reward_item_pool UUID[], -- Possible item rewards
  coin_reward_min INTEGER NOT NULL DEFAULT 10,
  coin_reward_max INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Active expedition runs
CREATE TABLE public.expedition_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expedition_id UUID NOT NULL REFERENCES public.expeditions(id) ON DELETE CASCADE,
  rover_token_id TEXT NOT NULL,
  rover_name TEXT NOT NULL,
  rover_rarity_score NUMERIC NOT NULL DEFAULT 0, -- Calculated from trait rarity
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_item_id UUID REFERENCES public.items(id),
  reward_coins INTEGER,
  log_entries JSONB NOT NULL DEFAULT '[]'
);

-- Enable RLS on all tables
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rover_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expeditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedition_runs ENABLE ROW LEVEL SECURITY;

-- Public read access for items and expeditions (game data)
CREATE POLICY "Items are viewable by everyone" ON public.items FOR SELECT USING (true);
CREATE POLICY "Expeditions are viewable by everyone" ON public.expeditions FOR SELECT USING (true);

-- Public access for equipment, inventory, expedition runs (no auth for this game)
CREATE POLICY "Equipment is viewable by everyone" ON public.rover_equipment FOR SELECT USING (true);
CREATE POLICY "Equipment can be managed by everyone" ON public.rover_equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "Equipment can be updated by everyone" ON public.rover_equipment FOR UPDATE USING (true);
CREATE POLICY "Equipment can be deleted by everyone" ON public.rover_equipment FOR DELETE USING (true);

CREATE POLICY "Inventory is viewable by everyone" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Inventory can be managed by everyone" ON public.inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Inventory can be updated by everyone" ON public.inventory FOR UPDATE USING (true);
CREATE POLICY "Inventory can be deleted by everyone" ON public.inventory FOR DELETE USING (true);

CREATE POLICY "Expedition runs are viewable by everyone" ON public.expedition_runs FOR SELECT USING (true);
CREATE POLICY "Expedition runs can be created by everyone" ON public.expedition_runs FOR INSERT WITH CHECK (true);
CREATE POLICY "Expedition runs can be updated by everyone" ON public.expedition_runs FOR UPDATE USING (true);

-- Seed some starting items
INSERT INTO public.items (name, description, item_type, rarity, power_bonus, defense_bonus, luck_bonus) VALUES
  ('Rusty Blade', 'A weathered blade, still sharp enough.', 'weapon', 'common', 10, 0, 0),
  ('Plasma Cutter', 'High-frequency energy weapon.', 'weapon', 'uncommon', 25, 0, 5),
  ('Void Saber', 'Cuts through dimensions.', 'weapon', 'rare', 50, 0, 10),
  ('Quantum Annihilator', 'Devastating quantum weapon.', 'weapon', 'epic', 80, 10, 15),
  ('Cosmic Destroyer', 'Legendary weapon of the ancients.', 'weapon', 'legendary', 120, 20, 25),
  ('Scrap Armor', 'Makeshift protection.', 'armor', 'common', 0, 15, 0),
  ('Titanium Plating', 'Military-grade protection.', 'armor', 'uncommon', 5, 35, 0),
  ('Energy Shield', 'Force field generator.', 'armor', 'rare', 10, 60, 5),
  ('Void Barrier', 'Dimensional protection.', 'armor', 'epic', 15, 90, 10),
  ('Celestial Aegis', 'Divine protection.', 'armor', 'legendary', 25, 130, 20),
  ('Lucky Charm', 'Increases fortune slightly.', 'accessory', 'common', 0, 0, 10),
  ('Rabbits Foot', 'Classic good luck charm.', 'accessory', 'uncommon', 0, 0, 25),
  ('Fortune Crystal', 'Amplifies luck dramatically.', 'accessory', 'rare', 5, 5, 50),
  ('Probability Engine', 'Manipulates chance itself.', 'accessory', 'epic', 10, 10, 80),
  ('Fate Weaver', 'Controls destiny.', 'accessory', 'legendary', 20, 20, 120);

-- Seed some expeditions
INSERT INTO public.expeditions (name, description, difficulty, duration_minutes, coin_reward_min, coin_reward_max) VALUES
  ('Scrap Yard Run', 'Search the nearby scrap yards for useful parts.', 'easy', 1, 5, 20),
  ('Abandoned Outpost', 'Explore a derelict research facility.', 'medium', 3, 20, 60),
  ('Toxic Wasteland', 'Navigate through dangerous chemical zones.', 'hard', 5, 50, 150),
  ('The Dark Zone', 'Venture into the forbidden territories.', 'extreme', 10, 150, 500);