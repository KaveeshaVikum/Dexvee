import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import {
  CheckoutValidationError,
  getUsdToLkrRate,
  loadCanonicalItems,
  quoteShipping,
  roundCheckoutUsd
} from './lib/checkout-pricing.js';

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
let cachedCjToken = null;
let cachedCjTokenFetchedAt = 0;
const TOKEN_TTL_MS = 23 * 60 * 60 * 1000;

class RequestError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 7000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function getCjAccessToken(apiKey) {
  if (cachedCjToken && Date.now() - cachedCjTokenFetchedAt < TOKEN_TTL_MS) return cachedCjToken;

  const authResponse = await fetchWithTimeout('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey })
  });
  if (!authResponse.ok) throw new Error(`CJ authentication request failed (HTTP ${authResponse.status}).`);
  const authData = await authResponse.json();
  if (!authData?.data?.accessToken) throw new Error('CJ authentication did not return an access token.');

  cachedCjToken = authData.data.accessToken;
  cachedCjTokenFetchedAt = Date.now();
  return cachedCjToken;
}

// payType 3 creates a CJ order for manual review; it does not auto-pay.
// Exported so review-payment.js can reuse it after a bank transfer is approved.
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

  const response = await fetchWithTimeout('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV2', {
    method: 'POST',
    headers: { 'CJ-Access-Token': accessToken, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`CJ order request failed (HTTP ${response.status}).`);
  const result = await response.json();
  if (result?.result === true || result?.code === 200) {
    return { success: true, cjOrderId: result?.data?.orderId || result?.data || null };
  }
  return { success: false, error: String(result?.message || 'CJ rejected the order.').slice(0, 300) };
}

// Shared by this file and review-payment.js — returns fields stored on orders.
export async function attemptCjForward({ orderId, shippingDetails, items, shippingCarrier }) {
  const cjItems = items.filter((item) => item.vid);
  if (!cjItems.length) {
    return { cjOrderStatus: 'skipped_no_cj_items', cjOrderId: null, cjError: 'No items in this order have a CJ variant id — nothing to forward automatically.' };
  }
  if (!shippingCarrier) {
    return { cjOrderStatus: 'skipped_no_live_quote', cjOrderId: null, cjError: 'No confirmed live CJ shipping quote was available — order needs manual fulfillment.' };
  }

  const apiKey = process.env.VITE_CJ_API_TOKEN || process.env.CJ_API_TOKEN;
  if (!apiKey) return { cjOrderStatus: 'failed', cjOrderId: null, cjError: 'CJ API key is missing in Netlify Environment Variables.' };

  try {
    const result = await createCjOrder({ orderId, shippingDetails, cjItems, shippingCarrier, apiKey });
    if (result.success) return { cjOrderStatus: 'created', cjOrderId: result.cjOrderId, cjError: null };
    return { cjOrderStatus: 'failed', cjOrderId: null, cjError: result.error };
  } catch (error) {
    return { cjOrderStatus: 'failed', cjOrderId: null, cjError: String(error?.message || 'CJ request failed.').slice(0, 300) };
  }
}

async function saveReceipt(orderId, receiptImageBase64) {
  if (typeof receiptImageBase64 !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(receiptImageBase64)) {
    throw new RequestError('Receipt must be a JPEG, PNG or WebP image.');
  }
  if (receiptImageBase64.length > 900 * 1024) {
    throw new RequestError('Receipt image is still too large after compression. Please upload a smaller screenshot.');
  }
  await db.collection('orderReceipts').doc(orderId).set({
    image: receiptImageBase64,
    createdAt: FieldValue.serverTimestamp()
  });
}

function roundedLkr(amount, rate) {
  return Math.round((amount * rate + Number.EPSILON) * 100) / 100;
}

function jsonResponse(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  let receiptSavedFor = null;
  try {
    let data;
    try {
      data = JSON.parse(event.body || '{}');
    } catch {
      throw new RequestError('Invalid request body.');
    }

    const { items: submittedItems, shippingDetails, paymentMethod, receiptImageBase64, idToken, expectedTotal } = data;
    if (!shippingDetails?.name || !shippingDetails?.phone || !shippingDetails?.address || !shippingDetails?.city || !shippingDetails?.postalCode) {
      throw new RequestError('Shipping details are incomplete — name, phone, address, city and postal code are all required.');
    }
    if (paymentMethod !== 'BANK_TRANSFER') {
      throw new RequestError('Only bank transfer payments are accepted right now.');
    }
    if (!Number.isFinite(expectedTotal) || expectedTotal < 0) {
      throw new RequestError('The checkout total is missing. Please refresh your checkout and try again.');
    }
    if (typeof receiptImageBase64 !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(receiptImageBase64) || receiptImageBase64.length > 900 * 1024) {
      throw new RequestError('A valid, compressed bank transfer receipt image is required.');
    }

    const canonicalItems = await loadCanonicalItems(db, submittedItems);
    const subtotal = roundCheckoutUsd(canonicalItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const quote = await quoteShipping(canonicalItems);
    const shippingCost = subtotal > 50 ? 0 : quote.shippingCost;
    const grandTotal = roundCheckoutUsd(subtotal + shippingCost);
    const lkrRate = await getUsdToLkrRate();
    const grandTotalLkr = roundedLkr(grandTotal, lkrRate);

    const authoritative = {
      items: canonicalItems,
      subtotal,
      shippingCost,
      grandTotal,
      grandTotalLkr,
      lkrRate,
      shippingInfo: {
        carrier: quote.carrier,
        etaDays: quote.breakdown?.etaDays ?? null,
        isLiveQuote: quote.isLiveQuote,
        fallbackReason: quote.fallbackReason,
        quotedShippingCost: quote.shippingCost,
        estimatedItemCount: quote.estimatedItemCount
      }
    };

    if (Math.abs(expectedTotal - grandTotal) > 0.05) {
      return jsonResponse(409, {
        success: false,
        code: 'PRICE_CHANGED',
        error: 'Prices or shipping changed. Please review the updated total and submit your order again.',
        authoritative
      });
    }

    // Only a verified Firebase ID token can associate an order with an account;
    // missing/invalid tokens remain valid guest checkouts.
    let userId = null;
    if (idToken) {
      try {
        const decoded = await getAuth().verifyIdToken(idToken);
        userId = decoded.uid;
      } catch (error) {
        console.warn('Ignoring invalid ID token on order:', error?.message || 'verification failed');
      }
    }

    const orderRef = db.collection('orders').doc();
    const orderId = orderRef.id;
    await saveReceipt(orderId, receiptImageBase64);
    receiptSavedFor = orderId;

    // Bank transfers remain pending until an admin verifies the private receipt.
    const orderDocument = {
      orderNumber: orderId,
      userId,
      items: canonicalItems,
      shippingDetails: {
        name: String(shippingDetails.name).slice(0, 200),
        email: typeof shippingDetails.email === 'string' ? shippingDetails.email.slice(0, 320) : '',
        phone: String(shippingDetails.phone).slice(0, 100),
        address: String(shippingDetails.address).slice(0, 1000),
        city: String(shippingDetails.city).slice(0, 200),
        district: typeof shippingDetails.district === 'string' ? shippingDetails.district.slice(0, 200) : '',
        postalCode: String(shippingDetails.postalCode).slice(0, 40)
      },
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'pending_verification',
      hasReceipt: true,
      shippingCarrier: quote.isLiveQuote ? quote.carrier : null,
      shippingQuote: {
        isLiveQuote: quote.isLiveQuote,
        fallbackReason: quote.fallbackReason,
        quotedShippingCost: quote.shippingCost,
        etaDays: quote.breakdown?.etaDays ?? null,
        estimatedItemCount: quote.estimatedItemCount
      },
      subtotal,
      shippingCost,
      grandTotal,
      grandTotalLkr,
      lkrRate,
      status: 'placed',
      cjOrderStatus: 'not_applicable',
      cjOrderId: null,
      cjError: null,
      createdAt: FieldValue.serverTimestamp()
    };
    await orderRef.set(orderDocument);
    receiptSavedFor = null;

    return jsonResponse(200, {
      success: true,
      orderId,
      paymentStatus: orderDocument.paymentStatus,
      cjOrderStatus: orderDocument.cjOrderStatus,
      cjOrderId: null,
      cjError: null,
      authoritative
    });
  } catch (error) {
    if (receiptSavedFor) {
      try {
        await db.collection('orderReceipts').doc(receiptSavedFor).delete();
      } catch (cleanupError) {
        console.error('Failed to clean up an unlinked order receipt:', cleanupError?.message || 'cleanup failed');
      }
    }
    const isValidationError = error instanceof RequestError || error instanceof CheckoutValidationError;
    const statusCode = error instanceof RequestError ? error.statusCode : (isValidationError ? 400 : 500);
    if (statusCode >= 500) console.error('Place-order failed:', error?.message || 'unknown error');
    return jsonResponse(statusCode, { success: false, error: isValidationError ? error.message : 'Unable to place the order right now. Please try again.' });
  }
};
