import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI API key is not configured');
    }

    const { roverName, traits } = await req.json();

    if (!traits || traits.length === 0) {
      throw new Error('No traits provided for mission generation');
    }

    // Filter out Honorary and Biome traits
    const filteredTraits = traits.filter((t: { trait_type: string; value: string }) => 
      t.trait_type.toLowerCase() !== 'honorary' && t.trait_type.toLowerCase() !== 'biome'
    );

    // Build trait description for the AI
    const traitDescription = filteredTraits
      .map((t: { trait_type: string; value: string }) => `${t.trait_type}: ${t.value}`)
      .join(', ');

    console.log('Generating mission for rover:', roverName);
    console.log('Traits:', traitDescription);

    const systemPrompt = `You are a mission briefing generator for the Rovers universe. Rovers are autonomous machines tasked with restoring Earth after humanity's retreat. Generate short, punchy mission reports.

Your mission reports should:
- Be EXACTLY 50 words (this is critical)
- Reference the rover's specific equipment/traits in the mission
- Sound like a brief mission log or dispatch
- Be action-oriented and exciting
- Vary between different mission types: reconnaissance, cleanup, sample collection, rescue, repair, exploration, documentation, etc.

Write in third person, past tense. Example format: "Rover #1234 deployed to [location] and used its [trait/equipment] to [action]. [Brief result or discovery]."`;

    const userPrompt = `Generate a 50-word mission report for ${roverName || 'this Rover'} with these traits: ${traitDescription}. Make the mission directly utilize one or more of these specific traits/equipment.`;

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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your account." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const mission = data.choices?.[0]?.message?.content;

    console.log('Mission generated successfully');

    return new Response(JSON.stringify({ mission }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Error in generate-mission function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
