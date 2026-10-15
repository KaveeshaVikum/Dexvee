import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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

let cachedToken = null;
let cachedTokenFetchedAt = 0;
const TOKEN_TTL_MS = 23 * 60 * 60 * 1000;

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

// Creates the matching order on CJ. payType: 3 means CJ creates the order
// but does NOT pay for it automatically — it sits in MyCJ's dashboard for
// manual review and payment. Nothing is spent from the CJ balance until a
// person approves it there. This is deliberate: it's the safer default
// requested for this store, versus payType: 2 (auto-pay immediately).
// Exported so review-payment.js can reuse it once a bank transfer is approved.
export async function createCjOrder({ orderId, shippingDetails, cjItems, shippingCarrier, apiKey }) {
  const accessToken = await getCjAccessToken(apiKey);

  const payload = {
    orderNumber: orderId,
    shippingCountryCode: 'LK',
    shippingCountry: 'Sri Lanka',
    shippingProvince: shippingDetails.district || shippingDetails.city || '',
    shippingCity: shippingDetails.city || '',
    shippingAddress: shippingDetails.address || '',
    shippingCustomerName: shippingDetails.name || '',
    shippingZip: shippingDetails.postalCode || '',
    shippingPhone: shippingDetails.phone || '',
    email: shippingDetails.email || '',
    remark: `Dexvee order ${orderId}`,
    fromCountryCode: 'CN',
    logisticName: shippingCarrier,
    payType: 3,
    products: cjItems.map((item) => ({ vid: item.vid, quantity: item.quantity }))
  };

  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV2', {
    method: 'POST',
    headers: { 'CJ-Access-Token': accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();

  // Always log the raw response — CJ's exact success/failure shape can only
  // be confirmed against a real response, so check these logs the first few
  // times this runs to make sure the parsing below matches reality.
  console.log('CJ createOrderV2 response:', JSON.stringify(result));

  if (result?.result === true || result?.code === 200) {
    return { success: true, cjOrderId: result?.data?.orderId || result?.data || null, raw: result };
  }
  return { success: false, error: result?.message || 'CJ rejected the order.', raw: result };
}

// Shared by this file and review-payment.js — attempts to forward an order
// to CJ and returns the status fields that get written onto the order doc.
export async function attemptCjForward({ orderId, shippingDetails, items, shippingCarrier }) {
  const cjItems = items.filter((i) => i.vid);

  if (cjItems.length === 0) {
    return { cjOrderStatus: 'skipped_no_cj_items', cjOrderId: null, cjError: 'No items in this order have a CJ variant id — nothing to forward automatically.' };
  }
  if (!shippingCarrier) {
    return { cjOrderStatus: 'skipped_no_live_quote', cjOrderId: null, cjError: 'No confirmed live CJ shipping quote was available at checkout — order needs manual fulfillment.' };
  }

  const apiKey = process.env.VITE_CJ_API_TOKEN || process.env.CJ_API_TOKEN;
  if (!apiKey) {
    return { cjOrderStatus: 'failed', cjOrderId: null, cjError: 'CJ API key is missing in Netlify Environment Variables.' };
  }

  try {
    const result = await createCjOrder({ orderId, shippingDetails, cjItems, shippingCarrier, apiKey });
    if (result.success) {
      return { cjOrderStatus: 'created', cjOrderId: result.cjOrderId, cjError: null };
    }
    return { cjOrderStatus: 'failed', cjOrderId: null, cjError: result.error };
  } catch (err) {
    return { cjOrderStatus: 'failed', cjOrderId: null, cjError: err.message };
  }
}

// Saves a bank-transfer receipt (already compressed to a small JPEG in the
// browser) into its own private Firestore document. Kept out of the order
// document so order lists stay light, and out of any public bucket since a
// receipt can show bank details and names — it is only ever read back
// through admin-protected server functions, never directly by the browser.
async function saveReceipt(orderId, receiptImageBase64) {
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(receiptImageBase64)) {
    throw new Error('Receipt must be a JPEG, PNG or WebP image.');
  }
  // Firestore documents max out at 1 MiB, so cap the data URL well under that.
  if (receiptImageBase64.length > 900 * 1024) {
    throw new Error('Receipt image is still too large after compression. Please upload a smaller screenshot.');
  }
  await db.collection('orderReceipts').doc(orderId).set({
    image: receiptImageBase64,
    createdAt: FieldValue.serverTimestamp()
  });
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { items, shippingDetails, paymentMethod, subtotal, shippingCost, grandTotal, shippingCarrier, receiptImageBase64, grandTotalLkr, lkrRate, idToken } = data;

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Order has no items.');
    }
    if (!shippingDetails?.name || !shippingDetails?.phone || !shippingDetails?.address || !shippingDetails?.city || !shippingDetails?.postalCode) {
      throw new Error('Shipping details are incomplete — name, phone, address, city and postal code are all required.');
    }
    // Bank transfer is the only payment method currently offered. COD and card
    // are blocked here too, not just hidden in the UI, since anyone can call
    // this function directly.
    if (paymentMethod !== 'BANK_TRANSFER') {
      throw new Error('Only bank transfer payments are accepted right now.');
    }
    if (paymentMethod === 'BANK_TRANSFER' && !receiptImageBase64) {
      throw new Error('A payment receipt is required for bank transfer orders.');
    }

    // Who is ordering? Only trust a user id we verified ourselves from a
    // Firebase ID token. A missing or invalid token just means "guest".
    let userId = null;
    if (idToken) {
      try {
        const decoded = await getAuth().verifyIdToken(idToken);
        userId = decoded.uid;
      } catch (err) {
        console.warn('Ignoring invalid ID token on order:', err.message);
      }
    }

    const orderRef = db.collection('orders').doc();
    const orderId = orderRef.id;

    let hasReceipt = false;
    if (paymentMethod === 'BANK_TRANSFER') {
      await saveReceipt(orderId, receiptImageBase64);
      hasReceipt = true;
    }

    // Default: nothing to do with CJ yet.
    let cjOrderStatus = 'not_applicable';
    let cjOrderId = null;
    let cjError = null;

    // Payment confirmation state. Bank transfers sit pending until an admin
    // manually checks the receipt and approves it (within 3 business days,
    // per the store's stated policy) — that review step is what triggers
    // forwarding to CJ, not the moment the order is placed. COD and CARD
    // orders aren't blocked on anything, so they're "confirmed" immediately
    // from this order-tracking system's point of view.
    let paymentStatus = 'confirmed';

    if (paymentMethod === 'BANK_TRANSFER') {
      paymentStatus = 'pending_verification';
      // Deliberately NOT forwarding to CJ here — that happens in
      // review-payment.js once an admin actually confirms the receipt is
      // legitimate. Forwarding now, before anyone's checked the receipt,
      // would mean paying CJ for orders nobody's actually confirmed as paid.
    } else if (paymentMethod === 'CARD') {
      const forwardResult = await attemptCjForward({ orderId, shippingDetails, items, shippingCarrier });
      cjOrderStatus = forwardResult.cjOrderStatus;
      cjOrderId = forwardResult.cjOrderId;
      cjError = forwardResult.cjError;
    }

    await orderRef.set({
      orderNumber: orderId,
      userId, // null for guest orders; lets signed-in customers see their order history
      items,
      shippingDetails,
      paymentMethod, // 'COD' | 'CARD' | 'BANK_TRANSFER'
      paymentStatus, // 'confirmed' | 'pending_verification' | 'rejected'
      hasReceipt, // the image itself lives in orderReceipts/{orderId}
      shippingCarrier: shippingCarrier || null, // kept so review-payment.js can forward to CJ later using the same quoted carrier
      subtotal,
      shippingCost,
      grandTotal,
      grandTotalLkr: grandTotalLkr || null, // LKR amount shown at checkout — what a bank transfer should match
      lkrRate: lkrRate || null,
      status: 'placed',
      cjOrderStatus, // 'not_applicable' | 'created' | 'failed' | 'skipped_no_cj_items' | 'skipped_no_live_quote'
      cjOrderId,
      cjError,
      createdAt: FieldValue.serverTimestamp()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, orderId, paymentStatus, cjOrderStatus, cjOrderId, cjError })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};