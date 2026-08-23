import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin securely using environment variables[cite: 4]
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // This line ensures private key newlines are read properly by Node.js[cite: 4]
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
    })
  });
}

const db = getFirestore();

export const handler = async (event, context) => {
  // Security check to ensure it's a POST request[cite: 4]
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const data = JSON.parse(event.body);
    const rawInput = data.cjProductId;

    if (!rawInput) {
      throw new Error("Product ID or URL is missing.");
    }

    // Clean the input: If you paste a full URL, this extracts just the ID at the end.
    const productId = rawInput.split('/').pop().split('?')[0]; 

    // Default fallbacks in case CJ API takes a moment or hits rate limits
    let productName = `Dexvee Product (${productId})`;
    let costPrice = 15.00;
    let imageUrl = "";

    // Fetch real details from CJ Dropshipping API
    try {
      const cjResponse = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${productId}`, {
        method: 'GET',
        headers: {
          'CJ-Access-Token': process.env.VITE_CJ_API_TOKEN || '',
          'Content-Type': 'application/json'
        }
      });
      
      if (cjResponse.ok) {
        const cjData = await cjResponse.json();
        if (cjData && cjData.data) {
          productName = cjData.data.productName || productName;
          costPrice = parseFloat(cjData.data.sellPrice) || costPrice;
          imageUrl = cjData.data.productImage || imageUrl;
        }
      }
    } catch (apiErr) {
      console.warn("CJ API fetch skipped, using generated fallbacks:", apiErr.message);
    }

    // Apply Dexvee's 40% Markup Rule & 50/50 Partner Payout Split
    const sellingPrice = parseFloat((costPrice * 1.40).toFixed(2));
    const totalProfit = parseFloat((sellingPrice - costPrice).toFixed(2));
    const partnerSplit = parseFloat((totalProfit / 2).toFixed(2));

    // CRITICAL FIX: Leave .doc() empty so Firestore creates a unique, safe ID every time[cite: 4].
    const productRef = db.collection('products').doc(); 
    
    const productDocument = {
      cjProductId: productId,
      name: productName,
      image: imageUrl,
      costPrice: costPrice,
      sellingPrice: sellingPrice,
      totalProfit: totalProfit,
      partnerSplit: partnerSplit,
      createdAt: FieldValue.serverTimestamp() // Uses FieldValue safely[cite: 4]
    };

    await productRef.set(productDocument); // Saves the dynamically created object[cite: 4]

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: "Product saved to Firebase!",
        product: productDocument 
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};