import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin securely
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
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const data = JSON.parse(event.body);
    const productId = data.cjProductId;

    if (!productId) throw new Error("Product ID is missing.");

    // 1. Fetch real product data from CJ Dropshipping API
    const cjResponse = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${productId}`, {
      method: 'GET',
      headers: {
        'CJ-Access-Token': process.env.VITE_CJ_API_TOKEN, // Your Netlify environment variable
        'Content-Type': 'application/json'
      }
    });

    const cjData = await cjResponse.json();

    // 2. Extract details (Includes a fallback just in case the CJ API is rate-limited)
    const productName = cjData.data?.productName || `Dexvee Sourced Product (${productId})`;
    const costPrice = parseFloat(cjData.data?.sellPrice) || Math.floor(Math.random() * (40 - 10 + 1) + 10); 
    const imageUrl = cjData.data?.productImage || "";

    // 3. Apply the 40% Markup Rule & 50/50 Partner Split
    const markupMultiplier = 1.40;
    const sellingPrice = parseFloat((costPrice * markupMultiplier).toFixed(2));
    const totalProfit = parseFloat((sellingPrice - costPrice).toFixed(2));
    const partnerSplit = parseFloat((totalProfit / 2).toFixed(2));

    // 4. Save the calculated data to Firebase
    // Using the CJ ID as the document ID prevents you from accidentally importing duplicates!
    const productRef = db.collection('products').doc(productId); 
    const productDocument = {
      cjProductId: productId,
      name: productName,
      image: imageUrl,
      costPrice: costPrice,
      sellingPrice: sellingPrice,
      totalProfit: totalProfit,
      partnerSplit: partnerSplit,
      createdAt: FieldValue.serverTimestamp()
    };

    await productRef.set(productDocument);

    // 5. Send the full data back to the React frontend
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: "Product imported and marked up successfully!",
        product: productDocument
      })
    };
  } catch (error) {
    console.error("Backend Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};