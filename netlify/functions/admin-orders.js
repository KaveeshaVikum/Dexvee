import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { authorizeAdmin } from './utils/admin-auth.js';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined
    })
  });
}

const db = getFirestore();
const ORDER_FIELDS = [
  'orderNumber',
  'createdAt',
  'items',
  'shippingDetails',
  'subtotal',
  'shippingCost',
  'grandTotal',
  'grandTotalLkr',
  'lkrRate',
  'paymentMethod',
  'paymentStatus',
  'status',
  'cjOrderStatus',
  'trackingNumber',
  'trackingUrl',
  'estimatedDelivery',
  'deliveredAt',
  'customerRequestStatus',
  'customerRequest',
  'adminNote'
];

function serialize(value) {
  if (value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
  }
  return value;
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  const result = await authorizeAdmin(event);
  if (!result.ok) return result.response;

  try {
    const snapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const orders = snapshot.docs.map((doc) => {
      const data = doc.data();
      const order = { id: doc.id };
      for (const field of ORDER_FIELDS) {
        order[field] = serialize(data[field] ?? null);
      }
      return order;
    });

    return jsonResponse(200, { success: true, orders });
  } catch (error) {
    console.error('Admin orders lookup failed:', error?.message || 'unknown error');
    return jsonResponse(500, { success: false, error: 'Unable to load orders right now.' });
  }
};
