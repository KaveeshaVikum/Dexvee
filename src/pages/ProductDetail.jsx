import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getUsdToLkrRate, formatLKR } from '../utils/currency';
import { 
  Star, ChevronLeft, ChevronRight, Minus, Plus, 
  Truck, ShieldCheck, Lock, PackageCheck 
} from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [lkrRate, setLkrRate] = useState(300);

  // Fetch exchange rate
  useEffect(() => {
    getUsdToLkrRate().then((rate) => setLkrRate(rate));
  }, []);

  // Fetch product from Firebase
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 font-medium">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 font-medium">
        Product not found.
      </div>
    );
  }

  // Handle images array or fallback single image
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image];

  // Price calculations
  const sellingPriceLKR = formatLKR(product.sellingPrice || product.price || 0, lkrRate);
  const shippingFeeUSD = product.shippingFee ?? 0;
  const shippingFeeLKR = formatLKR(shippingFeeUSD, lkrRate);

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans py-10 px-4 md:px-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-100">
        
        {/* LEFT COLUMN: Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full bg-slate-100 rounded-2xl overflow-hidden group">
            <img 
              src={images[selectedImageIndex]} 
              alt={product.name} 
              className="w-full h-full object-cover object-center"
            />
            {images.length > 1 && (
              <>
                <button 
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur hover:bg-white text-slate-800 flex items-center justify-center shadow transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur hover:bg-white text-slate-800 flex items-center justify-center shadow transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImageIndex === idx ? 'border-[#20194C] shadow-md scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Details & Purchase */}
        <div className="flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-black tracking-wider uppercase text-slate-400">
              {product.category || 'NEW ARRIVALS'}
            </span>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1 mb-3 leading-snug">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-4">
              <div className="flex items-center text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="ml-1 text-slate-800 font-bold">5</span>
              </div>
              <span>•</span>
              <span>New Sold</span>
            </div>

            {/* Price Display */}
            <div className="space-y-1">
              <div className="text-3xl font-black text-[#20194C]">
                {sellingPriceLKR}
              </div>

              {/* NEW: Shipping Fee Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-[#20194C] border border-indigo-100">
                  <Truck className="w-3.5 h-3.5 text-[#635BFF]" />
                  {shippingFeeUSD > 0 ? (
                    <>Shipping Fee: <span className="font-bold">{shippingFeeLKR}</span></>
                  ) : (
                    <span className="font-bold text-emerald-600">Free Shipping</span>
                  )}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium mt-3">
              Imported and ready to ship.
            </p>

            {/* Quantity Selector */}
            <div className="mt-6 flex items-center gap-4">
              <span className="text-xs font-bold text-slate-400 uppercase">Quantity</span>
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 gap-4">
                <button 
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-slate-800 w-4 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button className="w-full border-2 border-[#20194C] text-[#20194C] font-bold py-3.5 rounded-2xl text-xs uppercase hover:bg-slate-50 transition-all">
                Add to Cart
              </button>
              <button className="w-full bg-[#20194C] hover:bg-[#161234] text-white font-bold py-3.5 rounded-2xl text-xs uppercase shadow-md transition-all">
                Buy Now
              </button>
            </div>
          </div>

          {/* Delivery & Trust Info Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 text-xs text-slate-600">
            {/* Delivery Line updated with Shipping Fee info */}
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-slate-700 flex-shrink-0" />
              <span>
                Standard delivery within 5–7 business days
                <strong className="text-slate-900 ml-1">
                  ({shippingFeeUSD > 0 ? `Shipping: ${shippingFeeLKR}` : 'Free Delivery'})
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-slate-700 flex-shrink-0" />
              <span>14 days easy return</span>
            </div>

            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-slate-700 flex-shrink-0" />
              <span>Cash on Delivery Available</span>
            </div>

            <div className="flex items-center gap-3">
              <PackageCheck className="w-4 h-4 text-slate-700 flex-shrink-0" />
              <span>Sold by {product.supplier || 'CJ Dropshipping'}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}