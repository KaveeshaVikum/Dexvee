// netlify/functions/import-product.js
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.AIzaSyAyASp-U0DjLuWw01Hed5Ier_rmiWBxvRw,
  projectId: process.env.dexvee-cbbf5,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { cjProductId, customCategory } = JSON.parse(event.body || '{}');

    // 1. Call CJ Dropshipping API securely
    const cjResponse = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/detail?pid=${cjProductId}`, {
      headers: { 'CJ-Access-Token': process.env.CJ_API_TOKEN }
    });
    const cjData = await cjResponse.json();

    if (!cjData.success) throw new Error('Failed to fetch from CJ Dropshipping');

    const product = cjData.data;
    const rawPrice = parseFloat(product.sellPrice) || 10.0;
    
    // 2. Apply 40% markup formula
    const finalPrice = Number((rawPrice * 1.40).toFixed(2));
    const originalPrice = Number((finalPrice * 1.50).toFixed(2));

    const formattedProduct = {
      id: product.pid,
      name: product.productName,
      category: customCategory || 'General',
      price: finalPrice,
      originalPrice: originalPrice,
      supplierPrice: rawPrice,
      supplier: 'CJ Dropshipping',
      image: product.productImage,
      description: product.description || '',
      cjPid: product.pid,
      updatedAt: new Date().toISOString()
    };

    // 3. Save to Firebase Firestore
    await setDoc(doc(db, 'products', product.pid), formattedProduct);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, product: formattedProduct })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};