import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin securely using environment variables
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // This line ensures private key newlines are read properly by Node.js
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined
    })
  });
}

const db = getFirestore();

// Helper so every response is guaranteed valid JSON with the right header.
// Your frontend checks for "application/json" before parsing — without this
// header, even a successful function call would look like a failure.
const jsonResponse = (statusCode, payload) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

export const handler = async (event) => {
  // Security check to ensure it's a POST request
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  // Fail loudly (in JSON) if credentials are missing, instead of a confusing
  // downstream Firestore error.
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    return jsonResponse(500, {
      success: false,
      error:
        'Server is missing Firebase credentials. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Netlify site settings.'
    });
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { success: false, error: 'Invalid JSON body.' });
  }

  const cjProductId =
    typeof data.cjProductId === 'string' ? data.cjProductId.trim() : '';

  if (!cjProductId) {
    return jsonResponse(400, { success: false, error: 'cjProductId is required.' });
  }

  try {
    // TODO: this is where you'd call the real CJ Dropshipping API to fetch
    // the actual product name, images, variants, and price so you can apply
    // the 40% markup rule. Right now it just stores the raw ID as a placeholder.
    const productRef = db.collection('products').doc();
    const productData = {
      cjProductId,
      name: `Imported Product (${cjProductId})`,
      createdAt: FieldValue.serverTimestamp()
    };

    await productRef.set(productData);

    return jsonResponse(200, {
      success: true,
      product: { id: productRef.id, name: productData.name }
    });
  } catch (error) {
    console.error('Import error:', error);
    return jsonResponse(500, {
      success: false,
      error: error.message || 'Unknown server error.'
    });
  }
};