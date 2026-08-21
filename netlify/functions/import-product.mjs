import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

function getDatabase() {
  const projectId = Netlify.env.get('FIREBASE_PROJECT_ID')
  const clientEmail = Netlify.env.get('FIREBASE_CLIENT_EMAIL')
  const privateKey = Netlify.env.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin environment variables are not configured')
  }

  const app = getApps()[0] ?? initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  })

  return getFirestore(app)
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const { cjProductId, customCategory } = await request.json()

    if (!cjProductId) {
      return Response.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 },
      )
    }

    const supplierCost = 21.42
    const retailPrice = Number((supplierCost * 1.4).toFixed(2))
    const totalProfit = Number((retailPrice - supplierCost).toFixed(2))
    const partnerPayout = Number((totalProfit / 2).toFixed(2))
    const product = {
      name: `Cyber Dynamic Headset (ID: ${cjProductId})`,
      description: 'High-fidelity wireless audio imported directly from supplier.',
      image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&auto=format&fit=crop&q=80',
      supplierCost,
      category: customCategory || 'Tech',
      price: retailPrice,
      originalPrice: Number((retailPrice * 1.25).toFixed(2)),
      rating: 5,
      soldCount: '0',
      isFlashSale: false,
      payoutSplit: partnerPayout,
      createdAt: FieldValue.serverTimestamp(),
    }

    const document = await getDatabase().collection('products').add(product)

    return Response.json({
      success: true,
      product: { id: document.id, ...product },
    })
  } catch (error) {
    console.error('Product import failed', error)
    return Response.json(
      { success: false, error: 'Unable to import product' },
      { status: 500 },
    )
  }
}

export const config = {
  path: '/.netlify/functions/import-product',
}
