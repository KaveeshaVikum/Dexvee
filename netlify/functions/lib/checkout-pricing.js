const FALLBACK_PER_ITEM_USD = 2.5;
const MAX_CART_LINES = 30;
const MAX_CART_QUANTITY = 99;
const USD_LKR_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const EXTERNAL_TIMEOUT_MS = 7000;

let cachedCjToken = null;
let cachedCjTokenFetchedAt = 0;
let cachedUsdLkrRate = null;
let cachedUsdLkrFetchedAt = 0;

export class CheckoutValidationError extends Error {}

function roundUsd(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function safeJson(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = EXTERNAL_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function unavailableProduct(product) {
  const status = String(product.status || product.availability || '').toLowerCase();
  return product.available === false
    || product.isAvailable === false
    || product.isActive === false
    || product.active === false
    || product.inStock === false
    || (typeof product.stock === 'number' && product.stock <= 0)
    || (typeof product.quantityAvailable === 'number' && product.quantityAvailable <= 0)
    || product.removed === true
    || product.deleted === true
    || product.archived === true
    || product.deletedAt != null
    || ['removed', 'deleted', 'unavailable', 'archived', 'inactive', 'out_of_stock', 'out-of-stock', 'sold_out', 'sold-out'].includes(status);
}

function parseUnitPrice(product) {
  const rawPrice = product.sellingPrice !== undefined && product.sellingPrice !== null
    ? product.sellingPrice
    : product.price;
  const price = Number(rawPrice);
  if (!Number.isFinite(price) || price <= 0 || price > 1000000) return null;
  return roundUsd(price);
}

export async function loadCanonicalItems(db, submittedItems) {
  if (!Array.isArray(submittedItems) || submittedItems.length === 0) {
    throw new CheckoutValidationError('Order has no items.');
  }
  if (submittedItems.length > MAX_CART_LINES) {
    throw new CheckoutValidationError(`Cart exceeds the ${MAX_CART_LINES}-item limit.`);
  }

  const seenIds = new Set();
  let totalQuantity = 0;
  const requested = submittedItems.map((item) => {
    const id = typeof item?.id === 'string' ? item.id.trim() : '';
    const quantity = item?.quantity;
    if (!id || id.length > 1500 || id.includes('/')) {
      throw new CheckoutValidationError('A product ID is invalid. Please refresh your cart.');
    }
    if (seenIds.has(id)) throw new CheckoutValidationError('The cart contains a duplicate product. Please refresh your cart.');
    seenIds.add(id);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_CART_QUANTITY) {
      throw new CheckoutValidationError('Product quantities must be whole numbers between 1 and 99.');
    }
    totalQuantity += quantity;
    if (totalQuantity > MAX_CART_QUANTITY) {
      throw new CheckoutValidationError(`Cart quantity exceeds the ${MAX_CART_QUANTITY}-item limit.`);
    }
    return { id, quantity };
  });

  const snapshots = await Promise.all(requested.map(({ id }) => db.collection('products').doc(id).get()));
  return snapshots.map((snapshot, index) => {
    if (!snapshot.exists) throw new CheckoutValidationError(`A product in your cart is no longer available (ID ${requested[index].id}).`);
    const product = snapshot.data() || {};
    if (unavailableProduct(product)) throw new CheckoutValidationError(`“${String(product.name || 'A product').slice(0, 120)}” is no longer available.`);

    const unitPrice = parseUnitPrice(product);
    if (unitPrice === null) throw new CheckoutValidationError(`“${String(product.name || 'A product').slice(0, 120)}” has an invalid price and cannot be ordered.`);

    const image = typeof product.image === 'string'
      ? product.image.slice(0, 4000)
      : (Array.isArray(product.images) && typeof product.images[0] === 'string' ? product.images[0].slice(0, 4000) : '');
    const vid = typeof product.vid === 'string' && product.vid.trim() ? product.vid.trim().slice(0, 200) : null;
    const quantity = requested[index].quantity;
    return {
      id: snapshot.id,
      name: String(product.name || 'Unnamed Product').slice(0, 300),
      image,
      vid,
      supplier: String(product.supplier || 'CJ Dropshipping').slice(0, 120),
      quantity,
      price: unitPrice,
      lineTotal: roundUsd(unitPrice * quantity)
    };
  });
}

async function getCjAccessToken(apiKey) {
  if (cachedCjToken && Date.now() - cachedCjTokenFetchedAt < 23 * 60 * 60 * 1000) return cachedCjToken;
  const response = await fetchWithTimeout('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: safeJson({ apiKey })
  });
  if (!response.ok) throw new Error(`CJ authentication request failed (HTTP ${response.status}).`);
  const data = await response.json();
  if (!data?.data?.accessToken) throw new Error('CJ authentication did not return an access token.');
  cachedCjToken = data.data.accessToken;
  cachedCjTokenFetchedAt = Date.now();
  return cachedCjToken;
}

function fallbackQuote(items, reason) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return {
    shippingCost: roundUsd(itemCount * FALLBACK_PER_ITEM_USD),
    breakdown: null,
    carrier: null,
    isLiveQuote: false,
    fallbackReason: reason || 'A live CJ shipping quote was not available; estimated shipping is used.',
    estimatedItemCount: itemCount
  };
}

export async function quoteShipping(items) {
  const cjItems = items.filter((item) => item.vid);
  const nonCjQuantity = items.filter((item) => !item.vid).reduce((sum, item) => sum + item.quantity, 0);
  if (!cjItems.length) return fallbackQuote(items, 'No cart items have a CJ variant ID; estimated shipping is used.');

  const apiKey = process.env.VITE_CJ_API_TOKEN || process.env.CJ_API_TOKEN;
  if (!apiKey) return fallbackQuote(items, 'CJ shipping is temporarily unavailable; estimated shipping is used.');

  try {
    const accessToken = await getCjAccessToken(apiKey);
    const response = await fetchWithTimeout('https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate', {
      method: 'POST',
      headers: { 'CJ-Access-Token': accessToken, 'Content-Type': 'application/json' },
      body: safeJson({
        startCountryCode: 'CN',
        endCountryCode: 'LK',
        products: cjItems.map(({ vid, quantity }) => ({ vid, quantity }))
      })
    });
    if (!response.ok) throw new Error(`CJ freight request failed (HTTP ${response.status}).`);
    const result = await response.json();
    const quotes = Array.isArray(result?.data) ? result.data.map((option) => ({
      price: Number(option?.logisticPrice),
      carrier: typeof option?.logisticName === 'string' ? option.logisticName.trim().slice(0, 200) : '',
      etaDays: typeof option?.logisticAging === 'string'
        ? option.logisticAging.slice(0, 80)
        : (Number.isFinite(Number(option?.logisticAging)) ? Number(option.logisticAging) : null)
    })).filter((option) => Number.isFinite(option.price) && option.price >= 0 && option.carrier) : [];

    if (!quotes.length) {
      return fallbackQuote(items, 'CJ did not return a usable shipping route to Sri Lanka; estimated shipping is used.');
    }

    const cheapest = quotes.reduce((min, option) => option.price < min.price ? option : min, quotes[0]);
    const shippingCost = roundUsd(cheapest.price + nonCjQuantity * FALLBACK_PER_ITEM_USD);
    return {
      shippingCost,
      breakdown: { carrier: cheapest.carrier, etaDays: cheapest.etaDays ?? null },
      carrier: cheapest.carrier,
      isLiveQuote: true,
      fallbackReason: nonCjQuantity ? 'Items without a CJ variant use estimated shipping.' : null,
      estimatedItemCount: nonCjQuantity
    };
  } catch (error) {
    console.warn('[Dexvee] CJ freight quote unavailable:', error?.message || 'request failed');
    return fallbackQuote(items, 'CJ shipping is temporarily unavailable; estimated shipping is used.');
  }
}

export async function getUsdToLkrRate() {
  if (cachedUsdLkrRate && Date.now() - cachedUsdLkrFetchedAt < USD_LKR_CACHE_TTL_MS) return cachedUsdLkrRate;

  const sources = [
    'https://open.er-api.com/v6/latest/USD',
    'https://api.exchangerate-api.com/v4/latest/USD'
  ];
  for (const url of sources) {
    try {
      const response = await fetchWithTimeout(url, {}, 4500);
      if (!response.ok) continue;
      const data = await response.json();
      const rate = Number(data?.rates?.LKR);
      if (Number.isFinite(rate) && rate > 0) {
        cachedUsdLkrRate = rate;
        cachedUsdLkrFetchedAt = Date.now();
        return rate;
      }
    } catch {
      // Try the secondary provider before the final emergency fallback.
    }
  }

  return cachedUsdLkrRate || 300;
}

export function roundCheckoutUsd(value) {
  return roundUsd(value);
}

export function checkoutConstants() {
  return { freeShippingThresholdUsd: 50, fallbackPerItemUsd: FALLBACK_PER_ITEM_USD };
}
