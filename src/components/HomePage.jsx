import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Truck, Banknote, Package, ShieldCheck, Flame, X } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from './ProductCard';
import HeroCarousel from './HeroCarousel';
import { formatLKR } from '../utils/currency';
import { STORE } from '../data/siteContent';

const PAGE_SIZE = 12;
const GRID = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4';
const HIDE_SCROLLBAR = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

function SectionHeader({ title, icon: Icon, actionLabel, actionTo }) {
  return (
    <div className="flex items-center justify-between mb-3 sm:mb-4">
      <h2 className="flex items-center gap-2 text-lg sm:text-xl font-black text-[#1A0F2E]">
        {Icon && <Icon className="w-5 h-5 text-fuchsia-500" />} {title}
      </h2>
      {actionLabel && (
        <Link to={actionTo} className="flex items-center gap-1 text-xs sm:text-sm font-bold text-[#1A0F2E] hover:text-fuchsia-600">
          {actionLabel} <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function Grid({ items, loading, lkrRate, onAddToCart }) {
  if (loading) {
    return (
      <div className={GRID}>
        {Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    );
  }
  return (
    <div className={GRID}>
      {items.map((p) => <ProductCard key={p.id} product={p} lkrRate={lkrRate} onAddToCart={onAddToCart} />)}
    </div>
  );
}

function LoadMore({ onClick }) {
  return (
    <div className="text-center mt-6">
      <button type="button" onClick={onClick} className="px-10 py-3 bg-white border-2 border-[#1A0F2E] text-[#1A0F2E] rounded-full text-sm font-black hover:bg-[#1A0F2E] hover:text-white transition-colors">
        Load more
      </button>
    </div>
  );
}

export default function HomePage({ products, productsLoading, categories, lkrRate, user, onAddToCart }) {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'All';
  const q = (params.get('q') || '').trim();
  const isBrowsing = Boolean(q) || category !== 'All';

  const [sort, setSort] = useState('best');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisible(PAGE_SIZE);
    window.scrollTo({ top: 0 });
  }, [q, category]);

  // ---------- Search / category results ----------
  if (isBrowsing) {
    const results = products
      .filter((p) => (category === 'All' || p.category === category) && (!q || p.name.toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => {
        if (sort === 'price-low') return a.price - b.price;
        if (sort === 'price-high') return b.price - a.price;
        return 0;
      });

    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-[#1A0F2E]">
              {q ? <>Results for "{q}"</> : category}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {productsLoading ? 'Loading…' : `${results.length} product${results.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            Sort by
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:border-[#1A0F2E]"
            >
              <option value="best">Best match</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {category !== 'All' && (
            <button type="button" onClick={() => setParams(q ? { q } : {})} className="flex items-center gap-1.5 bg-[#1A0F2E] text-white text-xs font-bold px-3 py-1.5 rounded-full">
              {category} <X className="w-3 h-3" />
            </button>
          )}
          {q && (
            <button type="button" onClick={() => setParams(category !== 'All' ? { category } : {})} className="flex items-center gap-1.5 bg-[#1A0F2E] text-white text-xs font-bold px-3 py-1.5 rounded-full">
              "{q}" <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {!productsLoading && results.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 px-6 text-center">
            <p className="text-lg font-black text-gray-800 mb-1">Nothing found</p>
            <p className="text-sm text-gray-500 mb-5">Try a different word, or browse everything we have.</p>
            <button type="button" onClick={() => setParams({})} className="px-6 py-3 bg-[#1A0F2E] text-white rounded-full text-xs font-black uppercase tracking-wider">
              Show all products
            </button>
          </div>
        ) : (
          <>
            <Grid items={results.slice(0, visible)} loading={productsLoading} lkrRate={lkrRate} onAddToCart={onAddToCart} />
            {results.length > visible && <LoadMore onClick={() => setVisible((v) => v + PAGE_SIZE)} />}
          </>
        )}
      </div>
    );
  }

  // ---------- Home ----------
  const deals = products.filter((p) => p.originalPrice && p.originalPrice > p.price).slice(0, 8);
  const newArrivals = products.slice(0, 10);
  const firstName = user?.displayName?.split(' ')[0];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">

      {/* Category menu + banner + account panel */}
      <section className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_240px]">
        <aside className="hidden lg:block bg-white rounded-2xl border border-gray-100 h-[380px] overflow-y-auto py-2">
          <p className="px-4 pt-2 pb-1 text-[11px] font-black text-gray-400 uppercase tracking-widest">Categories</p>
          {categories.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">Categories appear as products are added.</p>
          ) : (
            categories.map((c) => (
              <Link key={c.name} to={`/?category=${encodeURIComponent(c.name)}`} className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#1A0F2E] group">
                <span className="font-semibold truncate">{c.name}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400">{c.count} <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1A0F2E]" /></span>
              </Link>
            ))
          )}
        </aside>

        <HeroCarousel />

        <aside className="hidden xl:flex flex-col bg-white rounded-2xl border border-gray-100 h-[380px] p-5">
          {user ? (
            <>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Welcome back</p>
              <p className="text-xl font-black text-[#1A0F2E] mt-1 truncate">{firstName || 'Dexvee shopper'}</p>
              <Link to="/account" className="mt-4 text-center py-2.5 rounded-xl bg-[#1A0F2E] text-white text-sm font-bold hover:bg-[#0D0717]">My orders</Link>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Welcome to Dexvee</p>
              <p className="text-lg font-black text-[#1A0F2E] mt-1">Sign in to track your orders</p>
              <div className="flex gap-2 mt-4">
                <Link to="/auth" className="flex-1 text-center py-2.5 rounded-xl bg-[#1A0F2E] text-white text-sm font-bold hover:bg-[#0D0717]">Sign In</Link>
                <Link to="/auth" className="flex-1 text-center py-2.5 rounded-xl border-2 border-[#1A0F2E] text-[#1A0F2E] text-sm font-bold hover:bg-[#1A0F2E]/5">Sign Up</Link>
              </div>
            </>
          )}
          <div className="mt-auto space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-3"><Truck className="w-5 h-5 text-fuchsia-500 shrink-0" /> Free shipping over {formatLKR(STORE.freeShippingOverUsd, lkrRate)}</div>
            <div className="flex items-center gap-3"><Banknote className="w-5 h-5 text-fuchsia-500 shrink-0" /> Pay by bank transfer</div>
            <div className="flex items-center gap-3"><Package className="w-5 h-5 text-fuchsia-500 shrink-0" /> Live order tracking</div>
          </div>
        </aside>
      </section>

      {/* Mobile category chips */}
      {categories.length > 0 && (
        <section className={`lg:hidden -mx-3 px-3 overflow-x-auto ${HIDE_SCROLLBAR}`}>
          <div className="flex gap-2 w-max">
            {categories.map((c) => (
              <Link key={c.name} to={`/?category=${encodeURIComponent(c.name)}`} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-[#1A0F2E] whitespace-nowrap">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Hot deals — only when products genuinely have a higher original price */}
      {deals.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
          <SectionHeader title="Hot Deals" icon={Flame} actionLabel="See all" actionTo="/?category=All" />
          <Grid items={deals} loading={false} lkrRate={lkrRate} onAddToCart={onAddToCart} />
        </section>
      )}

      {/* Shop by category */}
      {categories.length > 0 && (
        <section>
          <SectionHeader title="Shop by Category" />
          <div className={`flex gap-3 overflow-x-auto pb-2 ${HIDE_SCROLLBAR} sm:grid sm:grid-cols-4 lg:grid-cols-6 sm:overflow-visible`}>
            {categories.slice(0, 12).map((c) => (
              <Link key={c.name} to={`/?category=${encodeURIComponent(c.name)}`} className="group shrink-0 w-28 sm:w-auto bg-white rounded-xl border border-gray-100 hover:border-[#1A0F2E]/20 hover:shadow-md transition-all overflow-hidden">
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  {c.image && <img src={c.image} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                </div>
                <div className="p-2.5 text-center">
                  <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{c.name}</p>
                  <p className="text-[11px] text-gray-400">{c.count} item{c.count === 1 ? '' : 's'}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New arrivals */}
      {(productsLoading || newArrivals.length > 0) && (
        <section>
          <SectionHeader title="New Arrivals" actionLabel="View all" actionTo="/?category=All" />
          <div className={`flex gap-3 overflow-x-auto pb-2 snap-x ${HIDE_SCROLLBAR}`}>
            {productsLoading
              ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="shrink-0 w-40 sm:w-48"><ProductCardSkeleton /></div>)
              : newArrivals.map((p) => (
                <div key={p.id} className="shrink-0 w-40 sm:w-48 snap-start">
                  <ProductCard product={p} lkrRate={lkrRate} onAddToCart={onAddToCart} />
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Just for you */}
      <section>
        <SectionHeader title="Just For You" />
        {!productsLoading && products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 px-6 text-center">
            <p className="text-lg font-black text-gray-800 mb-1">Our shelves are being stocked</p>
            <p className="text-sm text-gray-500">New products are on their way — please check back soon.</p>
          </div>
        ) : (
          <>
            <Grid items={products.slice(0, visible)} loading={productsLoading} lkrRate={lkrRate} onAddToCart={onAddToCart} />
            {products.length > visible && <LoadMore onClick={() => setVisible((v) => v + PAGE_SIZE)} />}
          </>
        )}
      </section>

      {/* Reassurance strip */}
      <section className="bg-gradient-to-r from-[#1A0F2E] to-[#3B1D6E] rounded-2xl p-5 sm:p-6 text-white flex items-start gap-4">
        <ShieldCheck className="w-8 h-8 text-cyan-300 shrink-0" />
        <div>
          <p className="font-black text-base sm:text-lg">How delivery works</p>
          <p className="text-sm text-white/80 mt-1">
            Orders ship from our international suppliers, so delivery can take a few weeks. We show the estimate on each product, and you can follow every order's status in your account.
          </p>
        </div>
      </section>
    </div>
  );
}
