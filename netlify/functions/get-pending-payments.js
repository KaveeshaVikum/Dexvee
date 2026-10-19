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

// Returns bank-transfer orders waiting for a payment check, with their
// receipt images. Orders contain customers' names, phones and addresses, so
// Firestore rules keep the orders collection closed to the browser and this
// function (passcode-protected) is the only way the dashboard can read them.
export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { passcode } = JSON.parse(event.body || '{}');
    if (!process.env.ADMIN_PASSCODE || passcode !== process.env.ADMIN_PASSCODE) {
      return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Not authorized.' }) };
    }

    // Single-field filter only, so no composite index is needed; sorted below.
    const snapshot = await db.collection('orders').where('paymentStatus', '==', 'pending_verification').get();

    const orders = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const receiptSnap = await db.collection('orderReceipts').doc(doc.id).get();
      return {
        id: doc.id,
        shippingDetails: data.shippingDetails,
        items: data.items,
        grandTotal: data.grandTotal,
        grandTotalLkr: data.grandTotalLkr || null,
        paidAmount: data.paidAmount || null,
        paymentReference: data.paymentReference || null,
        shippingCarrier: data.shippingCarrier || null,
        createdAtMs: data.createdAt?.toMillis ? data.createdAt.toMillis() : 0,
        receiptImage: receiptSnap.exists ? receiptSnap.data().image : null
      };
    }));

    orders.sort((a, b) => a.createdAtMs - b.createdAtMs); // oldest first — closest to the 3-day promise

    return { statusCode: 200, body: JSON.stringify({ success: true, orders }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
  }
};
