import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Item, InventoryItem, Expedition, ExpeditionRun, RoverEquipment, ExpeditionLogEntry } from '@/types/game';
import { Json } from '@/integrations/supabase/types';

// Helper to safely parse log entries from DB Json type
const parseLogEntries = (logs: Json): ExpeditionLogEntry[] => {
  if (Array.isArray(logs)) {
    return logs as unknown as ExpeditionLogEntry[];
  }
  return [];
};

// Helper to transform DB row to ExpeditionRun
const transformExpeditionRun = (row: Record<string, unknown>): ExpeditionRun => ({
  ...row,
  log_entries: parseLogEntries(row.log_entries as Json)
} as ExpeditionRun);

export const useGameData = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [activeExpeditions, setActiveExpeditions] = useState<ExpeditionRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(() => {
    const saved = localStorage.getItem('rover_coins');
    return saved ? parseInt(saved, 10) : 100;
  });

  // Save coins to localStorage
  useEffect(() => {
    localStorage.setItem('rover_coins', coins.toString());
  }, [coins]);

  // Fetch all game data
  const fetchGameData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, inventoryRes, expeditionsRes, runsRes] = await Promise.all([
        supabase.from('items').select('*'),
        supabase.from('inventory').select('*, item:items(*)'),
        supabase.from('expeditions').select('*'),
        supabase.from('expedition_runs').select('*, expedition:expeditions(*), reward_item:items(*)').eq('status', 'in_progress')
      ]);

      if (itemsRes.data) setItems(itemsRes.data as Item[]);
      if (inventoryRes.data) setInventory(inventoryRes.data as InventoryItem[]);
      if (expeditionsRes.data) setExpeditions(expeditionsRes.data as Expedition[]);
      if (runsRes.data) {
        setActiveExpeditions(runsRes.data.map(row => transformExpeditionRun(row as Record<string, unknown>)));
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGameData();
  }, [fetchGameData]);

  // Add item to inventory
  const addToInventory = async (itemId: string, quantity = 1) => {
    const existing = inventory.find(i => i.item_id === itemId);
    
    if (existing) {
      const { error } = await supabase
        .from('inventory')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id);
      
      if (!error) {
        setInventory(prev => prev.map(i => 
          i.id === existing.id 
            ? { ...i, quantity: i.quantity + quantity }
            : i
        ));
      }
    } else {
      const { data, error } = await supabase
        .from('inventory')
        .insert({ item_id: itemId, quantity })
        .select('*, item:items(*)')
        .single();
      
      if (data && !error) {
        setInventory(prev => [...prev, data as InventoryItem]);
      }
    }
  };

  // Remove item from inventory
  const removeFromInventory = async (inventoryId: string, quantity = 1) => {
    const item = inventory.find(i => i.id === inventoryId);
    if (!item) return;

    if (item.quantity <= quantity) {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', inventoryId);
      
      if (!error) {
        setInventory(prev => prev.filter(i => i.id !== inventoryId));
      }
    } else {
      const { error } = await supabase
        .from('inventory')
        .update({ quantity: item.quantity - quantity })
        .eq('id', inventoryId);
      
      if (!error) {
        setInventory(prev => prev.map(i => 
          i.id === inventoryId 
            ? { ...i, quantity: i.quantity - quantity }
            : i
        ));
      }
    }
  };

  // Equip item to rover
  const equipItem = async (roverTokenId: string, inventoryId: string, slot: 'weapon' | 'armor' | 'accessory') => {
    const invItem = inventory.find(i => i.id === inventoryId);
    if (!invItem) return false;

    // First, unequip any existing item in that slot
    const { data: existing } = await supabase
      .from('rover_equipment')
      .select('*')
      .eq('rover_token_id', roverTokenId)
      .eq('slot', slot)
      .single();

    if (existing) {
      // Return old item to inventory
      await addToInventory((existing as RoverEquipment).item_id);
      await supabase
        .from('rover_equipment')
        .delete()
        .eq('id', (existing as RoverEquipment).id);
    }

    // Equip new item
    const { error } = await supabase
      .from('rover_equipment')
      .insert({
        rover_token_id: roverTokenId,
        item_id: invItem.item_id,
        slot
      });

    if (!error) {
      await removeFromInventory(inventoryId);
      return true;
    }
    return false;
  };

  // Unequip item from rover
  const unequipItem = async (equipmentId: string) => {
    const { data } = await supabase
      .from('rover_equipment')
      .select('*')
      .eq('id', equipmentId)
      .single();

    if (data) {
      await addToInventory((data as RoverEquipment).item_id);
      await supabase
        .from('rover_equipment')
        .delete()
        .eq('id', equipmentId);
    }
  };

  // Get equipment for a rover
  const getRoverEquipment = async (roverTokenId: string): Promise<RoverEquipment[]> => {
    const { data } = await supabase
      .from('rover_equipment')
      .select('*, item:items(*)')
      .eq('rover_token_id', roverTokenId);
    
    return (data as RoverEquipment[]) || [];
  };

  // Start an expedition
  const startExpedition = async (
    expeditionId: string, 
    roverTokenId: string, 
    roverName: string,
    rarityScore: number
  ) => {
    const { data, error } = await supabase
      .from('expedition_runs')
      .insert({
        expedition_id: expeditionId,
        rover_token_id: roverTokenId,
        rover_name: roverName,
        rover_rarity_score: rarityScore,
        log_entries: [] as unknown as Json
      })
      .select('*, expedition:expeditions(*)')
      .single();

    if (data && !error) {
      const run = transformExpeditionRun(data as Record<string, unknown>);
      setActiveExpeditions(prev => [...prev, run]);
      return run;
    }
    return null;
  };

  // Update expedition with log entry
  const addExpeditionLog = async (runId: string, entry: ExpeditionLogEntry) => {
    const run = activeExpeditions.find(r => r.id === runId);
    if (!run) return;

    const newLogs = [...(run.log_entries || []), entry];
    
    const { error } = await supabase
      .from('expedition_runs')
      .update({ log_entries: newLogs as unknown as Json })
      .eq('id', runId);

    if (!error) {
      setActiveExpeditions(prev => prev.map(r => 
        r.id === runId 
          ? { ...r, log_entries: newLogs }
          : r
      ));
    }
  };

  // Complete expedition
  const completeExpedition = async (runId: string, success: boolean, rewardItemId?: string, rewardCoins?: number) => {
    const { data, error } = await supabase
      .from('expedition_runs')
      .update({
        status: success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        reward_item_id: rewardItemId || null,
        reward_coins: rewardCoins || null
      })
      .eq('id', runId)
      .select('*, expedition:expeditions(*), reward_item:items(*)')
      .single();

    if (data && !error) {
      const completedRun = transformExpeditionRun(data as Record<string, unknown>);
      
      // Add rewards
      if (success) {
        if (rewardItemId) {
          await addToInventory(rewardItemId);
        }
        if (rewardCoins) {
          setCoins(prev => prev + rewardCoins);
        }
      }

      // Remove from active, could add to history if needed
      setActiveExpeditions(prev => prev.filter(r => r.id !== runId));
      return completedRun;
    }
    return null;
  };

  // Add coins
  const addCoins = (amount: number) => {
    setCoins(prev => prev + amount);
  };

  // Spend coins
  const spendCoins = (amount: number): boolean => {
    if (coins >= amount) {
      setCoins(prev => prev - amount);
      return true;
    }
    return false;
  };

  return {
    items,
    inventory,
    expeditions,
    activeExpeditions,
    coins,
    loading,
    fetchGameData,
    addToInventory,
    removeFromInventory,
    equipItem,
    unequipItem,
    getRoverEquipment,
    startExpedition,
    addExpeditionLog,
    completeExpedition,
    addCoins,
    spendCoins
  };
};
