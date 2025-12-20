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
    const OPENSEA_API_KEY = Deno.env.get('OPENSEA_API_KEY');
    
    if (!OPENSEA_API_KEY) {
      console.error('OPENSEA_API_KEY is not configured');
      throw new Error('OpenSea API key is not configured');
    }

    const { tokenId, limit = 20, cursor } = await req.json();

    let url: string;
    
    if (tokenId) {
      // Fetch specific NFT
      url = `https://api.opensea.io/api/v2/chain/ethereum/contract/0x9a45f43c96d57af21e4ec0724a9e2f8c5b6e4d4c/nfts/${tokenId}`;
    } else {
      // Fetch collection NFTs
      url = `https://api.opensea.io/api/v2/collection/roversxyz/nfts?limit=${limit}${cursor ? `&next=${cursor}` : ''}`;
    }

    console.log('Fetching from OpenSea:', url);

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
    console.log('OpenSea response received, NFT count:', data.nfts?.length || 1);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-nfts function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
