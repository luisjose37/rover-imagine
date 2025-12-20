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

    const { roverName, traits, wordCount = 500 } = await req.json();

    if (!traits || traits.length === 0) {
      throw new Error('No traits provided for story generation');
    }

    // Build trait description for the AI
    const traitDescription = traits
      .map((t: { trait_type: string; value: string }) => `${t.trait_type}: ${t.value}`)
      .join('\n- ');

    // Calculate approximate paragraph count based on word count
    const paragraphGuidance = wordCount <= 500 
      ? "2-3 paragraphs" 
      : wordCount <= 1000 
        ? "4-6 paragraphs"
        : "6-8 paragraphs";

    const systemPrompt = `You are a master storyteller for the Rovers universe - a collection of digital rover explorers stored on the blockchain. Your stories are creative, adventurous, and deeply personalized based on each rover's unique traits.

Write in a cinematic, immersive style that brings each rover's personality to life. Your stories should:
- Be approximately ${wordCount} words long (${paragraphGuidance})
- Feature exciting adventures that match the rover's characteristics
- Have vivid descriptions and action sequences
- Include a meaningful conclusion or cliffhanger
- Feel like they could be part of a larger saga

Match the tone to the rover's traits - use the specific attributes to drive the narrative. For example:
- A rover with "Speed: Fast" might have a thrilling chase or race scene
- A rover with "Terrain: Rocky" might explore treacherous mountain passes
- A rover with "Mood: Calm" might discover hidden wonders in serene locations
- A rover with unique colors or designs should have those reflected in the story

IMPORTANT: Write EXACTLY ${wordCount} words. This is critical.`;

    const userPrompt = `Generate an exciting adventure story for a rover named "${roverName || 'Unknown Rover'}" with these specific traits:

- ${traitDescription}

Create a unique story that showcases this rover's personality and capabilities based on its attributes. Make it feel like an epic exploration adventure. Remember: the story must be approximately ${wordCount} words.`;

    console.log('Generating story for rover:', roverName);
    console.log('Traits:', traitDescription);
    console.log('Target word count:', wordCount);

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
