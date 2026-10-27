import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Star, Truck, Banknote, Package, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './components/ProductCard';
import { formatLKR } from './utils/currency';

// Remembers delivery quotes already fetched this visit, so flicking between
// product pages (or changing quantity back and forth) doesn't call the shipping
// service again every time.
const shippingCache = new Map();

const DEFAULT_DESCRIPTION = 'Imported and ready to ship.';

export default function ProductPage({ products, productsLoading, lkrRate, onAddToCart, onBuyNow }) {
  const { id } = useParams();
  const product = products.find((p) => String(p.id) === String(id));

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [shippingEstimate, setShippingEstimate] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
    window.scrollTo({ top: 0 });
  }, [id]);

  // Delivery estimate for this product from the shipping service. Only for
  // products that have a supplier variant id — others can't be quoted.
  useEffect(() => {
    if (!product?.vid) {
      setShippingEstimate(null);
      setShippingLoading(false);
      return undefined;
    }

    const key = `${product.vid}:${quantity}`;
    if (shippingCache.has(key)) {
      setShippingEstimate(shippingCache.get(key));
      setShippingLoading(false);
      return undefined;
    }

    let cancelled = false;
    setShippingLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/.netlify/functions/calculate-shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [{ vid: product.vid, quantity }], destCountryCode: 'LK' })
        });
        const data = await res.json();
        if (cancelled) return;
        const estimate = data.success
          ? {
              cost: data.shippingCost,
              carrier: data.breakdown?.carrier || null,
              etaDays: data.breakdown?.etaDays || null,
              isLiveQuote: data.isLiveQuote
            }
          : null;
        shippingCache.set(key, estimate);
        setShippingEstimate(estimate);
      } catch (err) {
        if (!cancelled) setShippingEstimate(null);
      } finally {
        if (!cancelled) setShippingLoading(false);
      }
    }, 300);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [product?.vid, quantity]);

  if (!product) {
    if (productsLoading) {
      return (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
          <div className="bg-white rounded-2xl p-6 grid lg:grid-cols-2 gap-6 animate-pulse">
            <div className="aspect-square bg-gray-100 rounded-xl" />
            <div className="space-y-4"><div className="h-6 bg-gray-100 rounded w-3/4" /><div className="h-8 bg-gray-100 rounded w-1/3" /><div className="h-24 bg-gray-100 rounded" /></div>
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-black text-gray-800 mb-2">Product not found</h1>
        <p className="text-gray-500 mb-6">It may have been removed, or the link is incorrect.</p>
        <Link to="/" className="inline-block px-6 py-3 bg-[#1A0F2E] text-white rounded-full text-xs font-black uppercase tracking-wider">Back to shopping</Link>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image].filter(Boolean);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discount = hasDiscount ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  const hasReviews = product.reviewsCount > 0 && product.rating;
  const soldNumber = parseFloat(product.soldCount);
  const showDescription = product.description && product.description !== DEFAULT_DESCRIPTION;
  const goTo = (n) => setActiveImage((n + images.length) % images.length);

  const related = products
    .filter((p) => p.id !== product.id)
    .sort((a, b) => (b.category === product.category) - (a.category === product.category))
    .slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 md:pb-8">

      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 overflow-hidden whitespace-nowrap" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-[#1A0F2E]">Home</Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <Link to={`/?category=${encodeURIComponent(product.category)}`} className="hover:text-[#1A0F2E]">{product.category}</Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <span className="text-gray-400 truncate">{product.name}</span>
      </nav>

      <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-6 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-6 lg:gap-10">

        {/* Gallery */}
        <div>
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
            {images[activeImage] && <img src={images[activeImage]} alt={product.name} className="w-full h-full object-cover" />}
            {hasDiscount && <span className="absolute top-3 left-3 bg-fuchsia-600 text-white text-xs font-black px-2.5 py-1 rounded-md shadow">-{discount}%</span>}
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => goTo(activeImage - 1)} aria-label="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
                <button type="button" onClick={() => goTo(activeImage + 1)} aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center"><ChevronRight className="w-5 h-5" /></button>
                <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{activeImage + 1}/{images.length}</span>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {images.map((img, i) => (
                <button key={i} type="button" onClick={() => setActiveImage(i)} aria-label={`Show image ${i + 1}`}
                  className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 ${i === activeImage ? 'border-[#1A0F2E]' : 'border-transparent hover:border-gray-300'}`}>
                  <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-black text-gray-900 leading-snug">{product.name}</h1>

          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            {hasReviews ? (
              <span className="flex items-center gap-1 font-semibold"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {Number(product.rating).toFixed(1)} <span className="font-normal text-gray-400">({product.reviewsCount} ratings)</span></span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 text-xs font-bold">New</span>
            )}
            {soldNumber > 0 && <span>· {product.soldCount} sold</span>}
          </div>

          <div className="mt-4 bg-gray-50 rounded-xl p-4">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-black text-[#1A0F2E]">{formatLKR(product.price * quantity, lkrRate)}</span>
              {hasDiscount && <span className="text-base text-gray-400 line-through">{formatLKR(product.originalPrice * quantity, lkrRate)}</span>}
            </div>
            {quantity > 1 && <p className="text-xs text-gray-500 mt-1">{formatLKR(product.price, lkrRate)} each</p>}
          </div>

          {/* Delivery & payment — plain facts, no promises we can't keep */}
          <div className="mt-4 border border-gray-100 rounded-xl divide-y divide-gray-100 text-sm">
            <div className="flex items-start gap-3 p-3.5">
              <Truck className="w-5 h-5 text-[#1A0F2E] shrink-0 mt-0.5" />
              <div className="text-gray-600">
                <p className="font-bold text-gray-800">Delivery to Sri Lanka</p>
                {shippingLoading ? (
                  <p>Checking delivery…</p>
                ) : shippingEstimate?.isLiveQuote ? (
                  <p>
                    {formatLKR(shippingEstimate.cost, lkrRate)}
                    {shippingEstimate.carrier && <> via {shippingEstimate.carrier}</>}
                    {shippingEstimate.etaDays && <> · about {shippingEstimate.etaDays} days</>}
                  </p>
                ) : (
                  <p>Ships from overseas. The delivery cost is shown at checkout.</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5">
              <Banknote className="w-5 h-5 text-[#1A0F2E] shrink-0 mt-0.5" />
              <div className="text-gray-600">
                <p className="font-bold text-gray-800">Pay by bank transfer</p>
                <p>Upload your receipt at checkout. We verify payments within 3 business days.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5">
              <Package className="w-5 h-5 text-[#1A0F2E] shrink-0 mt-0.5" />
              <div className="text-gray-600">
                <p className="font-bold text-gray-800">Track your order</p>
                <p>Follow the status of every order in your account.</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <span className="text-xs font-black uppercase tracking-wider text-gray-500">Quantity</span>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="px-3 py-2 text-gray-600 hover:bg-gray-100"><Minus className="w-4 h-4" /></button>
              <span className="w-10 text-center text-sm font-bold">{quantity}</span>
              <button type="button" onClick={() => setQuantity((q) => q + 1)} aria-label="Increase quantity" className="px-3 py-2 text-gray-600 hover:bg-gray-100"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="hidden md:flex gap-3 mt-6">
            <button type="button" onClick={() => onAddToCart(product, quantity)} className="flex-1 py-3.5 border-2 border-[#1A0F2E] text-[#1A0F2E] hover:bg-[#1A0F2E] hover:text-white rounded-xl text-sm font-black uppercase tracking-wider transition-colors">Add to Cart</button>
            <button type="button" onClick={() => onBuyNow(product, quantity)} className="flex-1 py-3.5 bg-[#1A0F2E] hover:bg-fuchsia-600 text-white rounded-xl text-sm font-black uppercase tracking-wider transition-colors shadow-lg">Buy Now</button>
          </div>
        </div>
      </div>

      {showDescription && (
        <section className="mt-4 bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-black text-[#1A0F2E] mb-3">Product details</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg sm:text-xl font-black text-[#1A0F2E] mb-3">You may also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} lkrRate={lkrRate} onAddToCart={onAddToCart} />)}
          </div>
        </section>
      )}

      {/* Sticky action bar — phones only */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] flex items-center gap-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="mr-1 min-w-0">
          <p className="text-[10px] text-gray-400 leading-none">Total</p>
          <p className="text-base font-black text-[#1A0F2E] leading-tight">{formatLKR(product.price * quantity, lkrRate)}</p>
        </div>
        <button type="button" onClick={() => onAddToCart(product, quantity)} className="flex-1 py-3 border-2 border-[#1A0F2E] text-[#1A0F2E] rounded-xl text-xs font-black uppercase tracking-wide">Add to Cart</button>
        <button type="button" onClick={() => onBuyNow(product, quantity)} className="flex-1 py-3 bg-[#1A0F2E] text-white rounded-xl text-xs font-black uppercase tracking-wide">Buy Now</button>
      </div>
    </div>
  );
}
