import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AccountPage from './AccountPage';
import NavBar from './NavBar';
import Footer from './Footer';
import ProductView from './ProductView';
import { 
  Sparkles, Zap, ShieldCheck, Truck, Sun, Moon, 
  ShoppingCart, Star, Check, Plus, Minus, Trash2, X, Search, 
  ShoppingBag, CreditCard, Eye, Lock, CheckCircle2, SlidersHorizontal,
  User, Package, Settings, LogOut, Clock, ExternalLink, ChevronRight,
  Flame, Tag, Timer, Percent, Gift, Heart, ChevronDown, Award
} from 'lucide-react';

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
  { id: "Audio", name: "Audio & Sound", icon: Zap },
  { id: "Wearables", name: "Smart Watches", icon: Clock },
  { id: "Gaming", name: "Gaming Gear", icon: Award },
  { id: "Accessories", name: "Chargers & Hubs", icon: Tag },
  { id: "Home", name: "Desk & Home", icon: Sparkles }
];

const MOCK_VOUCHERS = [
  { id: "V1", title: "$5 OFF", code: "DEXVEE5", minSpend: 30, discount: 5, collected: false },
  { id: "V2", title: "15% OFF", code: "FLASH15", minSpend: 60, discount: 15, collected: false },
  { id: "V3", title: "FREE SHIPPING", code: "FREESHIP", minSpend: 25, discount: 0, collected: false }
];

const MOCK_ORDERS = [
  {
    id: "DXV-98231",
    date: "Aug 02, 2026",
    status: "In Transit",
    trackingNumber: "CJ883920114SL",
    total: 99.49,
    items: [
      { name: "Minimalist Smart Watch V2 AMOLED", qty: 1, price: 64.50 },
      { name: "AeroPulse Wireless Earbuds ANC Pro", qty: 1, price: 34.99 }
    ]
  }
];

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  // App States
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [vouchers, setVouchers] = useState(MOCK_VOUCHERS);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [accountTab, setAccountTab] = useState("orders");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [addedId, setAddedId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  // Account Profile
  const [userProfile, setUserProfile] = useState({
    name: "Kaveesha",
    email: "vikumkaveesha8@gmail.com",
    address: "Ipalogama",
    city: "Anuradhapura",
    postalCode: "00100"
  });

  const showToast = (text) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const collectVoucher = (id) => {
    setVouchers(prev => prev.map(v => v.id === id ? { ...v, collected: true } : v));
    showToast("Voucher collected! Applied automatically at checkout.");
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
    setAddedId(product.id);
    showToast(`Added "${product.name}" to cart`);
    setTimeout(() => setAddedId(null), 1500);
  };

  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    showToast("Item removed from cart");
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal > 0 ? (subtotal > 50 ? 0 : 3.99) : 0;
  const grandTotal = subtotal + shippingCost;

  const filteredProducts = products
    .filter((product) => {
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.supplier.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "popular") return parseFloat(b.soldCount) - parseFloat(a.soldCount);
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  const flashSaleProducts = products.filter(p => p.isFlashSale);

  return (
    <Router>
      <div className={`min-h-screen font-sans antialiased relative overflow-x-hidden transition-colors duration-500 ${
        darkMode 
          ? 'bg-[#070A0F] text-slate-100 selection:bg-[#00F2FE] selection:text-black' 
          : 'bg-[#F1F5F9] text-[#0F172A] selection:bg-[#4F46E5] selection:text-white'
      }`}>
        
        {/* Background Ambient Lighting */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className={`absolute top-[-10%] left-[10%] w-[650px] h-[650px] rounded-full blur-[160px] transition-all duration-700 ${
            darkMode ? 'bg-[#635BFF]/15 opacity-100' : 'bg-[#4F46E5]/10 opacity-70'
          }`} />
          <div className={`absolute top-[40%] right-[-5%] w-[550px] h-[550px] rounded-full blur-[160px] transition-all duration-700 ${
            darkMode ? 'bg-[#00F2FE]/10 opacity-100' : 'bg-[#0284C7]/10 opacity-60'
          }`} />
        </div>

        {/* Floating Toast Notification */}
        {toastMsg && (
          <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all ${
            darkMode 
              ? 'bg-[#0B0F19] text-white border-[#00F2FE]/40 shadow-[0_0_20px_rgba(0,242,254,0.15)]' 
              : 'bg-white text-slate-900 border-slate-200 shadow-xl'
          }`}>
            <Sparkles className={`w-4 h-4 ${darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}`} />
            <span className="text-xs font-bold">{toastMsg}</span>
          </div>
        )}

        {/* Top Marketplace Ticker Bar */}
        <div className={`text-[11px] font-bold py-1.5 px-6 border-b flex items-center justify-between relative z-50 ${
          darkMode ? 'bg-[#030509] border-white/5 text-gray-400' : 'bg-slate-900 text-slate-300 border-slate-800'
        }`}>
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Gift className="w-3.5 h-3.5" /> Welcome Deal: Free Shipping on Orders over $50
              </span>
              <span className="hidden md:inline text-gray-600">|</span>
              <span className="hidden md:inline text-emerald-400">Guaranteed 3-Day Express Delivery</span>
            </div>

            <div className="flex items-center gap-4">
              <a href="/admin" className="hover:underline flex items-center gap-1 text-gray-400 hover:text-white">
                <Lock className="w-3 h-3 text-[#00F2FE]" /> Merchant Portal
              </a>
              <button onClick={() => setDarkMode(!darkMode)} className="hover:text-white transition-colors">
                {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <header className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${
          darkMode ? 'bg-[#070A0F]/90 border-white/10' : 'bg-white/90 border-slate-200 shadow-xs'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 sm:gap-8">
            
            {/* Brand Logo - Now links to homepage */}
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <div className={`w-10 h-10 rounded-xl p-[2px] flex items-center justify-center shadow-md ${
                darkMode 
                  ? 'bg-gradient-to-tr from-[#635BFF] to-[#00F2FE] shadow-[0_0_20px_rgba(0,242,254,0.25)]' 
                  : 'bg-gradient-to-tr from-[#4F46E5] to-[#0284C7]'
              }`}>
                <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${
                  darkMode ? 'bg-[#070A0F]' : 'bg-white'
                }`}>
                  <Zap className={`w-5 h-5 ${darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}`} />
                </div>
              </div>
              <div>
                <span className={`text-2xl font-black tracking-wider bg-clip-text text-transparent ${
                  darkMode 
                    ? 'bg-gradient-to-r from-[#635BFF] via-[#00F2FE] to-cyan-400' 
                    : 'bg-gradient-to-r from-[#4F46E5] via-[#0284C7] to-indigo-600'
                }`}>
                  Dexvee
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest bg-red-500 text-white px-1.5 py-0.2 rounded ml-1.5 align-top">
                  EXPRESS
                </span>
              </div>
            </Link>

            {/* Search Box */}
            <div className="flex-1 max-w-2xl hidden sm:flex items-center">
              <div className={`w-full flex items-center rounded-full border overflow-hidden p-1 transition-all ${
                darkMode 
                  ? 'bg-white/5 border-white/15 focus-within:border-[#00F2FE]' 
                  : 'bg-slate-100 border-slate-300 focus-within:border-[#4F46E5]'
              }`}>
                <input 
                  type="text" 
                  placeholder="Search products, brands, or tech categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent px-4 text-xs outline-none font-medium placeholder:text-gray-500"
                />
                <button className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 ${
                  darkMode 
                    ? 'bg-[#00F2FE] text-black hover:bg-cyan-300' 
                    : 'bg-[#4F46E5] text-white hover:bg-indigo-700'
                }`}>
                  <Search className="w-3.5 h-3.5" /> Search
                </button>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3 shrink-0">
              
              {/* Profile Route Link */}
              <Link 
                to="/account"
                className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all text-xs font-bold ${
                  darkMode 
                    ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
                    : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <User className="w-4 h-4 text-[#00F2FE]" />
                <span className="hidden md:inline">{userProfile.name}</span>
              </Link>

              <button 
                onClick={() => setIsCartOpen(true)}
                className={`p-2.5 rounded-full border relative transition-all flex items-center justify-center ${
                  darkMode 
                    ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 shadow-xs'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {totalItems > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-bounce ${
                    darkMode ? 'bg-[#00F2FE]' : 'bg-[#4F46E5] text-white'
                  }`}>
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page Routes Component Container */}
        <Routes>
          {/* HOME PAGE ROUTE */}
          <Route path="/" element={
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 relative z-10 space-y-10">
              {/* Hero Section Banner */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className={`lg:col-span-3 rounded-3xl p-8 sm:p-12 border relative overflow-hidden flex flex-col justify-between min-h-[320px] ${
                  darkMode 
                    ? 'bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#070A0F] border-white/10' 
                    : 'bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white border-slate-800 shadow-xl'
                }`}>
                  <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 bg-[radial-gradient(#00F2FE_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                  <div className="relative z-10 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00F2FE]/20 text-[#00F2FE] border border-[#00F2FE]/40 text-[10px] font-black uppercase tracking-widest mb-4">
                      <Flame className="w-3.5 h-3.5" /> Mega Choice Shopping Festival
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none mb-4">
                      UP TO <span className="text-[#00F2FE]">60% OFF</span> TECH ESSENTIALS
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-300 font-medium mb-6 leading-relaxed">
                      Verified suppliers, instant cashback rewards, and fast global fulfillment straight to your doorstep.
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <a href="#flash-sale" className="px-6 py-3 rounded-full bg-[#00F2FE] text-black font-black text-xs uppercase tracking-wider hover:bg-cyan-300 transition-all shadow-lg shadow-[#00F2FE]/20">
                        Shop Flash Deals
                      </a>
                      <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Dexvee Buyer Protection
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 pt-6 mt-6 border-t border-white/10 grid grid-cols-3 gap-2 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-gray-300">
                    <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-[#00F2FE]" /> Fast Shipping</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified Quality</div>
                    <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-amber-400" /> Best Price Guarantee</div>
                  </div>
                </div>

                {/* Voucher Center */}
                <div className={`rounded-3xl p-6 border flex flex-col justify-between ${
                  darkMode ? 'bg-[#0B0F19] border-white/10' : 'bg-white border-slate-200 shadow-md'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-extrabold uppercase text-xs flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-amber-400" /> Voucher Center
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-400">Updated Today</span>
                    </div>

                    <div className="space-y-3">
                      {vouchers.map((v) => (
                        <div key={v.id} className={`p-3 rounded-2xl border flex items-center justify-between ${
                          darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div>
                            <div className="text-xs font-black text-amber-400">{v.title}</div>
                            <div className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Orders over ${v.minSpend}</div>
                          </div>
                          <button 
                            disabled={v.collected}
                            onClick={() => collectVoucher(v.id)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              v.collected 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : darkMode
                                  ? 'bg-[#00F2FE] text-black hover:bg-cyan-300' 
                                  : 'bg-[#4F46E5] text-white hover:bg-indigo-700'
                            }`}
                          >
                            {v.collected ? "Collected" : "Collect"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={`mt-4 pt-3 border-t text-[10px] text-center font-bold ${
                    darkMode ? 'border-white/10 text-gray-500' : 'border-slate-100 text-slate-400'
                  }`}>
                    Auto-applied at checkout step
                  </div>
                </div>
              </div>

              {/* Category Bubbles */}
              <section>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {CATEGORY_BUBBLES.map((cat) => {
                    const IconComp = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
                          isSelected
                            ? darkMode 
                              ? 'bg-[#00F2FE] text-black border-[#00F2FE] shadow-lg shadow-[#00F2FE]/20 font-black' 
                              : 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-md font-black'
                            : darkMode
                              ? 'bg-[#0B0F19] border-white/10 text-gray-300 hover:bg-white/10'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs'
                        }`}
                      >
                        <IconComp className={`w-4 h-4 ${isSelected ? (darkMode ? 'text-black' : 'text-white') : (darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]')}`} />
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* FLASH SALE SECTION */}
              <section id="flash-sale" className={`rounded-3xl p-6 border transition-all ${
                darkMode ? 'bg-[#0B0F19] border-[#00F2FE]/30' : 'bg-white border-red-200 shadow-lg'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-red-500 font-black text-xl uppercase tracking-wider">
                      <Flame className="w-6 h-6 fill-red-500 animate-pulse" /> FLASH SALE
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                      darkMode ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-red-100 text-red-700'
                    }`}>
                      On Sale Now
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
                  {flashSaleProducts.map((product) => {
                    const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                    return (
                      <div 
                        key={`flash-${product.id}`}
                        className={`group rounded-2xl p-3 border relative flex flex-col justify-between transition-all ${
                          darkMode ? 'bg-white/[0.02] border-white/10 hover:border-red-500/50' : 'bg-slate-50 border-slate-200 hover:shadow-md'
                        }`}
                      >
                        <div>
                          <div className="relative w-full h-44 rounded-xl overflow-hidden mb-3 bg-slate-900">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute top-2 left-2 bg-red-600 text-white font-black text-[11px] px-2 py-0.5 rounded shadow-md">
                              -{discountPercent}%
                            </div>
                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-[#00F2FE] font-black text-[9px] px-2 py-0.5 rounded border border-white/10 uppercase">
                              {product.badge}
                            </div>
                          </div>

                          <h4 className={`font-extrabold text-xs mb-1 line-clamp-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {product.name}
                          </h4>

                          <div className="flex items-baseline gap-2 mb-2">
                            <span className={`text-lg font-black ${darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}`}>
                              ${product.price.toFixed(2)}
                            </span>
                            <span className={`text-xs line-through font-bold ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                              ${product.originalPrice.toFixed(2)}
                            </span>
                          </div>

                          <div className="space-y-1 mb-3">
                            <div className="flex justify-between text-[10px] font-bold text-gray-400">
                              <span>Sold: {product.soldCount}</span>
                              <span className="text-red-400">{product.stockPercent}% claimed</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-gray-700/50 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full" 
                                style={{ width: `${product.stockPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => addToCart(product)}
                          className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            darkMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                        >
                          Claim Deal
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* CATALOG */}
              <section id="catalog" className="pt-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                      <Sparkles className={`w-5 h-5 ${darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}`} /> Just For You
                    </h2>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                      Recommended items based on verified buyer rating and shipping speed
                    </p>
                  </div>

                  <div className="relative w-full sm:w-48">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className={`w-full px-4 py-2 rounded-xl text-xs font-bold outline-none border appearance-none cursor-pointer ${
                        darkMode 
                          ? 'bg-[#0B0F19] border-white/10 text-gray-300' 
                          : 'bg-white border-slate-200 text-slate-800 shadow-xs'
                      }`}
                    >
                      <option value="featured">Sort: Featured</option>
                      <option value="popular">Most Popular (Sold)</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Top Customer Rated</option>
                    </select>
                    <SlidersHorizontal className="w-3.5 h-3.5 absolute right-3.5 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className={`text-center py-20 rounded-3xl border ${
                    darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-bold text-gray-400">No products found matching your active filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => {
                      const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                      return (
                        <div 
                          key={product.id}
                          className={`group rounded-3xl p-4 border transition-all duration-300 flex flex-col justify-between ${
                            darkMode 
                              ? 'bg-[#0B0F19]/90 border-white/10 hover:border-[#00F2FE]/50 shadow-xl' 
                              : 'bg-white border-slate-200 hover:border-[#4F46E5]/50 hover:shadow-xl shadow-xs'
                          }`}
                        >
                          <div>
                            <div className={`relative w-full h-56 rounded-2xl overflow-hidden mb-4 ${
                              darkMode ? 'bg-slate-900' : 'bg-slate-100'
                            }`}>
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              
                              <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded shadow-md">
                                -{discountPercent}% OFF
                              </div>

                              <button 
                                onClick={() => setQuickViewProduct(product)}
                                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                title="Quick View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1 text-xs font-bold text-white">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{product.rating}</span>
                                <span className="text-gray-400 text-[10px]">({product.reviewsCount})</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-bold mb-1 uppercase tracking-wider">
                              <span className={darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}>{product.category}</span>
                              <span className={darkMode ? 'text-gray-400' : 'text-slate-500'}>by {product.supplier}</span>
                            </div>

                            <h3 className={`font-black text-base mb-2 line-clamp-1 ${darkMode ? 'text-white' : 'text-[#0F172A]'}`}>
                              {product.name}
                            </h3>

                            <p className={`text-xs line-clamp-2 mb-4 leading-relaxed ${
                              darkMode ? 'text-gray-400' : 'text-slate-600'
                            }`}>
                              {product.description}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 mb-3 pt-2 border-t border-white/5">
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Truck className="w-3 h-3" /> Free Delivery
                              </span>
                              <span>{product.soldCount} Sold</span>
                            </div>

                            <div className={`flex items-center justify-between pt-3 border-t ${
                              darkMode ? 'border-white/10' : 'border-slate-100'
                            }`}>
                              <div>
                                <span className={`text-[10px] uppercase font-bold block ${
                                  darkMode ? 'text-gray-400' : 'text-slate-500'
                                }`}>Price</span>
                                
                                <div className="flex items-baseline gap-2">
                                  <span className={`text-2xl font-black ${
                                    darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'
                                  }`}>
                                    ${product.price.toFixed(2)}
                                  </span>
                                  <span className={`text-xs line-through font-bold ${
                                    darkMode ? 'text-gray-500' : 'text-slate-400'
                                  }`}>
                                    ${product.originalPrice.toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => addToCart(product)}
                                className={`px-4 py-2.5 rounded-full font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                  addedId === product.id
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : darkMode
                                      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                                      : 'bg-[#0F172A] hover:bg-slate-800 text-white shadow-xs'
                                }`}
                              >
                                {addedId === product.id ? <><Check className="w-4 h-4" /> Added</> : <><Plus className="w-4 h-4" /> Add</>}
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

            </main>
          } />

          {/* ACCOUNT PAGE ROUTE */}
          <Route path="/account" element={<AccountPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        </Routes>

        {/* Account Modal (Kept as fallback in case you still have older components pointing to this state) */}
        {isAccountOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsAccountOpen(false)} />
            <div className={`relative w-full max-w-2xl rounded-3xl p-6 sm:p-8 z-10 border shadow-2xl transition-colors ${
              darkMode ? 'bg-[#0B0F19] text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'
            }`}>
              <button onClick={() => setIsAccountOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${
                  darkMode ? 'bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/30' : 'bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/20'
                }`}>
                  {userProfile.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-black">{userProfile.name}</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{userProfile.email}</p>
                </div>
              </div>

              <div className={`flex items-center gap-2 border-b pb-4 mb-6 ${
                darkMode ? 'border-white/10' : 'border-slate-200'
              }`}>
                <button 
                  onClick={() => setAccountTab("orders")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    accountTab === "orders" 
                      ? darkMode ? 'bg-white/10 text-[#00F2FE]' : 'bg-slate-100 text-[#4F46E5]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Package className="w-4 h-4" /> My Orders & Tracking
                </button>
                
                <button 
                  onClick={() => setAccountTab("profile")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    accountTab === "profile" 
                      ? darkMode ? 'bg-white/10 text-[#00F2FE]' : 'bg-slate-100 text-[#4F46E5]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4" /> Profile Details
                </button>
              </div>

              {accountTab === "orders" && (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
                  {MOCK_ORDERS.map((order) => (
                    <div key={order.id} className={`p-4 rounded-2xl border ${
                      darkMode ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-white/5">
                        <div>
                          <span className="font-extrabold text-xs mr-3">{order.id}</span>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {order.status}
                          </span>
                        </div>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{order.date}</span>
                      </div>

                      <div className="space-y-2 mb-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className={darkMode ? 'text-gray-300' : 'text-slate-700'}>{item.qty}x {item.name}</span>
                            <span className="font-bold">${item.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                          <Truck className="w-3.5 h-3.5 text-[#00F2FE]" />
                          <span>Tracking: <strong className={darkMode ? 'text-white' : 'text-slate-900'}>{order.trackingNumber}</strong></span>
                        </div>
                        <span className={`font-black ${darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}`}>${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {accountTab === "profile" && (
                <form onSubmit={(e) => { e.preventDefault(); showToast("Profile updated!"); }} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase block mb-1 text-gray-400">Full Name</label>
                      <input type="text" value={userProfile.name} onChange={(e) => setUserProfile({...userProfile, name: e.target.value})} className={`w-full px-4 py-2 rounded-xl border text-xs outline-none ${
                        darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase block mb-1 text-gray-400">Email Address</label>
                      <input type="email" value={userProfile.email} onChange={(e) => setUserProfile({...userProfile, email: e.target.value})} className={`w-full px-4 py-2 rounded-xl border text-xs outline-none ${
                        darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase block mb-1 text-gray-400">Shipping Address</label>
                    <input type="text" value={userProfile.address} onChange={(e) => setUserProfile({...userProfile, address: e.target.value})} className={`w-full px-4 py-2 rounded-xl border text-xs outline-none ${
                      darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`} />
                  </div>

                  <button type="submit" className={`w-full mt-4 font-black py-3 rounded-full uppercase text-xs tracking-wider ${
                    darkMode ? 'bg-[#00F2FE] text-black' : 'bg-[#4F46E5] text-white'
                  }`}>
                    Save Profile Settings
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Quick View Modal */}
        {quickViewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setQuickViewProduct(null)} />
            <div className={`relative w-full max-w-2xl rounded-3xl p-8 z-10 border shadow-2xl transition-colors ${
              darkMode ? 'bg-[#0B0F19] text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'
            }`}>
              <button onClick={() => setQuickViewProduct(null)} className="absolute top-6 right-6 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64 rounded-2xl overflow-hidden bg-slate-900">
                  <img src={quickViewProduct.image} alt={quickViewProduct.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <span className={`text-xs font-bold uppercase ${darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}`}>{quickViewProduct.category}</span>
                    <h3 className="text-2xl font-black mb-2">{quickViewProduct.name}</h3>
                    <p className={`text-xs mb-4 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                      {quickViewProduct.description}
                    </p>
                  </div>

                  <div>
                    <div className={`text-2xl font-black mb-4 ${darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}`}>${quickViewProduct.price.toFixed(2)}</div>
                    <button 
                      onClick={() => { addToCart(quickViewProduct); setQuickViewProduct(null); }}
                      className={`w-full font-black py-3.5 rounded-full uppercase text-xs ${
                        darkMode ? 'bg-[#00F2FE] text-black' : 'bg-[#4F46E5] text-white'
                      }`}
                    >
                      Add To Cart Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cart Drawer */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-xs" />
            <div className={`relative w-full max-w-md h-full flex flex-col justify-between p-6 shadow-2xl z-10 transition-colors ${
              darkMode 
                ? 'bg-[#0B0F19] text-white border-l border-white/10' 
                : 'bg-white text-slate-900 border-l border-slate-200'
            }`}>
              <div>
                <div className={`flex items-center justify-between pb-4 border-b ${
                  darkMode ? 'border-white/10' : 'border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className={`w-5 h-5 ${darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}`} />
                    <h3 className="font-extrabold uppercase text-lg">My Cart ({totalItems})</h3>
                  </div>
                  <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
                  {cart.length === 0 ? (
                    <div className="text-center py-16">
                      <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-40" />
                      <p className={`font-bold text-xs ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Your shopping cart is empty.</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className={`flex items-center gap-4 p-3 rounded-2xl border ${
                        darkMode ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs truncate">{item.name}</h4>
                          <p className={`text-xs font-black mt-0.5 ${darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}`}>${item.price.toFixed(2)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 rounded-full border flex items-center justify-center text-xs"><Minus className="w-3 h-3" /></button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 rounded-full border flex items-center justify-center text-xs"><Plus className="w-3 h-3" /></button>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {cart.length > 0 && (
                <div className={`pt-4 border-t ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                  <div className="space-y-1.5 text-xs mb-4">
                    <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Shipping</span><span className="font-bold">{shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}</span></div>
                    <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-200/20">
                      <span>Grand Total</span>
                      <span className={darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}>${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsCheckoutOpen(true)}
                    className={`w-full font-black py-4 rounded-full uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg ${
                      darkMode ? 'bg-[#00F2FE] text-black' : 'bg-[#4F46E5] text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" /> Place Order
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Checkout Modal */}
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsCheckoutOpen(false)} />
            <div className={`relative w-full max-w-lg rounded-3xl p-8 z-10 border shadow-2xl transition-colors ${
              darkMode ? 'bg-[#0B0F19] text-white border-white/10' : 'bg-white text-slate-900 border-slate-200'
            }`}>
              <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>

              {orderSuccess ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black uppercase mb-2">Order Confirmed!</h3>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>Tracking details generated in your account panel.</p>
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
                    showToast("Order placed successfully!");
                  }, 2000);
                }} className="space-y-4">
                  <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                    <Lock className={`w-5 h-5 ${darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}`} /> Express Checkout
                  </h3>

                  <div>
                    <label className="text-[10px] font-bold uppercase block mb-1 text-gray-400">Full Name</label>
                    <input required type="text" defaultValue={userProfile.name} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none ${
                      darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`} />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase block mb-1 text-gray-400">Shipping Address</label>
                    <input required type="text" defaultValue={userProfile.address} className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none ${
                      darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`} />
                  </div>

                  <button type="submit" className={`w-full mt-4 font-black py-4 rounded-full uppercase text-xs tracking-wider ${
                    darkMode ? 'bg-[#00F2FE] text-black' : 'bg-[#4F46E5] text-white'
                  }`}>
                    Pay ${grandTotal.toFixed(2)}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className={`border-t py-12 text-xs transition-colors ${
          darkMode ? 'bg-[#030509] border-white/10 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}>
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Zap className={`w-5 h-5 ${darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}`} />
              <span className={`font-extrabold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>Dexvee Express Marketplace</span>
            </div>
            <p>© 2026 Dexvee Store. Powered by DevLync Tech.</p>
          </div>
        </footer>

      </div>
    </Router>
  );
}