// Converts and displays store prices in Sri Lankan Rupees (LKR).
//
// Prices are still stored internally in USD everywhere else in the app —
// that's what CJ Dropshipping and Firestore give us, and it keeps the math
// (markup %, profit split) simple and currency-agnostic. This file is the
// only place that turns a USD number into the "Rs. X,XXX.XX" string shown
// to shoppers and in the admin panel, using a live exchange rate that
// refreshes at most once every 24 hours.

const RATE_CACHE_KEY = 'dexvee_usd_lkr_rate';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FALLBACK_RATE = 300; // only used if there's no cache AND every API call fails

async function fetchLiveRate() {
  // Primary source — free, no API key required.
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    if (data?.rates?.LKR) return data.rates.LKR;
  } catch (err) {
    console.warn('[Dexvee] Primary USD→LKR rate source failed:', err);
  }

  // Fallback source, in case the first one is down or rate-limited.
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await res.json();
    if (data?.rates?.LKR) return data.rates.LKR;
  } catch (err) {
    console.warn('[Dexvee] Fallback USD→LKR rate source failed:', err);
  }

  return null;
}

// Returns the current USD→LKR rate. Fetches a fresh rate at most once every
// 24 hours; in between, reads from localStorage so we're not hitting the
// exchange rate API on every page load.
export async function getUsdToLkrRate() {
  let cached = null;
  try {
    cached = JSON.parse(localStorage.getItem(RATE_CACHE_KEY) || 'null');
  } catch (err) {
    cached = null;
  }

  const isFresh = cached && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS;
  if (isFresh) return cached.rate;

  const liveRate = await fetchLiveRate();
  const rate = liveRate || cached?.rate || FALLBACK_RATE;

  try {
    localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ rate, fetchedAt: Date.now() }));
  } catch (err) {
    // localStorage unavailable (e.g. private browsing) — not fatal, we just
    // re-fetch next load instead of caching.
  }

  return rate;
}

// Formats a USD amount as an LKR display string.
// e.g. formatLKR(28.92, 300) -> "Rs. 8,676.00"
export function formatLKR(usdAmount, rate) {
  const amount = (Number(usdAmount) || 0) * (rate || FALLBACK_RATE);
  return `Rs. ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
