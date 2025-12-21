import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Trait {
  trait_type: string;
  value: string;
}

interface RoverData {
  identifier: string;
  name: string;
  traits: Trait[];
}

// Trait rarity lookup - count of each trait in the collection
type TraitLookup = Record<string, Record<string, number>>;

const TOTAL_SUPPLY = 5000; // Rovers collection size

// Hardcoded trait rarity data based on Rovers collection
// Values represent approximate count of NFTs with each trait
const TRAIT_RARITY_DATA: TraitLookup = {
  "Head": {
    "Scanner (Orange)": 180, "Scanner (Blue)": 175, "Scanner (Green)": 170, "Scanner (Red)": 165,
    "Mog": 85, "Dome": 200, "Antenna Array": 150, "Radar Dish": 120, "Solar Panel": 280,
    "Camera Rig": 220, "Weather Sensor": 190, "Satellite Uplink": 95, "Periscope": 140,
    "Beacon": 250, "Telescope": 110, "Radio Tower": 130, "Searchlight": 240,
    "Laser Mount": 75, "Hologram Projector": 45, "Quantum Sensor": 35, "Neural Link": 25,
    "Crown": 15, "Halo": 20, "Phoenix Crest": 10
  },
  "Biome": {
    "Telemetry": 850, "Desert": 720, "Arctic": 680, "Forest": 750, "Ocean": 520,
    "Volcanic": 380, "Cave": 450, "Urban": 350, "Swamp": 280, "Mountain": 420,
    "Space": 150, "Void": 80, "Quantum": 45, "Nebula": 25
  },
  "Paint": {
    "Metallic Orange": 320, "Metallic Blue": 340, "Metallic Green": 310, "Metallic Red": 290,
    "Rusty Blue": 180, "Woodland Camo": 150, "Desert Camo": 160, "Arctic Camo": 140,
    "Matte Black": 280, "Matte White": 260, "Chrome": 120, "Gold": 45,
    "Rainbow": 35, "Holographic": 50, "Obsidian": 65, "Pearl": 80,
    "Neon Pink": 110, "Neon Green": 105, "Neon Blue": 115, "Carbon Fiber": 95
  },
  "Tread": {
    "Crawler Tracks": 620, "Offworld Wheels": 580, "Militech Tracks": 180, "Hover Pods": 150,
    "Spider Legs": 220, "Tank Treads": 450, "All-Terrain": 520, "Racing Wheels": 280,
    "Magnetic Levitation": 95, "Quantum Steps": 40, "Tentacles": 70, "Rocket Boots": 55
  },
  "Gadget": {
    "Spotlights": 680, "Radio Antenna": 720, "TV Antenna": 650, "Dome Cam": 480,
    "Weather Station": 380, "Forklift": 220, "Laser Pointer (Red)": 150, "Laser Pointer (Green)": 145,
    "Satellite Dish": 320, "Solar Cells": 550, "Battery Pack": 480, "Tool Arm": 290,
    "Flamethrower": 85, "Tesla Coil": 75, "Plasma Cannon": 45, "Gravity Well": 25,
    "Time Distorter": 15, "Reality Bender": 10
  },
  "Honorary": {
    "No": 4850, "Yes": 150
  },
  "Left Arm": {
    "Binoculars": 380, "Chainsaw": 220, "Drill": 280, "Claw": 350, "Pincer": 320,
    "Octarms (Unpainted)": 180, "Octarms (Painted)": 120, "Hammer": 290, "Wrench": 340,
    "Plasma Cutter": 95, "Grappling Hook": 150, "Laser Blade": 65, "Force Field": 40,
    "Telekinetic Grip": 25, "Void Grasp": 12
  },
  "Right Arm": {
    "Flashlight": 420, "Bindle": 180, "Octarms (Unpainted)": 175, "Octarms (Painted)": 115,
    "Torch": 380, "Scanner": 320, "Probe": 290, "Sensor Array": 250,
    "Blaster": 140, "Railgun": 85, "Photon Cannon": 55, "Antimatter Beam": 30,
    "Infinity Gauntlet": 8
  },
  "Generation": {
    "1": 2500, "2": 2000, "3": 400, "0": 100
  },
  "Experimental": {
    "No": 4750, "Yes": 250
  }
};

// Get trait rarity from lookup or estimate
const getTraitRarity = (traitType: string, value: string): { rarity: number; count: number } => {
  const typeData = TRAIT_RARITY_DATA[traitType];
  if (typeData && typeData[value] !== undefined) {
    const count = typeData[value];
    const rarityPercent = (count / TOTAL_SUPPLY) * 100;
    return { 
      rarity: Math.round(rarityPercent * 10) / 10,
      count 
    };
  }
  // For unknown traits, estimate based on trait type patterns
  // Rarer trait types get lower default counts
  const defaultCounts: Record<string, number> = {
    "Head": 150,
    "Biome": 400,
    "Paint": 200,
    "Tread": 300,
    "Gadget": 250,
    "Honorary": 4850,
    "Left Arm": 250,
    "Right Arm": 250,
    "Generation": 1500,
    "Experimental": 4750
  };
  const estimatedCount = defaultCounts[traitType] || 250;
  const rarityPercent = (estimatedCount / TOTAL_SUPPLY) * 100;
  return { 
    rarity: Math.round(rarityPercent * 10) / 10,
    count: estimatedCount 
  };
};

// Calculate power score from traits (lower rarity = higher power)
const calculatePowerScore = (traits: Trait[]): { totalPower: number; traitPowers: Array<{ trait: Trait; rarity: number; power: number; count: number }> } => {
  const traitPowers = traits.map(trait => {
    const { rarity, count } = getTraitRarity(trait.trait_type, trait.value);
    // Lower rarity = higher power (inverse relationship)
    // If only 1% of NFTs have it, power is ~99. If 50% have it, power is ~50.
    const power = Math.round(Math.max(0, 100 - rarity));
    return { trait, rarity, power, count };
  });
  
  const totalPower = traitPowers.reduce((sum, tp) => sum + tp.power, 0);
  
  return { totalPower, traitPowers };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const OPENSEA_API_KEY = Deno.env.get('OPENSEA_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('AI API key is not configured');
    }

    const { rover1, rover2 } = await req.json() as { rover1: RoverData; rover2: RoverData };

    if (!rover1 || !rover2) {
      throw new Error('Two rovers are required for battle simulation');
    }

    // Calculate power scores for both rovers using hardcoded rarity data
    const rover1Stats = calculatePowerScore(rover1.traits || []);
    const rover2Stats = calculatePowerScore(rover2.traits || []);
    console.log('Calculated power scores - Rover1:', rover1Stats.totalPower, 'Rover2:', rover2Stats.totalPower);

    // Find dominant trait for each rover
    const rover1DominantTrait = rover1Stats.traitPowers.reduce((max, tp) => tp.power > max.power ? tp : max, rover1Stats.traitPowers[0]);
    const rover2DominantTrait = rover2Stats.traitPowers.reduce((max, tp) => tp.power > max.power ? tp : max, rover2Stats.traitPowers[0]);

    // Determine winner with some randomness
    const power1 = rover1Stats.totalPower + (Math.random() * 50); // Add luck factor
    const power2 = rover2Stats.totalPower + (Math.random() * 50);
    
    const winner = power1 > power2 ? rover1 : rover2;
    const loser = power1 > power2 ? rover2 : rover1;
    const winnerStats = power1 > power2 ? rover1Stats : rover2Stats;
    const loserStats = power1 > power2 ? rover2Stats : rover1Stats;
    const winnerDominantTrait = power1 > power2 ? rover1DominantTrait : rover2DominantTrait;

    // Prepare battle context for AI
    const battleContext = {
      rover1: {
        name: rover1.name,
        totalPower: rover1Stats.totalPower,
        traits: rover1Stats.traitPowers.map(tp => ({
          type: tp.trait.trait_type,
          value: tp.trait.value,
          rarity: tp.rarity,
          power: tp.power
        })),
        dominantTrait: rover1DominantTrait
      },
      rover2: {
        name: rover2.name,
        totalPower: rover2Stats.totalPower,
        traits: rover2Stats.traitPowers.map(tp => ({
          type: tp.trait.trait_type,
          value: tp.trait.value,
          rarity: tp.rarity,
          power: tp.power
        })),
        dominantTrait: rover2DominantTrait
      },
      winner: winner.name,
      loser: loser.name,
      winnerDominantTrait: winnerDominantTrait?.trait
    };

    console.log('Battle context:', JSON.stringify(battleContext, null, 2));

    const systemPrompt = `You are a battle commentator for the Rovers universe. Generate a short, exciting battle log.

ROVERS CONTEXT:
Rovers are intelligent, autonomous beings created by Mycobiotics Ltd. to restore Earth. They have unique traits that define their capabilities.

WRITING STYLE:
- Keep it SHORT and punchy (100-150 words max)
- Use dramatic, action-packed language
- Reference specific traits and how they influenced the battle
- End with a clear victor announcement
- Format as a battle log with timestamps like [00:00], [00:15], etc.`;

    const userPrompt = `Generate a battle log for this match:

ROVER 1: ${battleContext.rover1.name}
- Total Power: ${battleContext.rover1.totalPower}
- Dominant Trait: ${battleContext.rover1.dominantTrait?.trait.trait_type}: ${battleContext.rover1.dominantTrait?.trait.value} (${battleContext.rover1.dominantTrait?.rarity}% rarity, ${battleContext.rover1.dominantTrait?.power} power)
- Other Traits: ${battleContext.rover1.traits.map(t => `${t.type}: ${t.value}`).join(', ')}

ROVER 2: ${battleContext.rover2.name}
- Total Power: ${battleContext.rover2.totalPower}
- Dominant Trait: ${battleContext.rover2.dominantTrait?.trait.trait_type}: ${battleContext.rover2.dominantTrait?.trait.value} (${battleContext.rover2.dominantTrait?.rarity}% rarity, ${battleContext.rover2.dominantTrait?.power} power)
- Other Traits: ${battleContext.rover2.traits.map(t => `${t.type}: ${t.value}`).join(', ')}

WINNER: ${battleContext.winner}
DOMINANT TRAIT IN VICTORY: ${battleContext.winnerDominantTrait?.trait_type}: ${battleContext.winnerDominantTrait?.value}

Generate the battle log now. Include dramatic moments where traits clash. The dominant trait should play a key role in the victory.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error('Failed to generate battle log');
    }

    const aiData = await response.json();
    const battleLog = aiData.choices?.[0]?.message?.content || 'Battle simulation failed.';

    return new Response(JSON.stringify({
      battleLog,
      rover1Stats: {
        name: rover1.name,
        identifier: rover1.identifier,
        totalPower: rover1Stats.totalPower,
        traits: rover1Stats.traitPowers.map(tp => ({
          trait_type: tp.trait.trait_type,
          value: tp.trait.value,
          rarity: tp.rarity,
          power: tp.power,
          count: tp.count
        })),
        dominantTrait: rover1DominantTrait ? {
          trait_type: rover1DominantTrait.trait.trait_type,
          value: rover1DominantTrait.trait.value,
          rarity: rover1DominantTrait.rarity,
          power: rover1DominantTrait.power
        } : null
      },
      rover2Stats: {
        name: rover2.name,
        identifier: rover2.identifier,
        totalPower: rover2Stats.totalPower,
        traits: rover2Stats.traitPowers.map(tp => ({
          trait_type: tp.trait.trait_type,
          value: tp.trait.value,
          rarity: tp.rarity,
          power: tp.power,
          count: tp.count
        })),
        dominantTrait: rover2DominantTrait ? {
          trait_type: rover2DominantTrait.trait.trait_type,
          value: rover2DominantTrait.trait.value,
          rarity: rover2DominantTrait.rarity,
          power: rover2DominantTrait.power
        } : null
      },
      winner: winner.name,
      winnerId: winner.identifier
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in simulate-battle function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
