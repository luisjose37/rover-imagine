// Game types for the Rovers battle simulator

export interface NFT {
  identifier: string;
  name: string;
  image_url: string;
  animation_url?: string;
  description?: string;
  traits: Array<{
    trait_type: string;
    value: string;
  }>;
  opensea_url?: string;
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  item_type: 'weapon' | 'armor' | 'consumable' | 'accessory';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  power_bonus: number;
  defense_bonus: number;
  luck_bonus: number;
  image_url: string | null;
  created_at: string;
}

export interface RoverEquipment {
  id: string;
  rover_token_id: string;
  item_id: string;
  slot: 'weapon' | 'armor' | 'accessory';
  equipped_at: string;
  item?: Item;
}

export interface InventoryItem {
  id: string;
  item_id: string;
  quantity: number;
  acquired_at: string;
  item?: Item;
}

export interface Expedition {
  id: string;
  name: string;
  description: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  duration_minutes: number;
  required_traits: string[] | null;
  reward_item_pool: string[] | null;
  coin_reward_min: number;
  coin_reward_max: number;
  created_at: string;
}

export interface ExpeditionRun {
  id: string;
  expedition_id: string;
  rover_token_id: string;
  rover_name: string;
  rover_rarity_score: number;
  status: 'in_progress' | 'completed' | 'failed';
  started_at: string;
  completed_at: string | null;
  reward_item_id: string | null;
  reward_coins: number | null;
  log_entries: ExpeditionLogEntry[];
  expedition?: Expedition;
  reward_item?: Item;
}

export interface ExpeditionLogEntry {
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'danger' | 'reward';
}

export interface RoverWithEquipment extends NFT {
  equipment: RoverEquipment[];
  totalPower: number;
  totalDefense: number;
  totalLuck: number;
  rarityScore: number;
}

export const RARITY_COLORS: Record<Item['rarity'], string> = {
  common: 'text-muted-foreground',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400'
};

export const DIFFICULTY_COLORS: Record<Expedition['difficulty'], string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-orange-400',
  extreme: 'text-red-400'
};
