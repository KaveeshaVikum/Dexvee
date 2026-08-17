import React from 'react';
import { ShoppingCart, Star } from 'lucide-react';

const PRODUCTS = [
  {
    id: 1,
    name: "AeroPulse ANC Earbuds",
    price: "12,500 LKR",
    rating: 4.8,
    reviews: 124,
    badge: "Trending",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    name: "Cyber Mech Keyboard K70",
    price: "18,200 LKR",
    rating: 5.0,
    reviews: 89,
    badge: "Best Seller",
    image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: 3,
    name: "Nova Smartwatch Pro",
    price: "24,000 LKR",
    rating: 4.6,
    reviews: 56,
    badge: null,
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: 4,
    name: "Magnetic Desk Mat 2.0",
    price: "6,800 LKR",
    rating: 4.9,
    reviews: 210,
    badge: "New",
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&auto=format&fit=crop&q=80"
  }
];

export default function FeaturedProducts() {
  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">
          Trending <span className="text-[#635BFF]">Drops</span>
        </h2>
        <a href="#all" className="text-xs font-bold uppercase tracking-wider text-[#00F2FE] hover:text-white transition-colors">
          View All Catalog &rarr;
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PRODUCTS.map((product) => (
          <div key={product.id} className="group rounded-2xl bg-[#0B0F19] border border-white/10 overflow-hidden hover:border-[#635BFF]/50 transition-all flex flex-col">
            
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-gray-900">
              {product.badge && (
                <span className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-[#635BFF] text-white text-[10px] font-black uppercase tracking-wider rounded-md">
                  {product.badge}
                </span>
              )}
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
              {/* Quick Add Overlay Button */}
              <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <button className="w-full py-3 bg-[#00F2FE] text-black text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,242,254,0.3)]">
                  <ShoppingCart className="w-4 h-4" /> Quick Add
                </button>
              </div>
            </div>

            {/* Product Details */}
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-3.5 h-3.5 fill-[#00F2FE] text-[#00F2FE]" />
                <span className="text-xs font-bold text-white">{product.rating}</span>
                <span className="text-[10px] text-gray-500 font-medium">({product.reviews})</span>
              </div>
              
              <h3 className="text-sm font-bold text-white leading-tight mb-2 flex-1 group-hover:text-[#00F2FE] transition-colors">
                {product.name}
              </h3>
              
              <div className="text-lg font-black tracking-tight text-white">
                {product.price}
              </div>
            </div>

          </div>
        ))}
      </div>
    </section>
  );
}