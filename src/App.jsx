import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  Sparkles, Zap, Truck, 
  ShoppingCart, Star, Plus, Minus, Trash2, X, Search, 
  ShoppingBag, CreditCard, CheckCircle2,
  User, Package, Clock, Flame, Tag, Gift, Award, MapPin, Banknote, Edit3, ChevronRight
} from 'lucide-react';

// Page Components
import AccountPage from './AccountPage';
import AboutUs from './AboutUs';
import AuthPage from './AuthPage';
import AdminImporter from "./pages/AdminImporter";
import ProductPage from './ProductPage';

// Firestore
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getUsdToLkrRate, formatLKR } from './utils/currency';

// --- DATA ---

const BANNER_DATA = [
  {
    id: 1,
    tag: "Tech Week",
    tagClass: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400",
    titleTop: "Level Up Your",
    highlight: "Workspace",
    highlightClass: "from-cyan-400 to-fuchsia-500",
    desc: "Up to 55% off on premium peripherals and accessories.",
    btnText: "Shop Now",
    btnClass: "bg-fuchsia-600 hover:bg-fuchsia-500 shadow-[0_0_20px_rgba(192,38,211,0.4)]",
    bgImg: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=1200&auto=format&fit=crop&q=80",
    bgAccents: ["bg-cyan-500/10", "bg-fuchsia-500/10"]
  },
  {
    id: 2,
    tag: "Audio Deals",
    tagClass: "border-purple-500/50 bg-purple-500/10 text-purple-400",
    titleTop: "Immersive Sound",
    highlight: "Experience",
    highlightClass: "from-purple-400 to-pink-500",
    desc: "Discover our new range of ANC wireless headphones.",
    btnText: "Explore Now",
    btnClass: "bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.4)]",
    bgImg: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=1200&auto=format&fit=crop&q=80",
    bgAccents: ["bg-purple-500/10", "bg-pink-500/10"]
  },
  {
    id: 3,
    tag: "Flash Sale",
    tagClass: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
    titleTop: "Next-Gen",
    highlight: "Smartwatches",
    highlightClass: "from-emerald-400 to-cyan-500",
    desc: "Track your fitness with precision. Limited time offer.",
    btnText: "Grab Deal",
    btnClass: "bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]",
    bgImg: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=80",
    bgAccents: ["bg-emerald-500/10", "bg-cyan-500/10"]
  }
];

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
  { id: "V1", type: "fixed", code: "DEXVEE5", minSpend: 30, discount: 5, collected: false },
  { id: "V2", type: "percent", code: "FLASH15", minSpend: 60, discount: 15, collected: false }
];

export default function App() {
  // Navigation & Filtering States
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState("featured");

  // App States
  const [currentBanner, setCurrentBanner] = useState(0);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [productsLoading, setProductsLoading] = useState(true);
  const [vouchers, setVouchers] = useState(MOCK_VOUCHERS);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(true);
  
  const [toastMsg, setToastMsg] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [lkrRate, setLkrRate] = useState(300);

  // User & Shipping Profile
  const [shippingDetails, setShippingDetails] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    district: "",
    postalCode: ""
  });
  
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");

  // Customer sign-in state. authReady stays false until Firebase has checked
  // for an existing session, so pages don't flash "signed out" on refresh.
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [, setUserTick] = useState(0);
  const bumpUser = () => setUserTick((t) => t + 1); // re-render after a name change

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  // Signed-in customers get their name/email filled in; guests start blank.
  useEffect(() => {
    if (!user) return;
    setShippingDetails((prev) => ({
      ...prev,
      name: prev.name || user.displayName || '',
      email: prev.email || user.email || ''
    }));
  }, [user]);
  const [receiptFile, setReceiptFile] = useState(null); // { base64, previewUrl, name }
  const [receiptError, setReceiptError] = useState("");

  // Shrinks the chosen image to a small JPEG in the browser before it's sent,
  // so even a big phone photo ends up a few hundred KB.
  const handleReceiptSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptError("");

    if (!file.type.startsWith('image/')) {
      setReceiptError("Please upload an image file (screenshot or photo of your receipt).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setReceiptError("That file is too large — please choose a smaller screenshot or photo.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setReceiptError("Couldn't read that file. Please try another image.");
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => setReceiptError("Couldn't open that image. Please try another one.");
      img.onload = () => {
        const maxSide = 1100;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

        let quality = 0.75;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > 800 * 1024 && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        if (dataUrl.length > 800 * 1024) {
          setReceiptError("Couldn't shrink that image enough — please upload a smaller screenshot.");
          return;
        }
        setReceiptFile({ base64: dataUrl, previewUrl: dataUrl, name: file.name });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % BANNER_DATA.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchImportedProducts = async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const importedProducts = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Unnamed Product',
            category: data.category || 'New Arrivals',
            price: data.sellingPrice ?? 0,
            originalPrice: data.originalPrice ?? null,
            rating: data.rating ?? 5.0,
            reviewsCount: data.reviewsCount ?? 0,
            soldCount: data.soldCount ?? 'New',
            stockPercent: data.stockPercent ?? 100,
            supplier: data.supplier || 'CJ Dropshipping',
            badge: data.badge || 'Sample Checked',
            isFlashSale: data.isFlashSale ?? false,
            description: data.description || 'Imported and ready to ship.',
            image: data.image || (Array.isArray(data.images) ? data.images[0] : '') || '',
            images: Array.isArray(data.images) && data.images.length > 0
              ? data.images
              : (data.image ? [data.image] : []),
            vid: data.vid || null // CJ variant id — needed to get a real shipping quote
          };
        });
        setProducts([...importedProducts, ...INITIAL_PRODUCTS]);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchImportedProducts();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const syncRate = () => {
      getUsdToLkrRate().then((rate) => { if (isMounted) setLkrRate(rate); });
    };
    syncRate();
    const interval = setInterval(syncRate, 60 * 60 * 1000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

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

  const handleBuyNow = (product, quantity = 1) => {
    addToCart(product, quantity);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
    setCheckoutStep(1); // Reset to first step
  };

  const [placingOrder, setPlacingOrder] = useState(false);

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'BANK_TRANSFER' && !receiptFile) {
      setReceiptError("Please upload your payment receipt before placing the order.");
      return;
    }

    setPlacingOrder(true);
    try {
      // If signed in, send a fresh ID token so the server can verify who is
      // ordering (it never trusts a user id sent by the browser). Guests send none.
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;

      const res = await fetch('/.netlify/functions/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            image: item.image,
            vid: item.vid || null,
            quantity: item.quantity,
            price: item.price
          })),
          shippingDetails,
          paymentMethod,
          subtotal,
          shippingCost,
          grandTotal,
          grandTotalLkr: Math.round(grandTotal * lkrRate * 100) / 100, // what the customer was actually shown
          lkrRate,
          // Reuse the exact carrier already quoted at checkout — CJ's order
          // API requires a logisticName, and it needs to match a route CJ
          // actually offers, not a guess.
          shippingCarrier: shippingInfo?.isLiveQuote ? shippingInfo.carrier : null,
          receiptImageBase64: paymentMethod === 'BANK_TRANSFER' ? receiptFile?.base64 : undefined,
          idToken
        })
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.error || "Couldn't place order — please try again.");
        setPlacingOrder(false);
        return;
      }

      setPlacingOrder(false);
      setOrderSuccess(true);
      setTimeout(() => {
        setOrderSuccess(false);
        setIsCheckoutOpen(false);
        setIsCartOpen(false);
        setCheckoutStep(1);
        setCart([]);
        setReceiptFile(null);

        if (data.paymentStatus === 'pending_verification') {
          showToast("Order placed! We'll verify your payment within 3 business days.");
        } else if (data.cjOrderStatus === 'created') {
          showToast("Order placed! Automatically forwarded to our supplier for approval.");
        } else {
          showToast("Order placed successfully!");
        }
      }, 3000);
    } catch (err) {
      console.error('Place order error:', err);
      showToast("Network error — order may not have gone through. Please try again.");
      setPlacingOrder(false);
    }
  };

  const proceedCheckout = () => {
    if (checkoutStep < 3) {
      setCheckoutStep(prev => prev + 1);
    } else {
      handlePlaceOrder();
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Real shipping cost — fetched live from CJ Dropshipping's freight API,
  // not a guessed flat rate. Free above the promo threshold, same as before.
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingInfo, setShippingInfo] = useState(null); // { carrier, etaDays, isLiveQuote, fallbackReason }

  useEffect(() => {
    if (cart.length === 0) {
      setShippingCost(0);
      setShippingInfo(null);
      return;
    }

    // Free shipping over the promo threshold — no need to call the API.
    if (subtotal > 50) {
      setShippingCost(0);
      setShippingInfo(null);
      return;
    }

    let cancelled = false;
    setShippingLoading(true);

    // Debounce so rapid +/- quantity clicks don't spam the API.
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/.netlify/functions/calculate-shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map((item) => ({ vid: item.vid, quantity: item.quantity })),
            destCountryCode: 'LK'
          })
        });
        const data = await res.json();
        if (cancelled) return;

        if (data.success) {
          setShippingCost(data.shippingCost);
          setShippingInfo({
            ...data.breakdown,
            isLiveQuote: data.isLiveQuote,
            fallbackReason: data.fallbackReason
          });
        } else {
          console.error('Shipping calculation failed:', data.error);
          setShippingCost(3.99); // fallback flat rate if the API call itself fails
          setShippingInfo(null);
        }
      } catch (err) {
        console.error('Shipping calculation error:', err);
        if (!cancelled) {
          setShippingCost(3.99);
          setShippingInfo(null);
        }
      } finally {
        if (!cancelled) setShippingLoading(false);
      }
    }, 500);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [cart, subtotal]);

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

  // Live autocomplete suggestions for the search box, Daraz-style.
  const searchSuggestions = searchQuery.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 6)
    : [];

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

        {/* Top Minimalist Bar - Deep Dark */}
        <div className="bg-[#0D0717] text-[11px] py-2 px-6 border-b border-white/5">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-gray-400">
            <div className="flex items-center gap-4">
              <span>Welcome to Dexvee</span>
              <span className="hidden md:inline">|</span>
              <span className="hidden md:inline text-cyan-400 font-medium">Free Shipping on Orders over {formatLKR(50, lkrRate)}</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/admin" className="hover:text-cyan-400 transition-colors">Sell on Dexvee</Link>
              <Link to="/account" className="hover:text-cyan-400 transition-colors">Track Order</Link>
            </div>
          </div>
        </div>

        {/* Main Solid Brand Header - Dark Purple */}
        <header className="bg-[#1A0F2E] sticky top-0 z-40 shadow-lg border-b border-fuchsia-500/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-6">
            
            {/* Brand Logo */}
            <Link to="/" className="flex items-center shrink-0">
               <img 
                 src="/logo.png" 
                 alt="Dexvee" 
                 className="h-10 md:h-11 object-contain drop-shadow-lg" 
               />
            </Link>

            {/* Search Box */}
            <div className="flex-1 max-w-3xl hidden sm:flex items-center relative">
              <div className="w-full flex items-center bg-white border border-gray-200 rounded-2xl overflow-hidden p-1.5 shadow-inner">
                <input 
                  type="text" 
                  placeholder="Search in Dexvee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') setShowSuggestions(false); }}
                  className="w-full bg-transparent px-5 py-2 text-sm outline-none text-gray-800 placeholder-gray-400"
                />
                <button className="px-8 py-2.5 bg-cyan-500 text-[#0D0717] font-black text-sm flex items-center gap-2 hover:bg-cyan-400 transition-colors rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                  <Search className="w-4 h-4" /> 
                </button>
              </div>

              {/* Live suggestions dropdown */}
              {showSuggestions && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  {searchSuggestions.length > 0 ? (
                    searchSuggestions.map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.id}`}
                        onClick={() => { setSearchQuery(p.name); setShowSuggestions(false); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                      >
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg shrink-0 bg-gray-50" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium truncate">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.category}</p>
                        </div>
                        <span className="text-sm font-bold text-[#1A0F2E] shrink-0">{formatLKR(p.price, lkrRate)}</span>
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">No products found for "{searchQuery}"</div>
                  )}
                </div>
              )}
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-6 shrink-0 text-white">
              <Link to={user ? "/account" : "/auth"} className="flex items-center gap-2 hover:text-cyan-400 transition-colors cursor-pointer bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span className="text-sm font-medium hidden md:block">
                  {user ? (user.displayName?.split(' ')[0] || 'My Account') : 'Sign In'}
                </span>
              </Link>

              <button onClick={() => setIsCartOpen(true)} className="relative flex items-center gap-2 hover:text-cyan-400 transition-colors bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-sm font-medium hidden md:block">Cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-fuchsia-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(217,70,239,0.5)]">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Application Routing */}
        <Routes>
          <Route path="/" element={
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-24 space-y-10">
              
              {/* Split Hero Banner */}
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="w-full lg:w-3/4 relative bg-[#0D0717] rounded-3xl overflow-hidden shadow-sm border border-white/10 min-h-[320px]">
                  {BANNER_DATA.map((banner, index) => (
                    <div
                      key={banner.id}
                      className={`absolute inset-0 w-full h-full flex items-center transition-opacity duration-1000 ease-in-out ${
                        index === currentBanner ? "opacity-100 z-10" : "opacity-0 z-0"
                      }`}
                    >
                      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30" style={{ backgroundImage: `url(${banner.bgImg})` }} />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0D0717] via-[#0D0717]/80 to-transparent" />
                      <div className={`absolute top-0 right-0 w-96 h-96 ${banner.bgAccents[0]} rounded-full blur-3xl -translate-y-1/2 translate-x-1/3`}></div>
                      <div className={`absolute bottom-0 left-10 w-72 h-72 ${banner.bgAccents[1]} rounded-full blur-3xl translate-y-1/2`}></div>
                      <div className="relative z-20 p-10 md:p-14 w-full md:w-2/3">
                        <div className={`inline-block px-3 py-1 mb-4 border ${banner.tagClass} text-xs font-black tracking-widest uppercase rounded-full`}>{banner.tag}</div>
                        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
                          {banner.titleTop} <br />
                          <span className={`text-transparent bg-clip-text bg-gradient-to-r ${banner.highlightClass}`}>{banner.highlight}</span>
                        </h1>
                        <p className="text-gray-300 mb-8 font-medium">{banner.desc}</p>
                        <button className={`${banner.btnClass} text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-wider transition-all`}>{banner.btnText}</button>
                      </div>
                    </div>
                  ))}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    {BANNER_DATA.map((_, index) => (
                      <button key={index} onClick={() => setCurrentBanner(index)} className={`transition-all duration-300 rounded-full ${index === currentBanner ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/80"}`} />
                    ))}
                  </div>
                </div>

                <div className="w-full lg:w-1/4 bg-[#1A0F2E] rounded-3xl p-6 shadow-sm border border-white/10 flex flex-col justify-center relative overflow-hidden">
                  <div className="relative z-10 text-center">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <Gift className="w-6 h-6 text-fuchsia-400" />
                    </div>
                    <h3 className="text-white font-black text-lg mb-1">Claim Vouchers</h3>
                    <p className="text-gray-400 text-xs font-medium mb-6">Exclusive savings inside</p>
                    <div className="space-y-3">
                      {vouchers.map(v => (
                        <div key={v.id} className="bg-[#0D0717] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                          <div className="text-left">
                            <div className="text-cyan-400 font-black text-lg leading-none">{v.type === "percent" ? `${v.discount}% OFF` : `${formatLKR(v.discount, lkrRate)} OFF`}</div>
                            <div className="text-gray-500 text-[10px] mt-1 uppercase tracking-wider">Min {formatLKR(v.minSpend, lkrRate)}</div>
                          </div>
                          <button onClick={() => collectVoucher(v.id)} disabled={v.collected} className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${v.collected ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white text-[#0D0717] hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]'}`}>
                            {v.collected ? "Got It" : "Claim"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
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
                      <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl transition-all ${isSelected ? 'bg-[#1A0F2E]/10 text-[#1A0F2E] border-2 border-[#1A0F2E]/20 shadow-sm' : 'hover:bg-gray-50 text-gray-600 border-2 border-transparent hover:border-gray-100'}`}>
                        <IconComp className={`w-7 h-7 ${isSelected ? 'text-[#1A0F2E]' : 'text-gray-400'}`} />
                        <span className="text-sm font-semibold">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Flash Sale Banner */}
              <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6 px-2">
                  <h2 className="text-[#1A0F2E] text-2xl font-black">Flash Sale</h2>
                  <span className="bg-[#1A0F2E] text-white text-xs px-3 py-1 rounded-xl font-bold uppercase tracking-widest shadow-sm">Live</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {flashSaleProducts.map((product) => (
                    <Link key={product.id} to={`/product/${product.id}`} className="group cursor-pointer bg-gray-50 rounded-3xl p-3 hover:shadow-md transition-all border border-transparent hover:border-gray-200 block">
                      <div className="aspect-square bg-white mb-4 overflow-hidden rounded-2xl relative">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 right-3 bg-[#1A0F2E] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
                          -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                        </div>
                      </div>
                      <div className="px-2 pb-2">
                        <div className="text-[#1A0F2E] text-xl font-black">{formatLKR(product.price, lkrRate)}</div>
                        <div className="text-gray-400 text-sm line-through font-medium">{formatLKR(product.originalPrice, lkrRate)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Just For You Grid */}
              <section>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-2">
                  <h2 className="text-2xl text-gray-800 font-black">Just For You</h2>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-gray-200 text-sm font-medium rounded-xl px-4 py-2.5 outline-none text-gray-600 bg-white hover:border-gray-300 transition-colors shadow-sm">
                    <option value="featured">Best Match</option>
                    <option value="price-low">Price Low to High</option>
                    <option value="price-high">Price High to Low</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="group bg-white rounded-3xl border border-gray-100 hover:border-[#1A0F2E]/30 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
                      <Link to={`/product/${product.id}`} className="cursor-pointer block">
                        <div className="aspect-square bg-gray-50 overflow-hidden relative">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-5">
                          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug h-10 mb-2 group-hover:text-[#1A0F2E]">{product.name}</h3>
                          <div className="text-[#1A0F2E] text-xl font-black mb-2">{formatLKR(product.price, lkrRate)}</div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-2">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span>{product.rating}</span><span className="mx-1 opacity-50">•</span><span>{product.soldCount} Sold</span>
                          </div>
                        </div>
                      </Link>
                      <div className="px-5 pb-5">
                        <button onClick={() => addToCart(product)} className="w-full py-2.5 border-2 border-[#1A0F2E] text-[#1A0F2E] hover:bg-[#1A0F2E] hover:text-white rounded-xl text-xs font-black transition-colors uppercase tracking-wider">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </main>
          } />

          <Route path="/product/:id" element={<ProductPage products={products} lkrRate={lkrRate} onAddToCart={addToCart} onBuyNow={handleBuyNow} />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/auth" element={<AuthPage user={user} authReady={authReady} onProfileUpdated={bumpUser} />} />
          <Route path="/account" element={<AccountPage darkMode={darkMode} user={user} authReady={authReady} lkrRate={lkrRate} onProfileUpdated={bumpUser} />} />
          <Route path="/admin" element={<AdminImporter />} />
        </Routes>

        {/* Sidebar Cart */}
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
                        <p className="text-[#1A0F2E] font-black text-base mt-1">{formatLKR(item.price, lkrRate)}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                            <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                            <span className="text-xs w-8 text-center font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
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
                    <div className="flex justify-between text-sm text-gray-500 font-medium"><span>Subtotal</span><span className="text-gray-800">{formatLKR(subtotal, lkrRate)}</span></div>
                    <div className="flex justify-between text-sm text-gray-500 font-medium"><span>Shipping</span><span className="text-gray-800">{shippingLoading ? "Calculating…" : (shippingCost === 0 ? "Free" : formatLKR(shippingCost, lkrRate))}</span></div>
                    <div className="flex justify-between font-black text-gray-900 text-2xl pt-3 border-t border-gray-200"><span>Total</span><span className="text-[#1A0F2E]">{formatLKR(grandTotal, lkrRate)}</span></div>
                  </div>
                  <button onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); setCheckoutStep(1); }} className="w-full py-4 bg-[#1A0F2E] text-white text-sm font-black rounded-2xl hover:bg-[#0D0717] uppercase tracking-widest transition-all shadow-lg hover:-translate-y-0.5">
                    PROCEED TO CHECKOUT
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Step-by-Step Checkout Full Takeover */}
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 bg-[#F5F5F5] overflow-y-auto font-sans">
            {/* Checkout Header */}
            <div className="bg-[#1A0F2E] border-b border-fuchsia-500/10 px-6 py-4 sticky top-0 z-40 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3 max-w-7xl mx-auto w-full">
                <img src="/logo.png" alt="Dexvee" className="h-8 object-contain" />
                <span className="text-2xl font-black text-white border-l-2 border-white/20 pl-3">Secure Checkout</span>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors absolute right-6">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {orderSuccess ? (
              <div className="flex items-center justify-center min-h-[80vh]">
                <div className="text-center bg-white p-10 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
                  <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  </div>
                  <h3 className="text-3xl font-black text-[#1A0F2E] mb-2">Order Confirmed!</h3>
                  <p className="text-gray-500 font-medium">Thank you! Your items will be shipped soon.</p>
                </div>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT COLUMN: Dynamic Wizard Steps */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Stepper Visualization */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                    <div className="relative flex items-center justify-between w-full max-w-md mx-auto mb-2">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-gray-100 rounded-full z-0"></div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-cyan-400 rounded-full z-0 transition-all duration-500" 
                           style={{ width: checkoutStep === 1 ? '0%' : checkoutStep === 2 ? '50%' : '100%' }}></div>
                      
                      {[1, 2, 3].map(step => (
                        <div key={step} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-colors duration-300 ${
                          checkoutStep >= step ? 'bg-[#1A0F2E] text-white shadow-md border-2 border-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {step}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between max-w-md mx-auto text-xs font-bold text-gray-400 px-1">
                      <span className={checkoutStep >= 1 ? 'text-[#1A0F2E]' : ''}>Shipping</span>
                      <span className={checkoutStep >= 2 ? 'text-[#1A0F2E]' : ''}>Payment</span>
                      <span className={checkoutStep >= 3 ? 'text-[#1A0F2E]' : ''}>Review</span>
                    </div>
                  </div>

                  {/* STEP 1: Address & Delivery */}
                  {checkoutStep === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-cyan-500" /> Shipping Details
                          </h3>
                          {!isEditingAddress && (
                            <button onClick={() => setIsEditingAddress(true)} className="text-xs font-bold text-cyan-500 flex items-center gap-1 hover:text-cyan-600 transition-colors uppercase">
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                          )}
                        </div>

                        {isEditingAddress ? (
                          <div className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="col-span-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Full Name</label>
                                <input type="text" value={shippingDetails.name} onChange={e => setShippingDetails({...shippingDetails, name: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-cyan-400 transition-colors" />
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Phone Number</label>
                                <input type="text" value={shippingDetails.phone} onChange={e => setShippingDetails({...shippingDetails, phone: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-cyan-400 transition-colors" />
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">City</label>
                                <input type="text" value={shippingDetails.city} onChange={e => setShippingDetails({...shippingDetails, city: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-cyan-400 transition-colors" />
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">District</label>
                                <input type="text" value={shippingDetails.district} onChange={e => setShippingDetails({...shippingDetails, district: e.target.value})} placeholder="e.g. Colombo" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-cyan-400 transition-colors" />
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Postal Code</label>
                                <input type="text" value={shippingDetails.postalCode} onChange={e => setShippingDetails({...shippingDetails, postalCode: e.target.value})} placeholder="e.g. 10100" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-cyan-400 transition-colors" />
                              </div>
                              <div className="col-span-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Street Address</label>
                                <input type="text" value={shippingDetails.address} onChange={e => setShippingDetails({...shippingDetails, address: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-cyan-400 transition-colors" />
                              </div>
                            </div>
                            {(() => {
                              const addressComplete = ['name', 'phone', 'address', 'city', 'district', 'postalCode'].every((k) => (shippingDetails[k] || '').trim());
                              return (
                                <>
                                  <button
                                    onClick={() => setIsEditingAddress(false)}
                                    disabled={!addressComplete}
                                    className={`text-xs font-bold px-6 py-2.5 rounded-xl transition-colors mt-2 ${addressComplete ? 'bg-[#1A0F2E] text-white hover:bg-[#0D0717]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                  >
                                    Save Address
                                  </button>
                                  {!addressComplete && <p className="text-[11px] text-gray-500 mt-2">Please fill in every field — we need your full address and postal code to deliver.</p>}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50 flex items-start gap-4">
                            <div className="mt-1 bg-cyan-100 p-2 rounded-full"><MapPin className="w-4 h-4 text-cyan-600" /></div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold text-gray-800">{shippingDetails.name}</span>
                                <span className="text-xs text-gray-500 font-bold bg-white px-2 py-0.5 rounded-md border border-gray-200">{shippingDetails.phone}</span>
                              </div>
                              <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                {shippingDetails.address}, {shippingDetails.city}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-6">
                          <Truck className="w-5 h-5 text-cyan-500" /> Delivery Options
                        </h3>
                        <label className="flex items-start gap-4 p-4 border-2 border-cyan-400 bg-cyan-50 rounded-2xl cursor-pointer relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-400"></div>
                          <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full border-4 border-cyan-500 bg-white shadow-sm"></div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-black text-gray-800">{shippingLoading ? "Calculating…" : (shippingCost === 0 ? "FREE" : formatLKR(shippingCost, lkrRate))}</span>
                              <span className="text-sm font-bold text-[#1A0F2E]">
                                {shippingInfo?.isLiveQuote ? shippingInfo.carrier : "Estimated Delivery"}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-gray-500 mt-1">
                              {shippingInfo?.isLiveQuote && shippingInfo?.etaDays
                                ? `Guaranteed by ${shippingInfo.etaDays} business days`
                                : "Guaranteed by 3-5 Business Days"}
                            </p>
                            {shippingInfo?.fallbackReason && (
                              <p className="text-[11px] text-amber-600 mt-1">{shippingInfo.fallbackReason}</p>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Payment Method */}
                  {checkoutStep === 2 && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-8 duration-300">
                      <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-6">
                        <Banknote className="w-5 h-5 text-fuchsia-500" /> Select Payment Method
                      </h3>
                      <div className="space-y-3">
                        {/* Card payments: not available yet — shown disabled so customers know it's planned */}
                        <div className="flex items-center justify-between p-5 border-2 border-gray-100 rounded-2xl bg-gray-50 opacity-60 cursor-not-allowed select-none" aria-disabled="true">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-xl bg-gray-100 text-gray-400"><CreditCard className="w-6 h-6" /></div>
                            <div>
                              <span className="font-bold text-gray-500 block">Credit/Debit Card</span>
                              <span className="text-xs text-gray-400 font-medium">Visa, MasterCard, Amex</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-600 bg-fuchsia-100 px-3 py-1.5 rounded-full">Coming Soon</span>
                        </div>

                        <label className={`flex items-center justify-between p-5 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'BANK_TRANSFER' ? 'border-fuchsia-500 bg-fuchsia-50/50' : 'border-gray-100 hover:border-gray-200'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl ${paymentMethod === 'BANK_TRANSFER' ? 'bg-fuchsia-100 text-fuchsia-600' : 'bg-gray-100 text-gray-400'}`}><Banknote className="w-6 h-6" /></div>
                            <div>
                              <span className="font-bold text-gray-800 block">Online Bank Transfer</span>
                              <span className="text-xs text-gray-500 font-medium">Pay by bank transfer, upload your receipt</span>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-4 ${paymentMethod === 'BANK_TRANSFER' ? 'border-fuchsia-500 bg-white' : 'border-gray-300'}`}></div>
                          <input type="radio" name="payment" className="hidden" checked={paymentMethod === 'BANK_TRANSFER'} onChange={() => setPaymentMethod('BANK_TRANSFER')} />
                        </label>

                        {paymentMethod === 'BANK_TRANSFER' && (
                          <div className="p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Transfer to this account</p>
                              <p className="text-sm mb-3"><span className="text-gray-500">Amount to transfer:</span> <span className="font-black text-gray-900">{formatLKR(grandTotal, lkrRate)}</span></p>
                              <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm space-y-1">
                                <p><span className="text-gray-400">Bank:</span> <span className="font-bold text-gray-800">[Your Bank Name]</span></p>
                                <p><span className="text-gray-400">Account Name:</span> <span className="font-bold text-gray-800">[Your Account Name]</span></p>
                                <p><span className="text-gray-400">Account Number:</span> <span className="font-bold text-gray-800">[Your Account Number]</span></p>
                                <p><span className="text-gray-400">Branch:</span> <span className="font-bold text-gray-800">[Your Branch]</span></p>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Upload your payment receipt</p>
                              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-fuchsia-400 hover:bg-fuchsia-50/30 transition-colors">
                                {receiptFile ? (
                                  <img src={receiptFile.previewUrl} alt="Receipt preview" className="max-h-40 rounded-lg object-contain" />
                                ) : (
                                  <>
                                    <Package className="w-6 h-6 text-gray-400" />
                                    <span className="text-xs text-gray-500 font-medium">Tap to upload a screenshot or photo</span>
                                  </>
                                )}
                                <input type="file" accept="image/*" className="hidden" onChange={handleReceiptSelect} />
                              </label>
                              {receiptFile && (
                                <button type="button" onClick={() => setReceiptFile(null)} className="text-xs text-red-500 font-bold mt-2 hover:underline">
                                  Remove and choose a different photo
                                </button>
                              )}
                              {receiptError && <p className="text-xs text-red-500 font-bold mt-2">{receiptError}</p>}
                            </div>

                            <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded-xl p-3">
                              We manually verify bank transfers within <span className="font-bold">3 business days</span>. Your order will be processed once we confirm your payment.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Review Items */}
                  {checkoutStep === 3 && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                          <Package className="w-5 h-5 text-[#1A0F2E]" /> Order Items
                        </h3>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">Package 1 of 1</span>
                      </div>
                      <div className="space-y-4">
                        {cart.map((item) => (
                          <div key={item.id} className="flex gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                            <img src={item.image} alt={item.name} className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-gray-200 bg-white" />
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="text-sm font-bold text-gray-800 line-clamp-2">{item.name}</h4>
                                <p className="text-xs text-gray-400 mt-1 font-medium">{item.supplier}</p>
                              </div>
                            </div>
                            <div className="text-right flex flex-col justify-between">
                              <div>
                                <div className="text-[#1A0F2E] font-black text-lg">{formatLKR(item.price, lkrRate)}</div>
                                {item.originalPrice && (
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="text-xs text-gray-400 line-through font-medium">{formatLKR(item.originalPrice, lkrRate)}</div>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs font-bold text-gray-600 bg-white border border-gray-200 self-end px-3 py-1 rounded-lg">Qty: {item.quantity}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Static Order Summary */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Promo Input */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-black text-gray-800 mb-3 uppercase tracking-wider">Promotion</h3>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Enter Voucher Code" 
                        className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-cyan-400 transition-colors" 
                      />
                      <button className="bg-[#1A0F2E] hover:bg-[#0D0717] text-white font-black px-6 py-2.5 rounded-xl text-sm transition-colors">
                        APPLY
                      </button>
                    </div>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-[#1A0F2E]/10 sticky top-24">
                    <h3 className="text-lg font-black text-gray-800 mb-4">Order Summary</h3>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Items Total ({totalItems})</span>
                        <span className="font-bold text-gray-800">{formatLKR(subtotal, lkrRate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 font-medium">Delivery Fee</span>
                        <span className="font-bold text-gray-800">{shippingLoading ? "Calculating…" : (shippingCost === 0 ? "FREE" : formatLKR(shippingCost, lkrRate))}</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-4 mb-6">
                      <div className="flex justify-between items-end">
                        <span className="text-gray-500 font-bold">Total</span>
                        <div className="text-right">
                          <div className="text-3xl font-black text-gray-900 leading-none mb-1">
                            {formatLKR(grandTotal, lkrRate)}
                          </div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">VAT Included</div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={proceedCheckout} 
                      disabled={(isEditingAddress && checkoutStep === 1) || placingOrder || (checkoutStep >= 2 && paymentMethod === 'BANK_TRANSFER' && !receiptFile)}
                      className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-lg flex items-center justify-center gap-2 ${
                        (isEditingAddress && checkoutStep === 1) || placingOrder || (checkoutStep >= 2 && paymentMethod === 'BANK_TRANSFER' && !receiptFile)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-[#1A0F2E] hover:bg-[#0D0717] text-white hover:-translate-y-1 hover:shadow-cyan-500/20'
                      }`}
                    >
                      {checkoutStep === 1 && "Proceed to Payment"}
                      {checkoutStep === 2 && "Review Order"}
                      {checkoutStep === 3 && (placingOrder ? "Placing Order…" : "Place Order")}
                      {!placingOrder && <ChevronRight className="w-4 h-4" />}
                    </button>
                    
                    {checkoutStep > 1 && (
                      <button onClick={() => setCheckoutStep(prev => prev - 1)} className="w-full mt-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-800 transition-colors uppercase tracking-wider">
                        Go Back
                      </button>
                    )}
                  </div>
                </div>
                
              </div>
            )}
          </div>
        )}

        {/* Minimalist Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16 py-10 text-center">
          <div className="flex justify-center gap-6 mb-4 text-xs font-semibold text-gray-500">
            <Link to="/about" className="hover:text-cyan-600 transition-colors">About Us</Link>
            <span>•</span>
            <Link to="/account" className="hover:text-cyan-600 transition-colors">Track Order</Link>
          </div>
          <p className="text-sm font-medium text-gray-400">© 2026 Dexvee Express. All rights reserved.</p>
        </footer>

      </div>
    </Router>
  );
}