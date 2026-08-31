import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Star, Truck, ShieldCheck, Lock, Plus, Minus,
  ChevronLeft, ChevronRight, ArrowLeft, PackageCheck
} from 'lucide-react';
import { formatLKR } from './utils/currency';

export default function ProductPage({ products, lkrRate, onAddToCart, onBuyNow }) {
  const { id } = useParams();
  const product = products.find((p) => String(p.id) === String(id));

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Reset gallery/quantity whenever the person navigates to a different product.
  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
  }, [id]);

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-2xl font-black text-gray-800 mb-3">Product not found</h2>
        <p className="text-gray-500 mb-6">It may have been removed, or the link is incorrect.</p>
        <Link to="/" className="inline-flex items-center gap-2 text-[#2D1B4E] font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to shopping
        </Link>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image];

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const goToImage = (index) => {
    setActiveImage((index + images.length) % images.length);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#2D1B4E] font-medium mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to shopping
      </Link>

      <div className="flex flex-col lg:flex-row gap-10">

        {/* Image Gallery */}
        <div className="w-full lg:w-2/5">
          <div className="aspect-square bg-gray-50 rounded-3xl overflow-hidden relative border border-gray-100">
            <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => goToImage(activeImage - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md text-gray-700"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => goToImage(activeImage + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md text-gray-700"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${
                    activeImage === i ? 'border-[#2D1B4E]' : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="w-full lg:w-3/5">
          <div className="text-xs font-bold text-[#2D1B4E] uppercase tracking-widest mb-2">{product.category}</div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 mb-3 leading-snug">{product.name}</h1>

          <div className="flex items-center gap-3 text-sm text-gray-500 font-medium mb-5">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {product.rating}
            </span>
            {product.reviewsCount ? (
              <>
                <span className="opacity-40">•</span>
                <span>{product.reviewsCount} Ratings</span>
              </>
            ) : null}
            <span className="opacity-40">•</span>
            <span>{product.soldCount} Sold</span>
          </div>

          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-3xl md:text-4xl font-black text-[#2D1B4E]">{formatLKR(product.price, lkrRate)}</span>
            {hasDiscount && (
              <span className="text-lg text-gray-400 line-through font-medium">{formatLKR(product.originalPrice, lkrRate)}</span>
            )}
          </div>
          {hasDiscount && (
            <div className="inline-block bg-[#2D1B4E]/10 text-[#2D1B4E] text-xs font-bold px-2.5 py-1 rounded-lg mb-6">
              -{discountPercent}% OFF
            </div>
          )}
          {!hasDiscount && <div className="mb-6" />}

          <p className="text-gray-500 leading-relaxed mb-6">{product.description}</p>

          {/* Quantity Stepper */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Quantity</span>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm w-10 text-center font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <button
              onClick={() => onAddToCart(product, quantity)}
              className="flex-1 py-4 border-2 border-[#2D1B4E] text-[#2D1B4E] hover:bg-[#2D1B4E] hover:text-white rounded-2xl text-sm font-black uppercase tracking-wider transition-colors"
            >
              Add to Cart
            </button>
            <button
              onClick={() => onBuyNow(product, quantity)}
              className="flex-1 py-4 bg-[#2D1B4E] hover:bg-[#1A0F2E] text-white rounded-2xl text-sm font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Buy Now
            </button>
          </div>

          {/* Delivery / Trust Info — mirrors the Daraz sidebar */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Truck className="w-4.5 h-4.5 text-[#2D1B4E] shrink-0" />
              <span>Standard delivery, usually within 5–7 business days</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <ShieldCheck className="w-4.5 h-4.5 text-[#2D1B4E] shrink-0" />
              <span>14 days easy return</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Lock className="w-4.5 h-4.5 text-[#2D1B4E] shrink-0" />
              <span>Cash on Delivery Available</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <PackageCheck className="w-4.5 h-4.5 text-[#2D1B4E] shrink-0" />
              <span>Sold by {product.supplier}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}