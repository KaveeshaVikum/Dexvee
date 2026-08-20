// api/import-product.js
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { cjProductId, customCategory } = req.body;

  try {
    // 1. Fetch raw product data from CJ Dropshipping
    const cjResponse = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/detail?pid=${cjProductId}`, {
      headers: { 'CJ-Access-Token': process.env.CJ_API_TOKEN }
    });
    const cjData = await cjResponse.json();

    if (!cjData.success) throw new Error('Failed to fetch from CJ Dropshipping');

    const product = cjData.data;
    const rawPrice = parseFloat(product.sellPrice) || 10.0;
    
    // 2. Apply markup formula (40% profit margin)
    const finalPrice = Number((rawPrice * 1.40).toFixed(2));
    const originalPrice = Number((finalPrice * 1.50).toFixed(2));

    // 3. Clean and structure the payload
    const formattedProduct = {
      id: product.pid,
      name: product.productName,
      category: customCategory || product.categoryName || 'General',
      price: finalPrice,
      originalPrice: originalPrice,
      supplierPrice: rawPrice,
      supplier: 'CJ Dropshipping',
      image: product.productImage,
      description: product.description || '',
      stockPercent: 90,
      rating: 4.8,
      soldCount: '100+',
      isFlashSale: false,
      cjPid: product.pid,
      updatedAt: new Date().toISOString()
    };

    // 4. Save directly into free Firebase Firestore database
    await setDoc(doc(db, 'products', product.pid), formattedProduct);

    return res.status(200).json({ success: true, product: formattedProduct });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}