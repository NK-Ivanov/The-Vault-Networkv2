// Utility function to call Netlify Functions
export const callNetlifyFunction = async (functionName: string, body: any) => {
  // Priority order:
  // 1. Use VITE_APP_URL if set (production URL)
  // 2. Use VITE_NETLIFY_DEV_URL if set (local Netlify Dev)
  // 3. Detect localhost and use Netlify Dev proxy
  // 4. Fall back to production URL (vaultnet.work) for deployed functions
  
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  let baseUrl: string;
  if (import.meta.env.VITE_APP_URL) {
    // Production URL is set - use it (works after deployment)
    baseUrl = import.meta.env.VITE_APP_URL;
  } else if (import.meta.env.VITE_NETLIFY_DEV_URL) {
    // Netlify Dev URL is set
    baseUrl = import.meta.env.VITE_NETLIFY_DEV_URL;
  } else if (isLocalDev) {
    // Local development - try Netlify Dev proxy first, fallback to production
    baseUrl = 'http://localhost:8888';
  } else {
    // Fallback to production URL
    baseUrl = 'https://vaultnet.work';
  }
  
  const functionUrl = `${baseUrl}/.netlify/functions/${functionName}`;
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // If local dev fails, try production URL as fallback
      if (isLocalDev && baseUrl === 'http://localhost:8888') {
        const prodUrl = 'https://vaultnet.work/.netlify/functions/' + functionName;
        const prodResponse = await fetch(prodUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        
        if (!prodResponse.ok) {
          const error = await prodResponse.json();
          throw new Error(error.error || error.message || 'Function call failed');
        }
        
        return prodResponse.json();
      }
      
      const error = await response.json();
      throw new Error(error.error || error.message || 'Function call failed');
    }

    return response.json();
  } catch (error: any) {
    // If local dev fails completely, try production URL as last resort
    if (isLocalDev && baseUrl === 'http://localhost:8888') {
      try {
        const prodUrl = 'https://vaultnet.work/.netlify/functions/' + functionName;
        const prodResponse = await fetch(prodUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        
        if (!prodResponse.ok) {
          const errorData = await prodResponse.json();
          throw new Error(errorData.error || errorData.message || 'Function call failed');
        }
        
        return prodResponse.json();
      } catch (prodError) {
        throw error; // Throw original error
      }
    }
    
    throw error;
  }
};

