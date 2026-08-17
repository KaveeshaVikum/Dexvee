import React from 'react';
import { Star, CheckCircle2, Quote } from 'lucide-react';

const REVIEWS = [
  {
    id: 1,
    name: "Alex M.",
    role: "Verified Buyer",
    rating: 5,
    comment: "Ordered the mechanical keyboard and received it in 3 days! The build quality and custom lighting presets are unmatched for this price point.",
    product: "Cyberpunk RGB Mechanical Keyboard"
  },
  {
    id: 2,
    name: "Devon S.",
    role: "Verified Buyer",
    rating: 5,
    comment: "The ANC on the AeroPulse earbuds works surprisingly well in noisy environments. Seamless bluetooth pairing with both my laptop and phone.",
    product: "AeroPulse Wireless Earbuds ANC Pro"
  },
  {
    id: 3,
    name: "Kasun P.",
    role: "Verified Buyer",
    rating: 5,
    comment: "Dexvee Express customer service helped me clear my customs tracking within minutes. Super reliable platform with real buyer protection.",
    product: "Minimalist Smart Watch V2 AMOLED"
  }
];

export default function TestimonialSection() {
  return (
    <section className="py-4">
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#00F2FE] bg-[#00F2FE]/10 border border-[#00F2FE]/30 px-3 py-1 rounded-full">
          Trusted Worldwide
        </span>
        <h2 className="text-2xl font-black uppercase tracking-tight text-white mt-3">
          What Our Buyers Say
        </h2>
        <p className="text-xs text-gray-400 mt-1">Real feedback from verified Dexvee Express shoppers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {REVIEWS.map((rev) => (
          <div 
            key={rev.id} 
            className="p-6 rounded-3xl bg-[#0B0F19] border border-white/10 relative flex flex-col justify-between hover:border-[#00F2FE]/30 transition-all"
          >
            <Quote className="absolute top-6 right-6 w-8 h-8 text-white/5 pointer-events-none" />

            <div>
              <div className="flex items-center gap-1 mb-3">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-xs text-gray-300 font-medium leading-relaxed italic mb-4">
                "{rev.comment}"
              </p>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    {rev.name}
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </h4>
                  <span className="text-[10px] text-gray-400 font-bold">{rev.role}</span>
                </div>
              </div>
              <p className="text-[10px] text-[#00F2FE] font-bold mt-2 truncate">
                Purchased: {rev.product}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}