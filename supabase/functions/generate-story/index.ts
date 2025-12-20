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

    const { roverName, traits, imageUrl } = await req.json();

    if (!traits || traits.length === 0) {
      throw new Error('No traits provided for story generation');
    }

    // Build trait description for the AI
    const traitDescription = traits
      .map((t: { trait_type: string; value: string }) => `${t.trait_type}: ${t.value}`)
      .join(', ');

    const systemPrompt = `You are a master storyteller for the Rovers universe - a collection of digital rover explorers stored on the blockchain. Your stories are creative, adventurous, and deeply personalized based on each rover's unique traits.

Write in a cinematic, immersive style that brings each rover's personality to life. Your stories should:
- Be 2-3 paragraphs long (around 200-300 words)
- Feature exciting adventures that match the rover's characteristics
- Have vivid descriptions and action sequences
- Include a meaningful conclusion or cliffhanger
- Feel like they could be part of a larger saga

Match the tone to the rover's traits - a fast rover might have a chase scene, a rugged rover might explore harsh terrain, a serene rover might discover hidden wonders.`;

    const userPrompt = `Generate an exciting adventure story for a rover named "${roverName || 'Unknown Rover'}" with these traits:

${traitDescription}

Create a unique story that showcases this rover's personality and capabilities based on its attributes. Make it feel like an epic space/terrain exploration adventure.`;

    console.log('Generating story for rover:', roverName);
    console.log('Traits:', traitDescription);

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
        stream: true,
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

    // Return the stream directly
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error('Error in generate-story function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
