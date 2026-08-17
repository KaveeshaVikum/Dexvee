import React, { useState } from 'react';
import { Star, Shield, Truck, Heart, Share2, Plus, Minus, ShoppingCart } from 'lucide-react';

export default function ProductView({ darkMode }) {
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const product = {
    name: "AeroPulse Wireless ANC Pro Earbuds",
    brand: "AeroTech",
    price: 129.99,
    originalPrice: 159.99,
    rating: 4.8,
    reviews: 124,
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80",
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&q=80",
      "https://images.unsplash.com/photo-1572569432705-c3440ea10398?w=800&q=80"
    ],
    description: "Experience unparalleled sound quality with the AeroPulse Wireless Earbuds. Featuring active noise cancellation, adaptive EQ, and a sleek cyberpunk-inspired charging case."
  };

  return (
    <div className={`min-h-screen pt-8 pb-24 transition-colors duration-500 ${
      darkMode ? 'bg-[#070A0F] text-slate-100' : 'bg-[#F1F5F9] text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Breadcrumbs */}
        <nav className={`text-xs font-bold uppercase tracking-wider mb-8 ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
          Home / Audio / Earbuds / <span className={darkMode ? 'text-white' : 'text-slate-900'}>{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            <div className={`aspect-square w-full rounded-3xl overflow-hidden flex items-center justify-center border shadow-2xl ${
              darkMode ? 'bg-[#04060A] border-white/5' : 'bg-white border-slate-200'
            }`}>
              <img 
                src={product.images[activeImage]} 
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-300 mix-blend-normal"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {product.images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                    activeImage === idx 
                      ? darkMode ? 'border-[#00F2FE] shadow-[0_0_15px_rgba(0,242,254,0.3)]' : 'border-[#4F46E5]'
                      : darkMode ? 'border-transparent opacity-50 hover:opacity-100' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Product Details */}
          <div className="flex flex-col justify-center">
            
            {/* Badges */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                darkMode ? 'bg-[#00F2FE]/10 text-[#00F2FE]' : 'bg-[#4F46E5]/10 text-[#4F46E5]'
              }`}>
                {product.brand}
              </span>
              <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                <Star className="w-4 h-4 fill-current" /> {product.rating} <span className={darkMode ? 'text-gray-500' : 'text-slate-400'}>({product.reviews})</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-6 leading-tight">
              {product.name}
            </h1>

            {/* Pricing */}
            <div className="flex items-end gap-4 mb-6 pb-6 border-b border-white/10">
              <span className={`text-4xl font-black ${darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}`}>
                ${product.price}
              </span>
              <span className={`text-lg font-bold line-through mb-1 ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}>
                ${product.originalPrice}
              </span>
              <span className="mb-2 text-xs font-black px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded">
                SAVE 20%
              </span>
            </div>

            <p className={`text-sm mb-8 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
              {product.description}
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {/* Quantity Adjuster */}
              <div className={`flex items-center justify-between w-full sm:w-32 px-4 py-3 rounded-xl border ${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
              }`}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="hover:text-[#00F2FE]"><Minus className="w-4 h-4" /></button>
                <span className="font-black">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="hover:text-[#00F2FE]"><Plus className="w-4 h-4" /></button>
              </div>

              {/* Add to Cart */}
              <button className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg ${
                darkMode 
                  ? 'bg-[#00F2FE] text-black hover:bg-cyan-300 shadow-[#00F2FE]/20' 
                  : 'bg-[#4F46E5] text-white hover:bg-indigo-700 shadow-[#4F46E5]/20'
              }`}>
                <ShoppingCart className="w-5 h-5" /> Add to Cart
              </button>

              <button className={`p-4 rounded-xl border transition-colors flex items-center justify-center ${
                darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <Heart className="w-5 h-5" />
              </button>
            </div>

            {/* Trust Badges - Returns Removed */}
            <div className={`grid grid-cols-2 gap-4 pt-6 border-t ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-white/5 text-[#00F2FE]' : 'bg-slate-100 text-[#4F46E5]'}`}>
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase">Free Shipping</p>
                  <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>On orders over $50</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-white/5 text-[#00F2FE]' : 'bg-slate-100 text-[#4F46E5]'}`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase">Secure Pay</p>
                  <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>100% safe checkout</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}