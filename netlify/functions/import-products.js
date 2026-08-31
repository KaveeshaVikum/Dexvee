import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin securely
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
    })
  });
}

const db = getFirestore();

// CJ caches the same accessToken server-side for 24 hours per account, so we
// keep it in memory across warm function invocations to avoid an extra auth
// round trip on every single import.
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
    throw new Error(`CJ authentication failed: ${authData.message || 'No access token returned — double-check your API key.'}`);
  }

  cachedToken = authData.data.accessToken;
  cachedTokenFetchedAt = Date.now();
  return cachedToken;
}

// Accepts several input shapes and pulls out the real numeric CJ product ID:
//  - A full product page URL ending in "...-p-1786012676196409344.html"
//  - A URL with a "?pid=1786012676196409344" query param
//  - A bare numeric ID pasted directly
function extractCjProductId(rawInput) {
  const trimmed = rawInput.trim();

  const urlMatch = trimmed.match(/-p-(\d+)\.html/i);
  if (urlMatch) return urlMatch[1];

  const pidParamMatch = trimmed.match(/[?&]pid=([^&]+)/i);
  if (pidParamMatch) return pidParamMatch[1];

  const longDigitMatch = trimmed.match(/(\d{10,})/);
  if (longDigitMatch) return longDigitMatch[1];

  return trimmed.split('/').pop().split('?')[0];
}

// Fetches the product's descriptive data — NOT price, CJ doesn't return
// price here for variant-based products (see getCjProductVariants below).
async function getCjProductDetails(productId, accessToken) {
  const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${productId}`, {
    method: 'GET',
    headers: { 'CJ-Access-Token': accessToken, 'Content-Type': 'application/json' }
  });
  const result = await response.json();

  if (!result?.data) {
    throw new Error(`CJ API Error: ${result.message || 'Product not found. Check the ID.'}`);
  }
  return result.data;
}

// Fetches the product's real, per-variant pricing (color/size combinations
// each have their own price on CJ — there is no single top-level price).
async function getCjProductVariants(productId, accessToken) {
  const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/variant/query?pid=${productId}`, {
    method: 'GET',
    headers: { 'CJ-Access-Token': accessToken, 'Content-Type': 'application/json' }
  });
  const result = await response.json();

  if (!Array.isArray(result?.data) || result.data.length === 0) {
    throw new Error(`CJ API Error: ${result.message || 'No variants found for this product.'}`);
  }
  return result.data;
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const rawInput = data.cjProductId;

    if (!rawInput) {
      throw new Error("Product ID or URL is missing.");
    }

    const productId = extractCjProductId(rawInput);

    const apiKey = process.env.VITE_CJ_API_TOKEN || process.env.CJ_API_TOKEN;
    if (!apiKey) {
      throw new Error("CJ API Key is missing in Netlify Environment Variables!");
    }

    const accessToken = await getCjAccessToken(apiKey);

    // Fetch descriptive data and real per-variant pricing separately
    const productDetails = await getCjProductDetails(productId, accessToken);
    const variants = await getCjProductVariants(productId, accessToken);

    // productNameEn is the clean, single-string English name.
    // (productName is a stringified array of every language variant — not usable directly.)
    const productName = productDetails.productNameEn || 'Unnamed Product';

    // productImageSet is the real array of photos; bigImage is a single cover shot.
    const allImages = Array.isArray(productDetails.productImageSet) ? productDetails.productImageSet : [];
    const imageUrl = productDetails.bigImage || allImages[0] || '';

    // This product has multiple variants (color/size), each with its own price.
    // We use the first variant as the representative cost price for this listing —
    // fine for a simple importer, but worth knowing if you later want per-variant selling.
    const firstVariant = variants[0];
    const costPrice = parseFloat(firstVariant.variantSellPrice);

    if (isNaN(costPrice)) {
      throw new Error('Could not read a valid price from CJ variant data.');
    }

    // Apply the 40% Markup Rule & 50/50 Partner Payout Split
    const sellingPrice = parseFloat((costPrice * 1.40).toFixed(2));
    const totalProfit = parseFloat((sellingPrice - costPrice).toFixed(2));
    const partnerSplit = parseFloat((totalProfit / 2).toFixed(2));

    const productRef = db.collection('products').doc();

    const productDocument = {
      cjProductId: productId,
      name: productName,
      image: imageUrl,
      images: allImages,
      variantSku: firstVariant.variantSku || null,
      costPrice: costPrice,
      sellingPrice: sellingPrice,
      totalProfit: totalProfit,
      partnerSplit: partnerSplit,
      createdAt: FieldValue.serverTimestamp()
    };

    await productRef.set(productDocument);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Product imported and synced successfully!",
        product: productDocument
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};