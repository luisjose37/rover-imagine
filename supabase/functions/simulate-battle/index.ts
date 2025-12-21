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

const COLLECTION_SLUG = 'roversxyz';
const TOTAL_SUPPLY = 5555; // Actual Rovers collection size

// Trait lookup cache
let traitCache: Record<string, Record<string, number>> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 3600000; // 1 hour

// Fetch real trait data from OpenSea
const fetchTraitData = async (apiKey: string): Promise<Record<string, Record<string, number>>> => {
  const now = Date.now();
  
  // Return cached data if valid
  if (traitCache && (now - cacheTimestamp) < CACHE_TTL) {
    console.log('Using cached trait data');
    return traitCache;
  }

  const traitsUrl = `https://api.opensea.io/api/v2/traits/${COLLECTION_SLUG}`;
  console.log('Fetching traits from OpenSea:', traitsUrl);
  
  const traitsResponse = await fetch(traitsUrl, {
    headers: {
      'X-API-KEY': apiKey,
      'Accept': 'application/json',
    },
  });

  if (!traitsResponse.ok) {
    const errorText = await traitsResponse.text();
    console.error('OpenSea traits API error:', traitsResponse.status, errorText);
    throw new Error(`OpenSea traits API error: ${traitsResponse.status}`);
  }

  const traitsData = await traitsResponse.json();
  console.log('Traits data received from OpenSea:', JSON.stringify(traitsData, null, 2));

  // Process traits into a lookup table: { traitType: { traitValue: count } }
  const traitLookup: Record<string, Record<string, number>> = {};

  // Handle different OpenSea API response structures
  // Structure 1: { categories: [...] }
  // Structure 2: { counts: { trait_type: { value: count } } }
  // Structure 3: Direct object { trait_type: [...values] }
  if (traitsData.categories && Array.isArray(traitsData.categories)) {
    for (const category of traitsData.categories) {
      const traitType = category.trait_type;
      traitLookup[traitType] = {};
      
      if (category.counts) {
        for (const trait of category.counts) {
          traitLookup[traitType][trait.value] = trait.count;
        }
      }
    }
  } else if (traitsData.counts) {
    // Alternative structure from OpenSea API
    for (const [traitType, values] of Object.entries(traitsData.counts)) {
      traitLookup[traitType] = {};
      if (typeof values === 'object' && values !== null) {
        for (const [value, count] of Object.entries(values as Record<string, number>)) {
          traitLookup[traitType][value] = count as number;
        }
      }
    }
  } else {
    // Try to parse as direct trait object
    for (const [key, value] of Object.entries(traitsData)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        traitLookup[key] = {};
        for (const [traitValue, count] of Object.entries(value as Record<string, number>)) {
          if (typeof count === 'number') {
            traitLookup[key][traitValue] = count;
          }
        }
      }
    }
  }

  // Cache the result
  traitCache = traitLookup;
  cacheTimestamp = now;

  console.log('Trait lookup table created with', Object.keys(traitLookup).length, 'trait types');
  return traitLookup;
};

// Get trait rarity from real OpenSea data
const getTraitRarity = (
  traitType: string, 
  value: string, 
  traitData: Record<string, Record<string, number>>
): { rarity: number; count: number } => {
  const typeData = traitData[traitType];
  if (typeData && typeData[value] !== undefined) {
    const count = typeData[value];
    const rarityPercent = (count / TOTAL_SUPPLY) * 100;
    return { 
      rarity: Math.round(rarityPercent * 100) / 100, // Round to 2 decimal places
      count 
    };
  }
  
  // For unknown traits, return a default high count (common trait)
  console.log(`Unknown trait: ${traitType}/${value}, using default`);
  const defaultCount = Math.round(TOTAL_SUPPLY * 0.5);
  return { 
    rarity: 50,
    count: defaultCount 
  };
};

// Calculate power score from traits (lower rarity = higher power)
const calculatePowerScore = (
  traits: Trait[], 
  traitData: Record<string, Record<string, number>>
): { totalPower: number; traitPowers: Array<{ trait: Trait; rarity: number; power: number; count: number }> } => {
  const traitPowers = traits.map(trait => {
    const { rarity, count } = getTraitRarity(trait.trait_type, trait.value, traitData);
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

    if (!OPENSEA_API_KEY) {
      throw new Error('OpenSea API key is not configured');
    }

    const { rover1, rover2 } = await req.json() as { rover1: RoverData; rover2: RoverData };

    if (!rover1 || !rover2) {
      throw new Error('Two rovers are required for battle simulation');
    }

    // Fetch real trait data from OpenSea
    const traitData = await fetchTraitData(OPENSEA_API_KEY);

    // Calculate power scores for both rovers using real rarity data
    const rover1Stats = calculatePowerScore(rover1.traits || [], traitData);
    const rover2Stats = calculatePowerScore(rover2.traits || [], traitData);
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
          power: tp.power,
          count: tp.count
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
          power: tp.power,
          count: tp.count
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
- Dominant Trait: ${battleContext.rover1.dominantTrait?.trait.trait_type}: ${battleContext.rover1.dominantTrait?.trait.value} (${battleContext.rover1.dominantTrait?.count}/${TOTAL_SUPPLY} have this, ${battleContext.rover1.dominantTrait?.rarity}% rarity, ${battleContext.rover1.dominantTrait?.power} power)
- Other Traits: ${battleContext.rover1.traits.map(t => `${t.type}: ${t.value} (${t.count}/${TOTAL_SUPPLY})`).join(', ')}

ROVER 2: ${battleContext.rover2.name}
- Total Power: ${battleContext.rover2.totalPower}
- Dominant Trait: ${battleContext.rover2.dominantTrait?.trait.trait_type}: ${battleContext.rover2.dominantTrait?.trait.value} (${battleContext.rover2.dominantTrait?.count}/${TOTAL_SUPPLY} have this, ${battleContext.rover2.dominantTrait?.rarity}% rarity, ${battleContext.rover2.dominantTrait?.power} power)
- Other Traits: ${battleContext.rover2.traits.map(t => `${t.type}: ${t.value} (${t.count}/${TOTAL_SUPPLY})`).join(', ')}

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
          count: tp.count,
          totalSupply: TOTAL_SUPPLY
        })),
        dominantTrait: rover1DominantTrait ? {
          trait_type: rover1DominantTrait.trait.trait_type,
          value: rover1DominantTrait.trait.value,
          rarity: rover1DominantTrait.rarity,
          power: rover1DominantTrait.power,
          count: rover1DominantTrait.count
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
          count: tp.count,
          totalSupply: TOTAL_SUPPLY
        })),
        dominantTrait: rover2DominantTrait ? {
          trait_type: rover2DominantTrait.trait.trait_type,
          value: rover2DominantTrait.trait.value,
          rarity: rover2DominantTrait.rarity,
          power: rover2DominantTrait.power,
          count: rover2DominantTrait.count
        } : null
      },
      winner: winner.name,
      winnerId: winner.identifier,
      totalSupply: TOTAL_SUPPLY
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
