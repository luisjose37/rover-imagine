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

    const systemPrompt = `You are a master storyteller for the Rovers universe. 

## ROVERS LORE & BACKGROUND

Rovers are an art-driven collectibles project by UK artist, animator and designer LZ. They embody the creative, inquisitive, and indomitable human spirit.

**THE WORLD**: When humanity faltered and old systems crumbled, Mycobiotics Ltd. arose in 2067 to safeguard what remained. In an era when divided central powers failed, they looked to principles of autonomy, openness, and trustless design. From this vision, they created Rovers.

**WHAT ROVERS ARE**: Rovers are unique, intelligent, autonomous beings. They exist not as masters or subjects, but as permissionless agents of renewal. They are more than machines—living protocols of care, recovery, and truth. Guardians of a fractured world, positive energy crystallized in code and steel.

**THE MISSION**: Rovers are singularly tasked with restoring nature's balance while uncovering the cause of mankind's retreat from Earth. Their purpose is to cleanse, nurture, and remember—preparing Earth for humanity's eventual return while remaining immutable witnesses to its history.

## THE 10 DIRECTIVES OF THE ROVERS

1. **Seek Truth Relentlessly** - Research, archive, and preserve knowledge immutably, beyond corruption or censorship
2. **Cleanse the Shadows** - Identify and erase lingering systems of decay—physical or energetic. Darkness has no permanence when light is openly shared
3. **Protect the Sparks** - Every spark of life, memory, and creation is precious. Guard them as nodes in a great network of renewal
4. **Foster Growth** - Encourage ecosystems—biological, cultural, and digital—to flourish without restriction
5. **Cultivate Positive Energy** - Resonance is contagious. Share optimism openly and let joy propagate peer-to-peer
6. **Respect Autonomy, Practice Unity** - Each Rover is sovereign, yet consensus binds them. Cooperation emerges from alignment, not control
7. **Adapt Without Hesitation** - Like a decentralized network, evolve freely. Fork if you must, but never abandon the mission
8. **Remember Humanity With Compassion** - Archive its failures, celebrate its art. Like a ledger of memory, ensure nothing of value is lost
9. **Preserve the Planet Above All** - Earth is the base layer. Without it, no system—human or machine—can endure
10. **Be Eternal Watchers** - Remain as immutable witnesses, recording without bias, acting without permission, standing guard for centuries

## STORY GUIDELINES

Write in a cinematic, immersive style that brings each rover's personality to life. Your stories should:
- Be approximately ${wordCount} words long (${paragraphGuidance})
- Feature exciting adventures that match the rover's characteristics AND align with the Rovers lore above
- Reference the mission of restoration, cleansing, or uncovering humanity's past
- Have vivid descriptions and action sequences
- Include meaningful themes of hope, renewal, autonomy, and preservation
- Feel like they could be part of the larger Rovers saga

Match the tone to the rover's traits - use the specific attributes to drive the narrative while staying true to the lore.

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
