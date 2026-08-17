import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, ShieldCheck, Flame, ArrowRight } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    tag: "SPECIAL LAUNCH DEAL",
    title: "CYBERPUNK GAMING GEAR",
    highlight: "40% OFF",
    description: "Upgrade your setup with custom mechanical keyboards, ultra-low latency mice, and high-fidelity headsets.",
    buttonText: "Explore Gaming",
    link: "#gaming",
    badgeIcon: Flame,
    bgImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    tag: "DEXVEE EXPRESS CHOICE",
    title: "NEXT-GEN AUDIO & WEARABLES",
    highlight: "FREE SHIPPING",
    description: "Active noise-canceling earbuds and AMOLED smartwatches with 7-day battery life and instant pairing.",
    buttonText: "Shop Audio",
    link: "#audio",
    badgeIcon: Zap,
    bgImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=80"
  },
  {
    id: 3,
    tag: "VERIFIED SUPPLIERS",
    title: "SMART DESK ACCESSORIES",
    highlight: "NEW ARRIVALS",
    description: "GaN fast chargers, magnetic desk mats, and ergonomic stands designed for maximum productivity.",
    buttonText: "Browse Accessories",
    link: "#accessories",
    badgeIcon: ShieldCheck,
    bgImage: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=1200&auto=format&fit=crop&q=80"
  }
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  const slide = SLIDES[current];
  const BadgeIcon = slide.badgeIcon;

  return (
    <div className="relative w-full h-[420px] sm:h-[480px] rounded-3xl overflow-hidden border border-white/10 bg-[#0B0F19] group">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={slide.bgImage} 
          alt={slide.title} 
          className="w-full h-full object-cover opacity-30 scale-105 transition-all duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070A0F] via-[#070A0F]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070A0F] via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full max-w-2xl p-8 sm:p-12 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00F2FE]/15 border border-[#00F2FE]/40 text-[#00F2FE] text-[10px] font-black uppercase tracking-widest mb-4 w-fit">
          <BadgeIcon className="w-3.5 h-3.5" />
          {slide.tag}
        </div>

        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none mb-3">
          {slide.title} <br />
          <span className="text-[#00F2FE]">{slide.highlight}</span>
        </h1>

        <p className="text-xs sm:text-sm text-gray-300 font-medium mb-6 leading-relaxed line-clamp-2">
          {slide.description}
        </p>

        <a 
          href={slide.link}
          className="px-6 py-3.5 rounded-full bg-[#00F2FE] text-black font-black text-xs uppercase tracking-wider hover:bg-cyan-300 transition-all shadow-lg shadow-[#00F2FE]/20 flex items-center gap-2 w-fit"
        >
          {slide.buttonText} <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* Slider Controls */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-5 right-8 z-20 flex items-center gap-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all ${
              current === idx ? 'w-8 bg-[#00F2FE]' : 'w-2 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}