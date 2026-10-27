import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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

class RequestError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

function getBearerToken(headers = {}) {
  const authorization = headers.authorization || headers.Authorization || '';
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  return match?.[1] || null;
}

function parseBody(body) {
  try {
    return JSON.parse(body || '{}');
  } catch {
    throw new RequestError(400, 'Invalid request body.');
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const token = getBearerToken(event.headers);
    if (!token) throw new RequestError(401, 'A valid Firebase ID token is required.');

    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(token);
    } catch {
      throw new RequestError(401, 'A valid Firebase ID token is required.');
    }

    const { orderId, action, reason } = parseBody(event.body);
    if (typeof orderId !== 'string' || !orderId.trim() || orderId.length > 1500 || orderId.includes('/')) {
      throw new RequestError(400, 'A valid orderId is required.');
    }
    if (!['cancel', 'return'].includes(action)) {
      throw new RequestError(400, 'Action must be "cancel" or "return".');
    }
    if (typeof reason !== 'string' || !reason.trim() || reason.trim().length > 1000) {
      throw new RequestError(400, 'Reason must contain between 1 and 1000 characters.');
    }

    const orderRef = db.collection('orders').doc(orderId.trim());
    const result = await db.runTransaction(async (transaction) => {
      const orderSnapshot = await transaction.get(orderRef);
      if (!orderSnapshot.exists) throw new RequestError(404, 'Order not found.');

      const order = orderSnapshot.data() || {};
      if (order.userId !== decoded.uid) throw new RequestError(403, 'You are not authorized to update this order.');

      const status = String(order.status || '').trim().toLowerCase();
      if (action === 'cancel') {
        const cancellableStatuses = new Set(['placed', 'processing', 'ready_to_ship']);
        if (!cancellableStatuses.has(status)) {
          throw new RequestError(409, 'This order can no longer accept a cancellation request.');
        }
      } else if (status !== 'delivered') {
        throw new RequestError(409, 'A return request can only be submitted for a delivered order.');
      }

      if (order.customerRequestStatus) {
        throw new RequestError(409, 'A customer request has already been submitted for this order.');
      }

      transaction.update(orderRef, {
        customerRequestStatus: action === 'cancel' ? 'cancel_requested' : 'return_requested',
        customerRequest: {
          action,
          reason: reason.trim(),
          requestedAt: FieldValue.serverTimestamp(),
          userId: decoded.uid
        }
      });
      return { customerRequestStatus: action === 'cancel' ? 'cancel_requested' : 'return_requested' };
    });

    return jsonResponse(200, { success: true, ...result });
  } catch (error) {
    const statusCode = error instanceof RequestError ? error.statusCode : 500;
    if (statusCode >= 500) console.error('Customer order action failed:', error?.message || 'unknown error');
    return jsonResponse(statusCode, {
      success: false,
      error: error instanceof RequestError ? error.message : 'Unable to submit the order request right now.'
    });
  }
};
