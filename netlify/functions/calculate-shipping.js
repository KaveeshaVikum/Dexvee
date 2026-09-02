// Calls CJ Dropshipping's freight calculation API to get a real shipping
// quote for whatever's in the cart, instead of a made-up flat rate.
// Docs: https://developers.cjdropshipping.cn/en/api/api2/api/logistic.html

let cachedToken = null;
let cachedTokenFetchedAt = 0;
const TOKEN_TTL_MS = 23 * 60 * 60 * 1000; // refresh a little before CJ's 24h window

async function getCjAccessToken(apiKey) {
  const isFresh = cachedToken && (Date.now() - cachedTokenFetchedAt) < TOKEN_TTL_MS;
  if (isFresh) return cachedToken;

  const authResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey })
  });
  const authData = await authResponse.json();

  if (!authData?.data?.accessToken) {
    throw new Error(`CJ authentication failed: ${authData.message || 'No access token returned.'}`);
  }

  cachedToken = authData.data.accessToken;
  cachedTokenFetchedAt = Date.now();
  return cachedToken;
}

// Rough flat estimate (USD) used only when CJ can't quote something — either
// the cart item isn't a real CJ product (no vid), or CJ has no shipping
// route configured for the destination country for that specific item.
const FALLBACK_PER_ITEM_USD = 2.5;

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { items, destCountryCode } = JSON.parse(event.body);

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('No cart items provided.');
    }

    const endCountryCode = destCountryCode || 'LK';

    // Only items with a real CJ variant id can be quoted by CJ's API.
    const cjItems = items.filter((i) => i.vid);
    const fallbackQuantity = items
      .filter((i) => !i.vid)
      .reduce((sum, i) => sum + (i.quantity || 1), 0);

    let cjShippingCost = 0;
    let breakdown = null;
    let isLiveQuote = false;
    let fallbackReason = null;

    if (cjItems.length > 0) {
      const apiKey = process.env.VITE_CJ_API_TOKEN || process.env.CJ_API_TOKEN;
      if (!apiKey) throw new Error('CJ API Key is missing in Netlify Environment Variables!');

      const accessToken = await getCjAccessToken(apiKey);

      const res = await fetch('https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate', {
        method: 'POST',
        headers: { 'CJ-Access-Token': accessToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startCountryCode: 'CN',
          endCountryCode,
          products: cjItems.map((i) => ({ vid: i.vid, quantity: i.quantity || 1 }))
        })
      });
      const result = await res.json();

      // Log the raw CJ response so you can check Netlify function logs and
      // see exactly why a quote did or didn't come back for a given product.
      console.log('CJ freightCalculate response for', endCountryCode, ':', JSON.stringify(result));

      if (Array.isArray(result?.data) && result.data.length > 0) {
        // Pick the cheapest available shipping method for this destination.
        const cheapest = result.data.reduce(
          (min, option) => (option.logisticPrice < min.logisticPrice ? option : min),
          result.data[0]
        );
        cjShippingCost = cheapest.logisticPrice;
        breakdown = {
          carrier: cheapest.logisticName,
          etaDays: cheapest.logisticAging
        };
        isLiveQuote = true;
      } else {
        // CJ returned no shipping method for this destination/product combo.
        // This is common for smaller/less common destinations like LK if the
        // supplier hasn't configured a logistics line there — it's not a bug
        // in this code, it's a real gap in what CJ can quote for that item.
        fallbackReason = result?.message || `CJ has no shipping route to ${endCountryCode} for this product.`;
        cjShippingCost = cjItems.reduce((sum, i) => sum + (i.quantity || 1), 0) * FALLBACK_PER_ITEM_USD;
      }
    }

    const fallbackCost = fallbackQuantity * FALLBACK_PER_ITEM_USD;
    const totalShippingCost = parseFloat((cjShippingCost + fallbackCost).toFixed(2));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        shippingCost: totalShippingCost,
        breakdown,
        isLiveQuote, // true only when this came from a real CJ freight quote
        fallbackReason, // why we fell back, when we did
        estimatedItemCount: fallbackQuantity
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};