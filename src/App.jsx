import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  Sparkles, Zap, ShieldCheck, Truck, 
  ShoppingCart, Star, Check, Plus, Minus, Trash2, X, Search, 
  ShoppingBag, CreditCard, Eye, Lock, CheckCircle2, SlidersHorizontal,
  User, Package, Clock, Flame, Tag, Gift, Award
} from 'lucide-react';

// Import the AccountPage component
import AccountPage from './AccountPage';

const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: "AeroPulse Wireless Earbuds ANC Pro",
    category: "Audio",
    price: 34.99,
    originalPrice: 69.99,
    rating: 4.9,
    reviewsCount: 328,
    soldCount: "2.4k",
    stockPercent: 82,
    supplier: "TechHub Direct",
    badge: "Choice Express",
    isFlashSale: true,
    description: "Active noise cancellation with 32-hour total battery life, low-latency gaming mode, and high-fidelity spatial audio drivers.",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    name: "Minimalist Smart Watch V2 AMOLED",
    category: "Wearables",
    price: 64.50,
    originalPrice: 120.00,
    rating: 4.8,
    reviewsCount: 512,
    soldCount: "4.1k",
    stockPercent: 94,
    supplier: "Apex Direct",
    badge: "Top Seller",
    isFlashSale: true,
    description: "AMOLED edge-to-edge display featuring continuous heart rate metrics, GPS tracking, and 7-day battery endurance.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: 3,
    name: "Cyberpunk RGB Mechanical Keyboard",
    category: "Gaming",
    price: 89.90,
    originalPrice: 149.99,
    rating: 5.0,
    reviewsCount: 189,
    soldCount: "890",
    stockPercent: 65,
    supplier: "DevLync Tech",
    badge: "Choice Express",
    isFlashSale: true,
    description: "Custom hot-swappable linear switches, per-key RGB lighting effects, and an aircraft-grade aluminum alloy top frame.",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: 4,
    name: "Precision Ergonomic Wireless Mouse",
    category: "Gaming",
    price: 24.99,
    originalPrice: 45.00,
    rating: 4.7,
    reviewsCount: 94,
    soldCount: "1.1k",
    stockPercent: 40,
    supplier: "Global Electronics",
    badge: "Super Deal",
    isFlashSale: false,
    description: "Ultra-low latency dual-mode connection with thumb wheel controls, custom DPI presets, and internal macro profile memory.",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: 5,
    name: "Ultra-Fast 65W GaN Wall Charger",
    category: "Accessories",
    price: 18.50,
    originalPrice: 35.00,
    rating: 4.9,
    reviewsCount: 420,
    soldCount: "5.8k",
    stockPercent: 91,
    supplier: "Dexvee Official",
    badge: "Choice Express",
    isFlashSale: true,
    description: "Triple-port fast charging for laptops, phones, and tablets with active temperature control technology.",
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: 6,
    name: "Magnetic Desk Organizer Pad",
    category: "Home",
    price: 29.00,
    originalPrice: 50.00,
    rating: 4.6,
    reviewsCount: 76,
    soldCount: "630",
    stockPercent: 55,
    supplier: "StyleCraft",
    badge: "Super Deal",
    isFlashSale: false,
    description: "Waterproof eco-leather desk mat with integrated magnetic cable anchors and embedded wireless phone charger.",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80"
  }
];

const CATEGORY_BUBBLES = [
  { id: "All", name: "All Offers", icon: Flame },
  { id: "Audio", name: "Audio", icon: Zap },
  { id: "Wearables", name: "Wearables", icon: Clock },
  { id: "Gaming", name: "Gaming", icon: Award },
  { id: "Accessories", name: "Accessories", icon: Tag },
  { id: "Home", name: "Home", icon: Sparkles }
];

const MOCK_VOUCHERS = [
  { id: "V1", title: "$5 OFF", code: "DEXVEE5", minSpend: 30, discount: 5, collected: false },
  { id: "V2", title: "15% OFF", code: "FLASH15", minSpend: 60, discount: 15, collected: false }
];

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  // App States
  const [products] = useState(INITIAL_PRODUCTS);
  const [vouchers, setVouchers] = useState(MOCK_VOUCHERS);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  
  // Theme State passed down to AccountPage
  const [darkMode, setDarkMode] = useState(false);

  const [userProfile] = useState({
    name: "Kaveesha",
    email: "vikumkaveesha8@gmail.com",
    address: "Ipalogama, Anuradhapura"
  });

  const showToast = (text) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const collectVoucher = (id) => {
    setVouchers(prev => prev.map(v => v.id === id ? { ...v, collected: true } : v));
    showToast("Voucher collected!");
  };

  const addToCart = (product, quantity = 1) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
    showToast(`Added to cart`);
  };

  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    showToast("Removed from cart");
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal > 0 ? (subtotal > 50 ? 0 : 3.99) : 0;
  const grandTotal = subtotal + shippingCost;

  const filteredProducts = products
    .filter((product) => {
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "popular") return parseFloat(b.soldCount) - parseFloat(a.soldCount);
      return 0;
    });

  const flashSaleProducts = products.filter(p => p.isFlashSale).slice(0, 4);

  return (
    <Router>
      <div className="min-h-screen font-sans bg-[#F5F5F5] text-gray-800">

        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 px-5 py-3 bg-white text-gray-800 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">{toastMsg}</span>
          </div>
        )}

        {/* Top Minimalist Bar */}
        <div className="bg-white text-[11px] py-2 px-6 border-b border-gray-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-gray-500">
            <div className="flex items-center gap-4">
              <span>Welcome to Dexvee</span>
              <span className="hidden md:inline">|</span>
              <span className="hidden md:inline text-[#2D1B4E] font-medium">Free Shipping on Orders over $50</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/admin" className="hover:text-[#2D1B4E] transition-colors">Sell on Dexvee</Link>
              <Link to="/account" className="hover:text-[#2D1B4E] transition-colors">Track Order</Link>
            </div>
          </div>
        </div>

        {/* Main Solid Brand Header - Dark Purple */}
        <header className="bg-[#2D1B4E] sticky top-0 z-40 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-6">
            
            {/* Brand Logo */}
            <Link to="/src/logo.png" className="flex items-center gap-3 shrink-0 text-white">
              <div className="w-10 h-10 bg-white text-[#2D1B4E] rounded-2xl flex items-center justify-center font-black text-xl shadow-inner">D</div>
              <span className="text-2xl font-bold tracking-wide">Dexvee</span>
            </Link>

            {/* Search Box - Rounded Pill */}
            <div className="flex-1 max-w-3xl hidden sm:flex items-center">
              <div className="w-full flex items-center bg-white rounded-2xl overflow-hidden p-1.5 shadow-inner">
                <input 
                  type="text" 
                  placeholder="Search in Dexvee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent px-5 py-2 text-sm outline-none text-gray-800 placeholder-gray-400"
                />
                <button className="px-8 py-2.5 bg-[#1A0F2E] text-white font-semibold text-sm flex items-center gap-2 hover:bg-[#0D0717] transition-colors rounded-xl">
                  <Search className="w-4 h-4" /> 
                </button>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-6 shrink-0 text-white">
              <Link to="/account" className="flex items-center gap-2 hover:text-gray-300 transition-colors cursor-pointer bg-white/5 px-4 py-2 rounded-2xl">
                <User className="w-5 h-5" />
                <span className="text-sm font-medium hidden md:block">Account</span>
              </Link>

              <button onClick={() => setIsCartOpen(true)} className="relative flex items-center gap-2 hover:text-gray-300 transition-colors bg-white/5 px-4 py-2 rounded-2xl">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-sm font-medium hidden md:block">Cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-[#2D1B4E] text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Application Routing */}
        <Routes>
          {/* Main Storefront Route */}
          <Route path="/" element={
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-24 space-y-10">
              
              {/* Minimal Hero / Voucher Banner */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">Shop the <span className="text-[#2D1B4E]">Mega Choice</span> Festival</h1>
                  <p className="text-gray-500">Claim your vouchers below to save more.</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  {vouchers.map(v => (
                    <div key={v.id} className="border-2 border-[#2D1B4E]/10 bg-[#2D1B4E]/5 rounded-2xl p-4 flex items-center gap-5">
                      <div>
                        <div className="text-base font-black text-[#2D1B4E]">{v.title}</div>
                        <div className="text-[11px] text-gray-600 font-medium mt-0.5">Min spend ${v.minSpend}</div>
                      </div>
                      <button 
                        onClick={() => collectVoucher(v.id)}
                        disabled={v.collected}
                        className={`text-xs font-bold px-5 py-2.5 rounded-xl transition-all ${v.collected ? 'bg-gray-200 text-gray-500' : 'bg-[#2D1B4E] text-white hover:bg-[#1A0F2E] shadow-md'}`}
                      >
                        {v.collected ? "Collected" : "Collect"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Minimal Categories */}
              <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-gray-800 text-lg mb-6 font-bold px-2">Shop by Category</h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                  {CATEGORY_BUBBLES.map((cat) => {
                    const IconComp = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl transition-all ${
                          isSelected ? 'bg-[#2D1B4E]/10 text-[#2D1B4E] border-2 border-[#2D1B4E]/20 shadow-sm' : 'hover:bg-gray-50 text-gray-600 border-2 border-transparent hover:border-gray-100'
                        }`}
                      >
                        <IconComp className={`w-7 h-7 ${isSelected ? 'text-[#2D1B4E]' : 'text-gray-400'}`} />
                        <span className="text-sm font-semibold">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Flash Sale Banner */}
              <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6 px-2">
                  <h2 className="text-[#2D1B4E] text-2xl font-black">Flash Sale</h2>
                  <span className="bg-[#2D1B4E] text-white text-xs px-3 py-1 rounded-xl font-bold uppercase tracking-widest shadow-sm">Live</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {flashSaleProducts.map((product) => (
                    <div key={product.id} className="group cursor-pointer bg-gray-50 rounded-3xl p-3 hover:shadow-md transition-all border border-transparent hover:border-gray-200" onClick={() => setQuickViewProduct(product)}>
                      <div className="aspect-square bg-white mb-4 overflow-hidden rounded-2xl relative">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 right-3 bg-[#2D1B4E] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
                          -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                        </div>
                      </div>
                      <div className="px-2 pb-2">
                        <div className="text-[#2D1B4E] text-xl font-black">${product.price.toFixed(2)}</div>
                        <div className="text-gray-400 text-sm line-through font-medium">${product.originalPrice.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Just For You Grid */}
              <section>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
                  <h2 className="text-2xl text-gray-800 font-black">Just For You</h2>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-200 text-sm font-medium rounded-xl px-4 py-2.5 outline-none text-gray-600 bg-white hover:border-gray-300 transition-colors shadow-sm"
                  >
                    <option value="featured">Best Match</option>
                    <option value="price-low">Price Low to High</option>
                    <option value="price-high">Price High to Low</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <div 
                      key={product.id}
                      className="bg-white rounded-3xl border border-gray-100 hover:border-[#2D1B4E]/30 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
                    >
                      <div className="cursor-pointer" onClick={() => setQuickViewProduct(product)}>
                        <div className="aspect-square bg-gray-50 overflow-hidden relative">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-5">
                          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug h-10 mb-2 group-hover:text-[#2D1B4E]">
                            {product.name}
                          </h3>
                          <div className="text-[#2D1B4E] text-xl font-black mb-2">
                            ${product.price.toFixed(2)}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-2">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span>{product.rating}</span>
                            <span className="mx-1 opacity-50">•</span>
                            <span>{product.soldCount} Sold</span>
                          </div>
                        </div>
                      </div>
                      <div className="px-5 pb-5">
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full py-2.5 border-2 border-[#2D1B4E] text-[#2D1B4E] hover:bg-[#2D1B4E] hover:text-white rounded-xl text-xs font-black transition-colors uppercase tracking-wider"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </main>
          } />

          {/* Account Dashboard Route */}
          <Route path="/account" element={<AccountPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        </Routes>

        {/* Quick View Modal */}
        {quickViewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setQuickViewProduct(null)} />
            <div className="relative w-full max-w-4xl bg-white rounded-3xl p-8 z-10 shadow-2xl flex flex-col md:flex-row gap-8">
              <button onClick={() => setQuickViewProduct(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="w-full md:w-1/2 aspect-square rounded-2xl overflow-hidden bg-gray-50">
                <img src={quickViewProduct.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col justify-center w-full md:w-1/2 pr-4">
                <div className="text-xs font-bold text-[#2D1B4E] uppercase tracking-widest mb-2">{quickViewProduct.category}</div>
                <h3 className="text-2xl font-black text-gray-800 mb-4">{quickViewProduct.name}</h3>
                <p className="text-gray-500 mb-8 leading-relaxed">{quickViewProduct.description}</p>
                <div className="text-4xl text-[#2D1B4E] font-black mb-8">${quickViewProduct.price.toFixed(2)}</div>
                <button 
                  onClick={() => { addToCart(quickViewProduct); setQuickViewProduct(null); }}
                  className="w-full py-4 bg-[#2D1B4E] hover:bg-[#1A0F2E] text-white text-sm font-black rounded-2xl uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Add To Cart
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simple Sidebar Cart */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl z-10 rounded-l-3xl overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-black text-xl text-gray-800">Shopping Cart ({totalItems})</h3>
                <button onClick={() => setIsCartOpen(false)} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"><X className="w-5 h-5 text-gray-600" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 font-medium">Your cart is empty.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-5">
                      <img src={item.image} alt="" className="w-20 h-20 object-cover border border-gray-100 rounded-2xl" />
                      <div className="flex-1 flex flex-col justify-center">
                        <h4 className="text-sm font-semibold text-gray-800 line-clamp-2">{item.name}</h4>
                        <p className="text-[#2D1B4E] font-black text-base mt-1">${item.price.toFixed(2)}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                            <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors">-</button>
                            <span className="text-xs w-8 text-center font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 text-gray-600 hover:bg-gray-100 transition-colors">+</button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-gray-50">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm text-gray-500 font-medium">
                      <span>Subtotal</span><span className="text-gray-800">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500 font-medium">
                      <span>Shipping</span><span className="text-gray-800">{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between font-black text-gray-900 text-2xl pt-3 border-t border-gray-200">
                      <span>Total</span><span className="text-[#2D1B4E]">${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full py-4 bg-[#2D1B4E] text-white text-sm font-black rounded-2xl hover:bg-[#1A0F2E] uppercase tracking-widest transition-all shadow-lg hover:-translate-y-0.5"
                  >
                    PROCEED TO CHECKOUT
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Minimal Checkout Modal */}
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)} />
            <div className="relative w-full max-w-md bg-white rounded-3xl p-8 z-10 shadow-2xl">
              <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
              
              {orderSuccess ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-[#2D1B4E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-[#2D1B4E]" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800">Order Placed!</h3>
                  <p className="text-gray-500 mt-2 font-medium">Check your account to track delivery.</p>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setOrderSuccess(true);
                  setTimeout(() => {
                    setOrderSuccess(false);
                    setIsCheckoutOpen(false);
                    setIsCartOpen(false);
                    setCart([]);
                    showToast("Order placed!");
                  }, 2000);
                }}>
                  <h3 className="text-2xl font-black mb-6 text-gray-800">Checkout Info</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Full Name</label>
                      <input required type="text" defaultValue={userProfile.name} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#2D1B4E] transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Shipping Address</label>
                      <input required type="text" defaultValue={userProfile.address} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#2D1B4E] transition-colors" />
                    </div>
                    <div className="pt-4">
                      <button type="submit" className="w-full py-4 bg-[#2D1B4E] text-white font-black text-sm rounded-2xl hover:bg-[#1A0F2E] shadow-lg transition-all uppercase tracking-widest">
                        Pay ${grandTotal.toFixed(2)}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Minimalist Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16 py-10 text-center">
          <p className="text-sm font-medium text-gray-500">© 2026 Dexvee Express. All rights reserved.</p>
        </footer>

      </div>
    </Router>
  );
}