const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  // Security: Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { cjProductId, customCategory } = JSON.parse(event.body);

    if (!cjProductId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Product ID is required' })
      };
    }

    // ==========================================
    // MOCK SUPPLIER FETCH
    // ==========================================
    const mockSupplierPrice = 21.42;

    const mockProductData = {
      name: `Cyber Dynamic Headset (ID: ${cjProductId})`,
      description: "High-fidelity wireless audio imported directly from supplier.",
      image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&auto=format&fit=crop&q=80",
      supplierCost: mockSupplierPrice,
    };

    // ==========================================
    // DEXVEE PROFIT & PARTNER SPLIT MATH
    // ==========================================
    const markupPercentage = 0.40; // 40% markup rule
    const retailPrice = Number((mockSupplierPrice * (1 + markupPercentage)).toFixed(2));
    const totalProfit = Number((retailPrice - mockSupplierPrice).toFixed(2));

    // 50/50 executive split calculation
    const partnerPayout = Number((totalProfit / 2).toFixed(2));

    const finalProduct = {
      ...mockProductData,
      category: customCategory || 'Tech',
      price: retailPrice,
      originalPrice: Number((retailPrice * 1.25).toFixed(2)),
      rating: 5.0,
      soldCount: "0",
      isFlashSale: false,
      payoutSplit: partnerPayout,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // ==========================================
    // PUSH TO FIREBASE FIRESTORE
    // ==========================================
    const docRef = await db.collection('products').add(finalProduct);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        product: { id: docRef.id, ...finalProduct }
      }),
    };

  } catch (error) {
    console.error("Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message || 'Internal Server Error' }),
    };
  }
};
