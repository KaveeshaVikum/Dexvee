import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeOrderNumber(value) {
  return String(value || '').trim();
}

function safeDate(value) {
  return value?.toMillis ? value.toMillis() : null;
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, error: 'Method Not Allowed' }) };
  }

  try {
    const { orderNumber, identity } = JSON.parse(event.body || '{}');
    const requestedOrderNumber = normalizeOrderNumber(orderNumber);
    const requestedIdentity = normalize(identity);

    if (!requestedOrderNumber || !requestedIdentity || requestedOrderNumber.length > 80 || requestedIdentity.length > 160) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Invalid tracking request.' }) };
    }

    const snapshot = await db.collection('orders')
      .where('orderNumber', '==', requestedOrderNumber)
      .limit(1)
      .get();

    // Use the same message for a missing order and a failed identity check.
    // This avoids revealing whether an order number exists.
    if (snapshot.empty) {
      return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Order not found.' }) };
    }

    const orderDoc = snapshot.docs[0];
    const order = orderDoc.data();
    const emailMatches = normalize(order.shippingDetails?.email) === requestedIdentity;
    const phoneLast4 = String(order.shippingDetails?.phone || '').replace(/\D/g, '').slice(-4);
    const phoneMatches = /^\d{4}$/.test(requestedIdentity) && phoneLast4 === requestedIdentity;

    if (!emailMatches && !phoneMatches) {
      return { statusCode: 404, body: JSON.stringify({ success: false, error: 'Order not found.' }) };
    }

    const firstItem = Array.isArray(order.items) ? order.items[0] : null;
    const status = order.paymentStatus === 'pending_verification'
      ? 'pending_verification'
      : order.paymentStatus === 'rejected'
        ? 'cancelled'
        : order.cjOrderStatus === 'created' && order.status === 'placed'
          ? 'processing'
          : String(order.status || 'placed').toLowerCase();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        order: {
          orderNumber: order.orderNumber || orderDoc.id,
          productName: firstItem?.name || 'Your order',
          quantity: Array.isArray(order.items)
            ? order.items.reduce((total, item) => total + (Number(item.quantity) || 0), 0)
            : 1,
          status,
          paymentStatus: order.paymentStatus || null,
          trackingNumber: order.trackingNumber || null,
          carrier: order.shippingCarrier || null,
          trackingUrl: order.trackingUrl || null,
          estimatedDelivery: order.estimatedDelivery || 'Delivery time varies by product and shipping route.',
          updatedAt: safeDate(order.updatedAt || order.createdAt)
        }
      })
    };
  } catch (error) {
    console.error('Guest order lookup error:', error);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: 'Unable to look up the order right now.' }) };
  }
};
