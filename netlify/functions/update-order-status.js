import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
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
const ORDER_STATUSES = new Set([
  'placed',
  'processing',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'cancelled'
]);
const REQUEST_DECISIONS = new Set([
  'cancel_approved',
  'cancel_rejected',
  'return_approved',
  'return_rejected'
]);
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

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

function parseBody(event) {
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : (event.body || '{}');
    const body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid');
    return body;
  } catch {
    throw new RequestError(400, 'Invalid request body.');
  }
}

function cleanOptionalText(value, field, maxLength, pattern) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new RequestError(400, `Invalid ${field}.`);
  const cleaned = value.trim();
  if (cleaned.length > maxLength || CONTROL_CHARACTERS.test(cleaned) || /[<>]/.test(cleaned)) {
    throw new RequestError(400, `Invalid ${field}.`);
  }
  if (cleaned && pattern && !pattern.test(cleaned)) {
    throw new RequestError(400, `Invalid ${field}.`);
  }
  return cleaned;
}

function validateTrackingUrl(value) {
  const cleaned = cleanOptionalText(value, 'tracking URL', 2048);
  if (cleaned === undefined || cleaned === '') return cleaned;
  try {
    const url = new URL(cleaned);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
      throw new Error('invalid URL');
    }
  } catch {
    throw new RequestError(400, 'Tracking URL must be a valid HTTPS URL.');
  }
  return cleaned;
}

function validateInput(body) {
  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
  if (!orderId || orderId.length > 1500 || orderId.includes('/')) {
    throw new RequestError(400, 'A valid orderId is required.');
  }

  if (typeof body.status !== 'string' || !ORDER_STATUSES.has(body.status)) {
    throw new RequestError(400, 'A permitted order status is required.');
  }

  const trackingNumber = cleanOptionalText(
    body.trackingNumber,
    'tracking number',
    120,
    /^[\p{L}\p{N}][\p{L}\p{N} ._/#-]*$/u
  );
  const trackingUrl = validateTrackingUrl(body.trackingUrl);
  const estimatedDelivery = cleanOptionalText(
    body.estimatedDelivery,
    'estimated delivery',
    100,
    /^[\p{L}\p{N}][\p{L}\p{N} .,()/–—-]*$/u
  );
  const adminNote = cleanOptionalText(body.adminNote, 'admin note', 500);

  let requestStatus = body.requestStatus;
  if (requestStatus === undefined || requestStatus === null) requestStatus = '';
  if (typeof requestStatus !== 'string') throw new RequestError(400, 'Invalid request decision.');
  requestStatus = requestStatus.trim();
  if (requestStatus && !REQUEST_DECISIONS.has(requestStatus)) {
    throw new RequestError(400, 'Invalid request decision.');
  }

  return {
    orderId,
    status: body.status,
    trackingNumber,
    trackingUrl,
    estimatedDelivery,
    adminNote,
    requestStatus
  };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  const result = await authorizeAdmin(event);
  if (!result.ok) return result.response;

  try {
    const input = validateInput(parseBody(event));
    const orderRef = db.collection('orders').doc(input.orderId);
    const updated = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(orderRef);
      if (!snapshot.exists) throw new RequestError(404, 'Order not found.');

      const order = snapshot.data() || {};
      const currentStatus = String(order.status || '').trim();
      const changes = { updatedAt: FieldValue.serverTimestamp() };

      if (input.trackingNumber !== undefined) changes.trackingNumber = input.trackingNumber;
      if (input.trackingUrl !== undefined) changes.trackingUrl = input.trackingUrl;
      if (input.estimatedDelivery !== undefined) changes.estimatedDelivery = input.estimatedDelivery;

      if (input.requestStatus) {
        const isCancelDecision = input.requestStatus.startsWith('cancel_');
        const expectedRequestStatus = isCancelDecision ? 'cancel_requested' : 'return_requested';
        const expectedAction = isCancelDecision ? 'cancel' : 'return';
        const customerRequest = order.customerRequest || {};

        if (order.customerRequestStatus !== expectedRequestStatus || customerRequest.action !== expectedAction) {
          throw new RequestError(409, 'This decision does not match the current customer request.');
        }

        // A request decision is not a shipment-status edit. Only an approved,
        // still-cancellable request may move an order to cancelled.
        if (input.requestStatus === 'cancel_approved') {
          if (!['placed', 'processing', 'ready_to_ship'].includes(currentStatus)) {
            throw new RequestError(409, 'This order has progressed too far for cancellation approval.');
          }
          if (input.status !== currentStatus && input.status !== 'cancelled') {
            throw new RequestError(409, 'Save shipment status changes separately from a request decision.');
          }
          changes.status = 'cancelled';
        } else {
          if (input.status !== currentStatus) {
            throw new RequestError(409, 'Save shipment status changes separately from a request decision.');
          }
          if (!isCancelDecision && currentStatus !== 'delivered') {
            throw new RequestError(409, 'A return decision requires a delivered order.');
          }
        }

        changes.customerRequestStatus = input.requestStatus;
        changes.adminNote = input.adminNote ?? '';
      } else {
        changes.status = input.status;
        if (input.adminNote !== undefined) changes.adminNote = input.adminNote;
        if (input.status === 'delivered' && currentStatus !== 'delivered') {
          changes.deliveredAt = FieldValue.serverTimestamp();
        }
      }

      transaction.update(orderRef, changes);
      return {
        status: changes.status || currentStatus,
        customerRequestStatus: changes.customerRequestStatus || order.customerRequestStatus || null
      };
    });

    return jsonResponse(200, { success: true, ...updated });
  } catch (error) {
    const statusCode = error instanceof RequestError ? error.statusCode : 500;
    if (statusCode >= 500) console.error('Admin order update failed:', error?.message || 'unknown error');
    return jsonResponse(statusCode, {
      success: false,
      error: error instanceof RequestError ? error.message : 'Unable to update the order right now.'
    });
  }
};
