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

// Simulated rarity percentages based on trait types
// In a real implementation, you'd fetch this from OpenSea collection stats
const getTraitRarity = (traitType: string, value: string): number => {
  // Common traits have higher percentages (less rare = less powerful)
  // Rare traits have lower percentages (more rare = more powerful)
  const hash = (traitType + value).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Generate a pseudo-random rarity between 1% and 30%
  const rarity = Math.abs(hash % 29) + 1;
  return rarity;
};

// Calculate power score from traits (lower rarity = higher power)
const calculatePowerScore = (traits: Trait[]): { totalPower: number; traitPowers: Array<{ trait: Trait; rarity: number; power: number }> } => {
  const traitPowers = traits
    .filter(t => t.trait_type.toLowerCase() !== 'honorary' && t.trait_type.toLowerCase() !== 'biome')
    .map(trait => {
      const rarity = getTraitRarity(trait.trait_type, trait.value);
      // Lower rarity = higher power (inverse relationship)
      const power = Math.round((30 - rarity) * 3.33); // Scale to 0-100
      return { trait, rarity, power };
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
    
    if (!LOVABLE_API_KEY) {
      throw new Error('AI API key is not configured');
    }

    const { rover1, rover2 } = await req.json() as { rover1: RoverData; rover2: RoverData };

    if (!rover1 || !rover2) {
      throw new Error('Two rovers are required for battle simulation');
    }

    // Calculate power scores for both rovers
    const rover1Stats = calculatePowerScore(rover1.traits || []);
    const rover2Stats = calculatePowerScore(rover2.traits || []);

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
          power: tp.power
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
          power: tp.power
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
