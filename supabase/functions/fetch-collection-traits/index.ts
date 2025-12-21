import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONTRACT_ADDRESS = '0xe0e7f149959c6cac0ddc2cb4ab27942bffda1eb4';
const COLLECTION_SLUG = 'rovers-by-mycobiotics-ltd';
const TOTAL_SUPPLY = 5000;

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
      return new Response(JSON.stringify({ traits: traitCache, totalSupply: TOTAL_SUPPLY, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch collection data first to get trait counts from the collection metadata
    const collectionUrl = `https://api.opensea.io/api/v2/collections/${COLLECTION_SLUG}`;
    
    console.log('Fetching collection data from OpenSea:', collectionUrl);

    const collectionResponse = await fetch(collectionUrl, {
      headers: {
        'X-API-KEY': OPENSEA_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (!collectionResponse.ok) {
      const errorText = await collectionResponse.text();
      console.error('OpenSea collection API error:', collectionResponse.status, errorText);
      throw new Error(`OpenSea API error: ${collectionResponse.status}`);
    }

    const collectionData = await collectionResponse.json();
    console.log('Collection data received');

    // Check if traits are in collection response
    const traitLookup: Record<string, Record<string, number>> = {};

    // OpenSea v2 includes traits in the collection response
    if (collectionData.traits) {
      console.log('Found traits in collection data');
      for (const [traitType, traitValues] of Object.entries(collectionData.traits)) {
        traitLookup[traitType] = {};
        for (const [value, count] of Object.entries(traitValues as Record<string, number>)) {
          traitLookup[traitType][value] = count;
        }
      }
    } else {
      console.log('No traits in collection data, sampling NFTs...');
      
      // Fallback: Sample NFTs to build trait counts
      // Fetch multiple pages of NFTs to get a good sample
      const sampleSize = 200; // Sample 200 NFTs
      let cursor: string | null = null;
      const allTraits: Array<{ trait_type: string; value: string }> = [];
      
      for (let i = 0; i < 2; i++) { // 2 pages of 100 each
        const nftsUrl: string = `https://api.opensea.io/api/v2/collection/${COLLECTION_SLUG}/nfts?limit=100${cursor ? `&next=${cursor}` : ''}`;
        
        console.log('Fetching NFTs page', i + 1);
        
        const nftsResponse: Response = await fetch(nftsUrl, {
          headers: {
            'X-API-KEY': OPENSEA_API_KEY,
            'Accept': 'application/json',
          },
        });

        if (!nftsResponse.ok) {
          console.error('Failed to fetch NFTs:', nftsResponse.status);
          break;
        }

        const nftsData: { nfts?: Array<{ traits?: Array<{ trait_type: string; value: string }> }>; next?: string } = await nftsResponse.json();
        
        for (const nft of nftsData.nfts || []) {
          if (nft.traits) {
            allTraits.push(...nft.traits);
          }
        }
        
        cursor = nftsData.next || null;
        if (!cursor) break;
        
        // Small delay between requests
        await new Promise(r => setTimeout(r, 200));
      }

      console.log('Collected traits from', allTraits.length, 'trait instances');

      // Count occurrences
      for (const trait of allTraits) {
        if (!traitLookup[trait.trait_type]) {
          traitLookup[trait.trait_type] = {};
        }
        traitLookup[trait.trait_type][trait.value] = (traitLookup[trait.trait_type][trait.value] || 0) + 1;
      }

      // Scale counts to total supply (since we only sampled)
      const sampledNfts = allTraits.length / Object.keys(traitLookup).length || 1;
      const scaleFactor = TOTAL_SUPPLY / sampledNfts;
      
      console.log('Sample size:', sampledNfts, 'Scale factor:', scaleFactor);
      
      // Note: For accuracy, we're keeping actual counts. The front-end will calculate rarity properly.
    }

    // Cache the result
    traitCache = traitLookup;
    cacheTimestamp = now;

    console.log('Trait lookup table created:', Object.keys(traitLookup).length, 'trait types');

    return new Response(JSON.stringify({ 
      traits: traitLookup, 
      totalSupply: TOTAL_SUPPLY,
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
