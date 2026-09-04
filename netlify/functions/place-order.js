import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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
async function createCjOrder({ orderId, shippingDetails, cjItems, shippingCarrier, apiKey }) {
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

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const { items, shippingDetails, paymentMethod, subtotal, shippingCost, grandTotal, shippingCarrier } = data;

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Order has no items.');
    }
    if (!shippingDetails?.name || !shippingDetails?.phone || !shippingDetails?.address) {
      throw new Error('Shipping details are incomplete.');
    }

    const orderRef = db.collection('orders').doc();
    const orderId = orderRef.id;

    // Default: nothing to do with CJ (e.g. Cash on Delivery — no money has
    // been collected yet, so we never auto-forward those).
    let cjOrderStatus = 'not_applicable';
    let cjOrderId = null;
    let cjError = null;

    if (paymentMethod === 'CARD') {
      const cjItems = items.filter((i) => i.vid);

      if (cjItems.length === 0) {
        cjOrderStatus = 'skipped_no_cj_items';
        cjError = 'No items in this order have a CJ variant id — nothing to forward automatically.';
      } else if (!shippingCarrier) {
        // We only forward when checkout already got a real, live CJ shipping
        // quote — that's the only time we know a valid logisticName. Without
        // it, CJ would reject the order for a missing/invalid logistics
        // method, so it's safer to leave this one for manual handling.
        cjOrderStatus = 'skipped_no_live_quote';
        cjError = 'No confirmed live CJ shipping quote was available at checkout — order needs manual fulfillment.';
      } else {
        const apiKey = process.env.VITE_CJ_API_TOKEN || process.env.CJ_API_TOKEN;
        if (!apiKey) {
          cjOrderStatus = 'failed';
          cjError = 'CJ API key is missing in Netlify Environment Variables.';
        } else {
          try {
            const result = await createCjOrder({ orderId, shippingDetails, cjItems, shippingCarrier, apiKey });
            if (result.success) {
              cjOrderStatus = 'created';
              cjOrderId = result.cjOrderId;
            } else {
              cjOrderStatus = 'failed';
              cjError = result.error;
            }
          } catch (err) {
            cjOrderStatus = 'failed';
            cjError = err.message;
          }
        }
      }
    }

    await orderRef.set({
      orderNumber: orderId,
      items,
      shippingDetails,
      paymentMethod,
      subtotal,
      shippingCost,
      grandTotal,
      status: 'placed',
      cjOrderStatus, // 'not_applicable' | 'created' | 'failed' | 'skipped_no_cj_items' | 'skipped_no_live_quote'
      cjOrderId,
      cjError,
      createdAt: FieldValue.serverTimestamp()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, orderId, cjOrderStatus, cjOrderId, cjError })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};