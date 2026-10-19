import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

async function getCjFirstVariantVid(cjProductId, accessToken) {
  const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/variant/query?pid=${cjProductId}`, {
    method: 'GET',
    headers: { 'CJ-Access-Token': accessToken, 'Content-Type': 'application/json' }
  });
  const result = await response.json();

  if (!Array.isArray(result?.data) || result.data.length === 0) {
    throw new Error(result?.message || 'No variants returned for this product.');
  }
  return result.data[0].vid || null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body || '{}');
    if (!process.env.ADMIN_PASSCODE || data.passcode !== process.env.ADMIN_PASSCODE) {
      return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Not authorized.' }) };
    }

    const apiKey = process.env.VITE_CJ_API_TOKEN || process.env.CJ_API_TOKEN;
    if (!apiKey) throw new Error('CJ API Key is missing in Netlify Environment Variables!');

    const snapshot = await db.collection('products').get();

    const needsBackfill = snapshot.docs.filter((doc) => {
      const data = doc.data();
      return data.cjProductId && !data.vid;
    });

    const results = { updated: 0, skipped: snapshot.size - needsBackfill.length, failed: [] };

    if (needsBackfill.length > 0) {
      const accessToken = await getCjAccessToken(apiKey);

      for (const doc of needsBackfill) {
        const data = doc.data();
        try {
          const vid = await getCjFirstVariantVid(data.cjProductId, accessToken);
          if (vid) {
            await doc.ref.update({ vid });
            results.updated += 1;
          } else {
            results.failed.push({ id: doc.id, name: data.name, reason: 'CJ returned no vid' });
          }
        } catch (err) {
          results.failed.push({ id: doc.id, name: data.name, reason: err.message });
        }
        // CJ rate-limits how many calls you can make per second — a short
        // pause between requests keeps a big catalog from tripping that limit.
        await sleep(350);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Backfill complete: ${results.updated} updated, ${results.skipped} already had a vid or aren't CJ products, ${results.failed.length} failed.`,
        ...results
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
