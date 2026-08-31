import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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

function calculatePricing(costPrice, markupPercent) {
  const cost = parseFloat(costPrice) || 0;
  const markup = parseFloat(markupPercent) || 40;
  const sellingPrice = parseFloat((cost * (1 + markup / 100)).toFixed(2));
  const totalProfit = parseFloat((sellingPrice - cost).toFixed(2));
  const partnerSplit = parseFloat((totalProfit / 2).toFixed(2));
  return { costPrice: cost, sellingPrice, totalProfit, partnerSplit };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);

    if (data.action === 'add') {
      const { name, category, costPrice, supplier, image, tag, markupPercent } = data;
      if (!name || !costPrice) {
        throw new Error('Product name and cost price are required.');
      }

      const pricing = calculatePricing(costPrice, markupPercent);

      const productDocument = {
        name,
        category: category || 'Gadgets',
        image: image || '',
        supplier: supplier || 'External Supplier',
        tag: tag || 'Imported',
        ...pricing,
        createdAt: FieldValue.serverTimestamp()
      };

      const productRef = db.collection('products').doc();
      await productRef.set(productDocument);

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, product: { id: productRef.id, ...productDocument } })
      };
    }

    if (data.action === 'delete') {
      const { id } = data;
      if (!id) throw new Error('Product id is required to delete.');

      await db.collection('products').doc(id).delete();

      return { statusCode: 200, body: JSON.stringify({ success: true, id }) };
    }

    throw new Error(`Unknown action: ${data.action}`);
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};