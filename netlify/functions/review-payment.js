import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { attemptCjForward } from './place-order.js';

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

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { orderId, action, passcode } = JSON.parse(event.body);

    // The dashboard's own login is only a client-side check, so these
    // functions verify the passcode server-side before touching any order.
    if (!process.env.ADMIN_PASSCODE || passcode !== process.env.ADMIN_PASSCODE) {
      return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Not authorized.' }) };
    }

    if (!orderId || !['approve', 'reject'].includes(action)) {
      throw new Error('orderId and a valid action ("approve" or "reject") are required.');
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throw new Error('Order not found.');
    }

    const order = orderSnap.data();

    if (order.paymentMethod !== 'BANK_TRANSFER') {
      throw new Error('This order is not a bank transfer payment — nothing to review.');
    }
    if (order.paymentStatus !== 'pending_verification') {
      throw new Error(`This order has already been ${order.paymentStatus === 'confirmed' ? 'approved' : 'reviewed'}.`);
    }

    if (action === 'reject') {
      await orderRef.update({ paymentStatus: 'rejected' });
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, paymentStatus: 'rejected' })
      };
    }

    // action === 'approve' — this is the actual moment payment is confirmed,
    // so this is also the first safe moment to forward the order to CJ.
    const forwardResult = await attemptCjForward({
      orderId,
      shippingDetails: order.shippingDetails,
      items: order.items,
      shippingCarrier: order.shippingCarrier
    });

    await orderRef.update({
      paymentStatus: 'confirmed',
      cjOrderStatus: forwardResult.cjOrderStatus,
      cjOrderId: forwardResult.cjOrderId,
      cjError: forwardResult.cjError
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        paymentStatus: 'confirmed',
        cjOrderStatus: forwardResult.cjOrderStatus,
        cjOrderId: forwardResult.cjOrderId,
        cjError: forwardResult.cjError
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
