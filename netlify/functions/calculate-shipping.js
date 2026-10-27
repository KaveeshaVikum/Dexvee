import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { CheckoutValidationError, getUsdToLkrRate, loadCanonicalItems, quoteShipping } from './lib/checkout-pricing.js';

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

function jsonResponse(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    let data;
    try {
      data = JSON.parse(event.body || '{}');
    } catch {
      return jsonResponse(400, { success: false, error: 'Invalid request body.' });
    }

    // Client-supplied variant IDs and destination are deliberately ignored.
    // This store currently ships to Sri Lanka and variants come from product docs.
    const items = await loadCanonicalItems(db, data.items);
    const quote = await quoteShipping(items);
    const lkrRate = await getUsdToLkrRate();

    return jsonResponse(200, {
      success: true,
      shippingCost: quote.shippingCost,
      breakdown: quote.breakdown,
      carrier: quote.carrier,
      isLiveQuote: quote.isLiveQuote,
      fallbackReason: quote.fallbackReason,
      estimatedItemCount: quote.estimatedItemCount,
      destCountryCode: 'LK',
      lkrRate
    });
  } catch (error) {
    console.error('Shipping calculation failed:', error?.message || 'unknown error');
    const message = String(error?.message || 'Unable to calculate shipping.');
    const statusCode = error instanceof CheckoutValidationError ? 400 : 500;
    return jsonResponse(statusCode, {
      success: false,
      error: statusCode === 400 ? message : 'Unable to calculate shipping right now.'
    });
  }
};
