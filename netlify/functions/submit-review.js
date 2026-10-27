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

function getAuthorName(decoded) {
  const displayName = typeof decoded.name === 'string'
    ? decoded.name
    : typeof decoded.displayName === 'string'
      ? decoded.displayName
      : '';
  const cleaned = displayName.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120);
  return cleaned || 'Verified customer';
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

    const { orderId, productId, rating, text } = parseBody(event.body);
    if (typeof orderId !== 'string' || !orderId.trim() || orderId.length > 1500 || orderId.includes('/')) {
      throw new RequestError(400, 'A valid orderId is required.');
    }
    if (typeof productId !== 'string' || !productId.trim() || productId.length > 1500 || productId.includes('/')) {
      throw new RequestError(400, 'A valid productId is required.');
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new RequestError(400, 'Rating must be an integer from 1 to 5.');
    }
    if (typeof text !== 'string' || text.trim().length < 5 || text.trim().length > 1500) {
      throw new RequestError(400, 'Review text must contain between 5 and 1500 characters.');
    }

    const normalizedOrderId = orderId.trim();
    const normalizedProductId = productId.trim();
    const reviewId = `${normalizedOrderId}_${normalizedProductId}`;
    if (Buffer.byteLength(reviewId, 'utf8') > 1500) {
      throw new RequestError(400, 'The order and product identifiers are too long.');
    }

    const orderRef = db.collection('orders').doc(normalizedOrderId);
    const productRef = db.collection('products').doc(normalizedProductId);
    const reviewRef = db.collection('productReviews').doc(reviewId);
    const authorName = getAuthorName(decoded);
    const reviewText = text.trim();

    await db.runTransaction(async (transaction) => {
      const [orderSnapshot, productSnapshot, reviewSnapshot] = await Promise.all([
        transaction.get(orderRef),
        transaction.get(productRef),
        transaction.get(reviewRef)
      ]);

      if (!orderSnapshot.exists) throw new RequestError(404, 'Order not found.');
      const order = orderSnapshot.data() || {};
      if (order.userId !== decoded.uid) throw new RequestError(403, 'You are not authorized to review this order.');

      const status = String(order.status || '').trim().toLowerCase();
      if (!['delivered', 'complete', 'completed'].includes(status)) {
        throw new RequestError(409, 'Reviews can only be submitted for delivered orders.');
      }
      const items = Array.isArray(order.items) ? order.items : [];
      const hasPurchasedProduct = items.some((item) =>
        (typeof item?.id === 'string' && item.id === normalizedProductId)
        || (typeof item?.productId === 'string' && item.productId === normalizedProductId)
      );
      if (!hasPurchasedProduct) {
        throw new RequestError(403, 'This product is not part of the specified order.');
      }
      if (!productSnapshot.exists) throw new RequestError(404, 'Product not found.');
      if (reviewSnapshot.exists) throw new RequestError(409, 'A review has already been submitted for this product and order.');

      const uniqueOrderProductIds = [...new Set(items.flatMap((item) => {
        const id = typeof item?.id === 'string' ? item.id : item?.productId;
        return typeof id === 'string' && id ? [id] : [];
      }))];
      const reviewedProductIds = new Set(
        Array.isArray(order.reviewedProductIds)
          ? order.reviewedProductIds.filter((id) => typeof id === 'string')
          : []
      );
      reviewedProductIds.add(normalizedProductId);
      const allProductsReviewed = uniqueOrderProductIds.length > 0
        && uniqueOrderProductIds.every((id) => reviewedProductIds.has(id));

      const product = productSnapshot.data() || {};
      const currentCount = Number.isInteger(product.reviewsCount) && product.reviewsCount >= 0
        ? product.reviewsCount
        : 0;
      const currentRating = Number.isFinite(Number(product.rating))
        ? Number(product.rating)
        : 0;
      const nextCount = currentCount + 1;
      const nextRating = Math.round((((currentCount * currentRating) + rating) / nextCount) * 100) / 100;

      transaction.create(reviewRef, {
        productId: normalizedProductId,
        orderId: normalizedOrderId,
        userId: decoded.uid,
        rating,
        text: reviewText,
        authorName,
        verifiedPurchase: true,
        createdAt: FieldValue.serverTimestamp()
      });
      transaction.update(productRef, {
        rating: nextRating,
        reviewsCount: nextCount
      });
      transaction.update(orderRef, {
        reviewedProductIds: [...reviewedProductIds],
        reviewSubmittedAt: allProductsReviewed ? FieldValue.serverTimestamp() : FieldValue.delete()
      });
    });

    return jsonResponse(200, { success: true, reviewId });
  } catch (error) {
    const statusCode = error instanceof RequestError ? error.statusCode : 500;
    if (statusCode >= 500) console.error('Review submission failed:', error?.message || 'unknown error');
    return jsonResponse(statusCode, {
      success: false,
      error: error instanceof RequestError ? error.message : 'Unable to submit the review right now.'
    });
  }
};
