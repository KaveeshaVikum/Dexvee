import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Menu, Search, ShoppingCart, User, X, ChevronRight, Home, LayoutGrid } from 'lucide-react';
import { formatLKR } from '../utils/currency';
import { STORE } from '../data/siteContent';

// Top bar, main header, desktop category strip, mobile menu drawer and the
// mobile bottom navigation — all in one place so they share search/menu state.
export default function Header({ user, totalItems, onOpenCart, products, categories, lkrRate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const activeCategory = params.get('category') || 'All';

  const [query, setQuery] = useState(params.get('q') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Keep the box in sync with the URL (back button, clearing a search, etc.)
  useEffect(() => {
    setQuery(new URLSearchParams(location.search).get('q') || '');
  }, [location.search]);

  // Close the drawer whenever the page changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  // Stop the page scrolling behind the open drawer.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const trimmed = query.trim();
  const suggestions = trimmed
    ? products.filter((p) => p.name.toLowerCase().includes(trimmed.toLowerCase())).slice(0, 6)
    : [];

  const submitSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    navigate(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/');
  };

  const accountLink = user ? '/account' : '/auth';
  const accountLabel = user ? (user.displayName?.split(' ')[0] || 'Account') : 'Sign In';
  const hideBottomNav = location.pathname.startsWith('/product/') || location.pathname.startsWith('/admin');

  const searchBox = (
    <form onSubmit={submitSearch} className="relative w-full" role="search">
      <div className="flex items-center bg-white rounded-xl overflow-hidden shadow-inner">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Search in Dexvee…"
          aria-label="Search products"
          className="flex-1 min-w-0 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
        />
        <button type="submit" aria-label="Search" className="m-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#0D0717] rounded-lg transition-colors">
          <Search className="w-4 h-4" />
        </button>
      </div>

      {showSuggestions && trimmed && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {suggestions.length > 0 ? (
            suggestions.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                onClick={() => setShowSuggestions(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
              >
                <img src={p.image} alt="" className="w-10 h-10 object-cover rounded-lg bg-gray-50 shrink-0" />
                <span className="flex-1 min-w-0 text-sm text-gray-800 truncate">{p.name}</span>
                <span className="text-sm font-bold text-[#1A0F2E] shrink-0">{formatLKR(p.price, lkrRate)}</span>
              </Link>
            ))
          ) : (
            <div className="px-4 py-5 text-center text-sm text-gray-400">No products found for "{trimmed}"</div>
          )}
        </div>
      )}
    </form>
  );

  return (
    <>
      {/* Top utility bar — desktop only */}
      <div className="hidden md:block bg-[#0D0717] text-[11px] py-1.5 px-6 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-gray-400">
          <span>
            Free shipping on orders over <span className="text-cyan-400 font-semibold">{formatLKR(STORE.freeShippingOverUsd, lkrRate)}</span>
          </span>
          <div className="flex items-center gap-5">
            <Link to="/about" className="hover:text-cyan-400 transition-colors">About Us</Link>
            <Link to="/faq" className="hover:text-cyan-400 transition-colors">FAQs</Link>
            <Link to="/shipping-returns" className="hover:text-cyan-400 transition-colors">Shipping & Returns</Link>
            <Link to="/account?tab=orders" className="hover:text-cyan-400 transition-colors">Track Order</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-[#1A0F2E] sticky top-0 z-40 shadow-lg border-b border-fuchsia-500/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="md:hidden p-2 -ml-1 text-white rounded-lg hover:bg-white/10"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link to="/" className="shrink-0 flex items-center">
            <img src="/logo.png" alt="Dexvee" className="h-8 md:h-10 object-contain" />
          </Link>

          <div className="hidden md:block flex-1 max-w-3xl">{searchBox}</div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3 text-white shrink-0">
            <Link to={accountLink} className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:text-cyan-400 transition-colors">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{accountLabel}</span>
            </Link>

            <button
              type="button"
              onClick={onOpenCart}
              aria-label={`Open cart, ${totalItems} items`}
              className="relative flex items-center gap-2 p-2 md:px-4 md:py-2 rounded-xl md:bg-white/5 md:border md:border-white/5 hover:text-cyan-400 transition-colors"
            >
              <ShoppingCart className="w-6 h-6 md:w-5 md:h-5" />
              <span className="hidden md:inline text-sm font-medium">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 min-w-[1.25rem] h-5 px-1 bg-fuchsia-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile search row */}
        <div className="md:hidden px-3 pb-3">{searchBox}</div>
      </header>

      {/* Desktop category strip */}
      {categories.length > 0 && (
        <nav className="hidden md:block bg-white border-b border-gray-200" aria-label="Categories">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[{ name: 'All' }, ...categories].map((c) => {
              const isActive = location.pathname === '/' && activeCategory === c.name;
              return (
                <Link
                  key={c.name}
                  to={c.name === 'All' ? '/' : `/?category=${encodeURIComponent(c.name)}`}
                  className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    isActive ? 'border-fuchsia-500 text-[#1A0F2E]' : 'border-transparent text-gray-500 hover:text-[#1A0F2E]'
                  }`}
                >
                  {c.name === 'All' ? 'All Products' : c.name}
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <aside className="relative w-80 max-w-[85%] bg-white h-full flex flex-col shadow-2xl">
            <div className="bg-[#1A0F2E] text-white p-5">
              <div className="flex items-center justify-between mb-4">
                <img src="/logo.png" alt="Dexvee" className="h-8 object-contain" />
                <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="p-1.5 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {user ? (
                <Link to="/account" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black">
                    {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{user.displayName || 'My Account'}</p>
                    <p className="text-[11px] text-gray-300">View my orders</p>
                  </div>
                </Link>
              ) : (
                <div className="flex gap-2">
                  <Link to="/auth" className="flex-1 text-center py-2 rounded-lg bg-cyan-500 text-[#0D0717] text-sm font-bold">Sign In</Link>
                  <Link to="/auth" className="flex-1 text-center py-2 rounded-lg border border-white/30 text-sm font-bold">Sign Up</Link>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              <p className="px-5 pt-5 pb-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">Shop by category</p>
              <Link to="/" className="flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                All Products <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.name}
                  to={`/?category=${encodeURIComponent(c.name)}`}
                  className="flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <span>{c.name} <span className="text-gray-400 font-normal">({c.count})</span></span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              ))}

              <p className="px-5 pt-6 pb-2 text-[11px] font-black text-gray-400 uppercase tracking-widest">Help</p>
              <Link to="/account?tab=orders" className="flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                Track My Order <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
              <Link to="/faq" className="flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                FAQs <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
              <Link to="/shipping-returns" className="flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                Shipping & Returns <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
              <Link to="/contact" className="flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                Contact Us <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
              <Link to="/about" className="flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                About Us <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Mobile bottom navigation */}
      {!hideBottomNav && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 grid grid-cols-4 pb-[env(safe-area-inset-bottom)]" aria-label="Main">
          <Link to="/" className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${location.pathname === '/' && !location.search ? 'text-[#1A0F2E]' : 'text-gray-400'}`}>
            <Home className="w-5 h-5" /> Home
          </Link>
          <button type="button" onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-gray-400">
            <LayoutGrid className="w-5 h-5" /> Categories
          </button>
          <button type="button" onClick={onOpenCart} className="relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-gray-400">
            <span className="relative">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-3 min-w-[1.1rem] h-[1.1rem] px-1 bg-fuchsia-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{totalItems}</span>
              )}
            </span>
            Cart
          </button>
          <Link to={accountLink} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${location.pathname === '/account' || location.pathname === '/auth' ? 'text-[#1A0F2E]' : 'text-gray-400'}`}>
            <User className="w-5 h-5" /> {user ? 'Account' : 'Sign In'}
          </Link>
        </nav>
      )}
    </>
  );
}
