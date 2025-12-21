import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONTRACT_ADDRESS = '0xe0e7f149959c6cac0ddc2cb4ab27942bffda1eb4';
const CHAIN = 'ethereum';

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

    const { tokenId } = await req.json();

    if (!tokenId) {
      throw new Error('Token ID is required');
    }

    // Fetch specific NFT with metadata
    const url = `https://api.opensea.io/api/v2/chain/${CHAIN}/contract/${CONTRACT_ADDRESS}/nfts/${tokenId}`;

    console.log('Fetching NFT from OpenSea:', url);

    let response: Response;
    let retries = 3;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      response = await fetch(url, {
        headers: {
          'X-API-KEY': OPENSEA_API_KEY,
          'Accept': 'application/json',
        },
      });
      
      // If rate limited, wait and retry
      if (response.status === 429) {
        console.log(`Rate limited, attempt ${attempt + 1}/${retries}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      
      break;
    }

    if (!response!.ok) {
      const errorText = await response!.text();
      console.error('OpenSea API error:', response!.status, errorText);
      
      if (response!.status === 404) {
        throw new Error(`Rover #${tokenId} not found. Please check the token ID.`);
      }
      
      if (response!.status === 429) {
        throw new Error('Rate limited by OpenSea. Please wait a moment.');
      }
      
      throw new Error(`OpenSea API error: ${response!.status}`);
    }

    const data = await response!.json();
    console.log('OpenSea response received for token:', tokenId);
    console.log('NFT data:', JSON.stringify(data, null, 2));

    // The response contains "nft" for single NFT fetch
    const nft = data.nft;
    
    if (!nft) {
      throw new Error('NFT data not found in response');
    }

    // Format the response with traits
    const formattedNFT = {
      identifier: nft.identifier,
      name: nft.name || `Rover #${nft.identifier}`,
      image_url: nft.image_url || nft.display_image_url,
      description: nft.description,
      traits: nft.traits || [],
      opensea_url: nft.opensea_url,
    };

    console.log('Formatted NFT with traits count:', formattedNFT.traits.length);

    return new Response(JSON.stringify(formattedNFT), {
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
