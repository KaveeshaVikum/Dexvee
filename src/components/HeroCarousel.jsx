import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { BANNERS } from '../data/siteContent';

// Rotating gradient banners. Edit them in src/data/siteContent.js.
export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);
  const count = BANNERS.length;

  useEffect(() => {
    if (paused || count < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(timer);
  }, [paused, count]);

  const go = (delta) => setIndex((i) => (i + delta + count) % count);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 40) go(diff < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  return (
    <div
      className="relative h-44 sm:h-60 lg:h-[380px] rounded-2xl overflow-hidden shadow-md"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
    >
      {BANNERS.map((b, i) => (
        <div
          key={b.id}
          className={`absolute inset-0 bg-gradient-to-br ${b.gradient} transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          aria-hidden={i !== index}
        >
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute right-24 -bottom-24 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative h-full flex flex-col justify-center px-6 sm:px-12 lg:px-16 max-w-2xl text-white">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] text-cyan-300 mb-2 sm:mb-3">{b.eyebrow}</span>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black leading-tight">{b.title}</h2>
            <p className="hidden sm:block mt-3 text-sm lg:text-base text-white/80 max-w-lg">{b.subtitle}</p>
            <Link
              to={b.link}
              className="mt-4 sm:mt-6 inline-flex items-center gap-2 self-start bg-white text-[#1A0F2E] font-black text-xs sm:text-sm px-5 py-2.5 rounded-full hover:bg-cyan-300 transition-colors"
            >
              {b.cta} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ))}

      {count > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="Previous banner" className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => go(1)} aria-label="Next banner" className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white items-center justify-center">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {BANNERS.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to banner ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
