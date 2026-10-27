import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Star, Truck } from 'lucide-react';
import { formatLKR } from '../utils/currency';

// One product tile, used on the home page, search results and product page.
// Only shows a discount when the product really has a higher original price,
// and only shows a star rating when real reviews exist.
export default function ProductCard({ product, lkrRate, onAddToCart }) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discount = hasDiscount ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  const hasReviews = product.reviewsCount > 0 && product.rating;
  const soldNumber = parseFloat(product.soldCount);
  const soldText = soldNumber > 0 ? `${product.soldCount} sold` : null;

  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 hover:border-[#1A0F2E]/20 hover:shadow-lg transition-all overflow-hidden flex flex-col">
      <Link to={`/product/${product.id}`} className="block flex-1">
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-300">No image</div>
          )}
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-fuchsia-600 text-white text-[11px] font-black px-2 py-1 rounded-md shadow">
              -{discount}%
            </span>
          )}
          {product.badge && !hasDiscount && (
            <span className="absolute top-2 left-2 bg-[#1A0F2E] text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
              {product.badge}
            </span>
          )}
        </div>

        <div className="p-3 pb-2 space-y-1.5">
          <h3 className="text-[13px] leading-snug text-gray-800 line-clamp-2 min-h-[2.5rem] group-hover:text-[#1A0F2E]">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base sm:text-lg font-black text-[#1A0F2E]">{formatLKR(product.price, lkrRate)}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">{formatLKR(product.originalPrice, lkrRate)}</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-500 min-h-[1.1rem]">
            {hasReviews ? (
              <span className="flex items-center gap-1 font-semibold">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {Number(product.rating).toFixed(1)}
                <span className="text-gray-400 font-normal">({product.reviewsCount})</span>
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 font-bold">New</span>
            )}
            {soldText && <span>· {soldText}</span>}
          </div>

          <p className="flex items-center gap-1 text-[11px] text-gray-400 pb-1">
            <Truck className="w-3 h-3" /> Ships from overseas
          </p>
        </div>
      </Link>

      {/* Quick add — sits outside the link so tapping it never opens the product */}
      {onAddToCart && (
        <button
          type="button"
          onClick={() => onAddToCart(product, 1)}
          aria-label={`Add ${product.name} to cart`}
          className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-[#1A0F2E] text-white flex items-center justify-center shadow-md hover:bg-fuchsia-600 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-5 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}
