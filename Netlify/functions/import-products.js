const admin = require('firebase-admin');

// Initialize Firebase Admin (Ensures single instance across hot reloads)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "dexvee-cbbf5",
      clientEmail: "firebase-adminsdk-fbsvc@dexvee-cbbf5.iam.gserviceaccount.com",
      // Replaces escaped \n characters with real line breaks for proper auth parsing
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDnR1It4x8l45ZV\niNk5s7pZbLq8OCYRfDiyanQHu9ndiAm8rP1u9H1nt9MhvXLRLY923hyycn8zi6LL\n9ixqs1wQWfYf0zRilxY0ZcGQE5KBbjsYC4CmObT+Zw2LtF6WdW6+Md09LHuLVnio\nuZMM7ClgcY8IK4+jdiwuqjohlZMesZIzX+HjVAuRPMlVnF/Vm/PsMHyaQ72C34Mu\nBXardglt0fSfArZLXXZKNDxu5LP/8aDN5GG8Zspb5c29o5ZxIiRzpeDLNpSNmz+3\nIu7PryV74Y/xwiTg7+7uiA8P7z1Ah90vrdLCdWauXyWyNbrJFnSM9W0xd4kZLniN\n9gViq/ZjAgMBAAECggEACLdxa3VR6TWoptSfi0Mw1Mn6R7m+BY6u/FpywQ/daDIG\nW+wRKSthxpTxCiZ/u06CR7KbVkZmcOTkX9eJWQQlhiA93HkzUjvrhFIJd4qlTOeA\npqlYUet+3M+5fPhxUC5g3B44/mM8zMWXipRj7GrCLHZbM62gnkKH68JSqo1enBt2\n0sXjxJf1y4sO4/naaPDD+Tj1C9cKnPaftkC4xiU+c4RmZJoyKjxetKqFaZgB3P7m\nryveEbFtMXsGhCFxmhy5VN/M/rVQ/6LlsME9WWK3e3JLQsqlr95/mZhXOFWrqqQ5\nQ5qgMXBavgUgW7w+kO4cUypRg7tjrYiV8ofWqCikYQKBgQD8GkT3eAUiQ7q9qC2g\nO/EOe+mlqqiGqqxQ12VwlUzNhIVbg5XqU4yhwG8T3CFhreOAeAM7StzFIMifceVh\nExCxjrr1M6NS4YmqlHxOATd0EM50mO7XrTtFAmK9W64PhAMElyQ40Pv1ioZ7zF+v\noNzaq8USGTc4a+MVLmMSI5KcaQKBgQDq2qNBOPcwPx3hfa3uXW6wKr0sQXnLQwg3\n2CKCKW/bcZsrWSK3Mc0AYC99InkrPxzge8GDj6XpkVKpTgb+e3gdHm0cQHty6GZu\n0r+y+6Y+JkdFG0VCk6kcVd5XpTzTU6SSIs9FXP/z5kurQm5eXW2ACzOaGtovAC6h\nB3/BtH8S6wKBgQDIawXrCtJiBCBASKRFH4IrNp1wI/UoYiTte9/cGgVd2X2/XCPh\njxxdN0PXMQikw/36Eu7Ww1Qxrzdvcredbe+2iLbe2nd8G2s7XiJYTSVNs1K+ZRp0\nAfb9jMD8sxb0pMlVa+bS+GlmMgNqBfcIA8WwXiAknEFHLJXyL9d5Ayi6CQKBgGDx\nFupZRU+Y/hCR/DWkQ4hcW/HkpQ2OAdprUPNBf3apkk92X6oW2HQLQA77J+D+EEFp\nVBumM+oRnnlcR+7LsGz0nj1HMK3h2EZun8qVra2Bx3FzLEerA+c6Wqj6//yLTic0\nTzJmjRB0Q0/SABTbo9NyzD4UT3OPM7AslEO06a85AoGANII98mMh6WRDzCTKWAbm\ngaxz6InQfUQWW8rX7GbmtJqzxaYr40zekVEe/knAJrJWRR3DGjqvUdx+dgAlLg++\ns9noAP/S9LTMcI6RLbvtxYQPHPAFrx8PHBWHbKB2+HOEf4nTE9BOPGNu5RzOqHAb\nhvTgfO2h9QxvS04vL3oEFI8=\n-----END PRIVATE KEY-----".replace(/\\n/g, '\n'),
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