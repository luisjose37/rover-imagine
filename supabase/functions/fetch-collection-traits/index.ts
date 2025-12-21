import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONTRACT_ADDRESS = '0xe0e7f149959c6cac0ddc2cb4ab27942bffda1eb4';
const COLLECTION_SLUG = 'roversxyz';

// Cache for trait data (in-memory, resets on cold start)
let traitCache: Record<string, Record<string, number>> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 3600000; // 1 hour

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENSEA_API_KEY = Deno.env.get('OPENSEA_API_KEY');
    
    if (!OPENSEA_API_KEY) {
      console.error('OPENSEA_API_KEY is not configured');
      throw new Error('OpenSea API key is not configured');
    }

    // Check cache
    const now = Date.now();
    if (traitCache && (now - cacheTimestamp) < CACHE_TTL) {
      console.log('Returning cached trait data');
      return new Response(JSON.stringify({ traits: traitCache, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch collection stats which includes trait counts
    const url = `https://api.opensea.io/api/v2/collections/${COLLECTION_SLUG}`;
    
    console.log('Fetching collection data from OpenSea:', url);

    const response = await fetch(url, {
      headers: {
        'X-API-KEY': OPENSEA_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenSea API error:', response.status, errorText);
      throw new Error(`OpenSea API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Collection data received');

    // Get total supply from collection
    const totalSupply = data.total_supply || 5555; // Default to 5555 if not available

    // Now fetch traits from the traits endpoint
    const traitsUrl = `https://api.opensea.io/api/v2/traits/${COLLECTION_SLUG}`;
    
    console.log('Fetching traits from OpenSea:', traitsUrl);
    
    const traitsResponse = await fetch(traitsUrl, {
      headers: {
        'X-API-KEY': OPENSEA_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!traitsResponse.ok) {
      const errorText = await traitsResponse.text();
      console.error('OpenSea traits API error:', traitsResponse.status, errorText);
      throw new Error(`OpenSea traits API error: ${traitsResponse.status}`);
    }

    const traitsData = await traitsResponse.json();
    console.log('Traits data received:', JSON.stringify(traitsData, null, 2));

    // Process traits into a lookup table: { traitType: { traitValue: count } }
    const traitLookup: Record<string, Record<string, number>> = {};

    if (traitsData.categories) {
      for (const category of traitsData.categories) {
        const traitType = category.trait_type;
        traitLookup[traitType] = {};
        
        if (category.counts) {
          for (const trait of category.counts) {
            traitLookup[traitType][trait.value] = trait.count;
          }
        }
      }
    }

    // Cache the result
    traitCache = traitLookup;
    cacheTimestamp = now;

    console.log('Trait lookup table created:', Object.keys(traitLookup).length, 'trait types');

    return new Response(JSON.stringify({ 
      traits: traitLookup, 
      totalSupply,
      cached: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-collection-traits function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
