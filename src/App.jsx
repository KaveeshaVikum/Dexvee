import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Truck, Plus, Minus, Trash2, X, ShoppingBag, CreditCard, CheckCircle2, Package, MapPin, Banknote, Edit3, ChevronRight } from 'lucide-react';

// Page Components
import AccountPage from './AccountPage';
import AboutUs from './AboutUs';
import AuthPage from './AuthPage';
import ProductPage from './ProductPage';
import FAQPage from './pages/FAQPage';
import ShippingReturnsPage from './pages/ShippingReturnsPage';
import ContactPage from './pages/ContactPage';
import Header from './components/Header';
import HomePage from './components/HomePage';
import SiteFooter from './components/SiteFooter';
import { STORE } from './data/siteContent';

// Firestore
import { db, auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { getUsdToLkrRate, formatLKR } from './utils/currency';

export default function App() {
  // Navigation & Filtering States

  // App States
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [priceReviewRequired, setPriceReviewRequired] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(true);
  
  const [toastMsg, setToastMsg] = useState("");
  const [darkMode] = useState(false);
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
            rating: data.rating ?? null,
            reviewsCount: data.reviewsCount ?? 0,
            soldCount: data.soldCount ?? 'New',
            stockPercent: data.stockPercent ?? 100,
            supplier: data.supplier || 'CJ Dropshipping',
            badge: data.badge || null,
            isFlashSale: data.isFlashSale ?? false,
            description: data.description || 'Imported and ready to ship.',
            image: data.image || (Array.isArray(data.images) ? data.images[0] : '') || '',
            images: Array.isArray(data.images) && data.images.length > 0
              ? data.images
              : (data.image ? [data.image] : []),
            vid: data.vid || null // CJ variant id — needed to get a real shipping quote
          };
        });
        setProducts(importedProducts);
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
    if (!bankDetailsConfigured) {
      setReceiptError('Bank transfer details are not configured yet. Please contact Dexvee before paying.');
      return;
    }
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
          items: cart.map((item) => ({ id: item.id, quantity: item.quantity })),
          shippingDetails,
          paymentMethod,
          expectedTotal: Math.round(grandTotal * 100) / 100,
          receiptImageBase64: paymentMethod === 'BANK_TRANSFER' ? receiptFile?.base64 : undefined,
          idToken
        })
      });
      const data = await res.json();

      if (data.code === 'PRICE_CHANGED') {
        const authoritative = data.authoritative;
        if (authoritative) {
          const refreshedItems = new Map((authoritative.items || []).map((item) => [item.id, item]));
          setCart((current) => current.map((item) => {
            const updated = refreshedItems.get(item.id);
            return updated ? { ...item, ...updated } : item;
          }));
          setShippingCost(Number(authoritative.shippingCost) || 0);
          setShippingInfo(authoritative.shippingInfo || null);
          if (Number.isFinite(authoritative.lkrRate) && authoritative.lkrRate > 0) {
            setLkrRate(authoritative.lkrRate);
          }
        }
        setPriceReviewRequired(true);
        showToast("Prices or delivery changed. Review the updated total and submit again.");
        setPlacingOrder(false);
        return;
      }

      if (!data.success) {
        showToast(data.error || "Couldn't place order — please try again.");
        setPlacingOrder(false);
        return;
      }

      setPlacingOrder(false);
      setOrderSuccess(true);
      setPriceReviewRequired(false);
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
      setShippingLoading(false);
      return;
    }

    // Ask the server for a quote/rate even when free-shipping applies; the
    // server remains the authority on both the carrier and USD/LKR rate.
    if (subtotal > 50) setShippingCost(0);

    let cancelled = false;
    setShippingLoading(true);

    // Debounce so rapid +/- quantity clicks don't spam the API.
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/.netlify/functions/calculate-shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map((item) => ({ id: item.id, quantity: item.quantity }))
          })
        });
        const data = await res.json();
        if (cancelled) return;

        if (res.ok && data.success) {
          setShippingCost(subtotal > 50 ? 0 : data.shippingCost);
          setShippingInfo({
            ...(data.breakdown || {}),
            carrier: data.carrier || data.breakdown?.carrier || null,
            isLiveQuote: data.isLiveQuote,
            fallbackReason: data.fallbackReason,
            quotedShippingCost: data.shippingCost,
            estimatedItemCount: data.estimatedItemCount
          });
          if (Number.isFinite(data.lkrRate) && data.lkrRate > 0) setLkrRate(data.lkrRate);
        } else {
          console.error('Shipping calculation failed:', data.error);
          setShippingCost(subtotal > 50 ? 0 : totalItems * 2.5);
          setShippingInfo(null);
        }
      } catch (err) {
        console.error('Shipping calculation error:', err);
        if (!cancelled) {
          setShippingCost(subtotal > 50 ? 0 : totalItems * 2.5);
          setShippingInfo(null);
        }
      } finally {
        if (!cancelled) setShippingLoading(false);
      }
    }, 500);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [cart, subtotal, totalItems]);

  const grandTotal = subtotal + shippingCost;
  const bankDetailsConfigured = [STORE.bankName, STORE.bankAccountName, STORE.bankAccountNumber, STORE.bankBranch]
    .every((value) => typeof value === 'string' && value.trim().length > 0);

  // Categories come from the real products, so the menus always match the catalog.
  const categories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      const name = p.category || 'New Arrivals';
      const entry = map.get(name) || { name, count: 0, image: p.image };
      entry.count += 1;
      if (!entry.image) entry.image = p.image;
      map.set(name, entry);
    });
    return [...map.values()].sort((x, y) => y.count - x.count);
  }, [products]);

  return (
    <Router>
      <div className="min-h-screen font-sans bg-[#F5F5F5] text-gray-800">

        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[60] px-5 py-3 bg-white text-gray-800 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">{toastMsg}</span>
          </div>
        )}

        <Header
          user={user}
          totalItems={totalItems}
          onOpenCart={() => setIsCartOpen(true)}
          products={products}
          categories={categories}
          lkrRate={lkrRate}
        />

        {/* Application Routing */}
        <Routes>
          <Route path="/" element={
            <HomePage
              products={products}
              productsLoading={productsLoading}
              categories={categories}
              lkrRate={lkrRate}
              user={user}
              onAddToCart={addToCart}
            />
          } />
          <Route path="/product/:id" element={<ProductPage products={products} productsLoading={productsLoading} lkrRate={lkrRate} onAddToCart={addToCart} onBuyNow={handleBuyNow} />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/shipping-returns" element={<ShippingReturnsPage />} />
          <Route path="/returns" element={<ShippingReturnsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/auth" element={<AuthPage user={user} authReady={authReady} onProfileUpdated={bumpUser} />} />
          <Route path="/account" element={<AccountPage darkMode={darkMode} user={user} authReady={authReady} lkrRate={lkrRate} onProfileUpdated={bumpUser} />} />
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
                              {bankDetailsConfigured ? (
                                <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm space-y-1">
                                  <p><span className="text-gray-400">Bank:</span> <span className="font-bold text-gray-800">{STORE.bankName}</span></p>
                                  <p><span className="text-gray-400">Account Name:</span> <span className="font-bold text-gray-800">{STORE.bankAccountName}</span></p>
                                  <p><span className="text-gray-400">Account Number:</span> <span className="font-bold text-gray-800">{STORE.bankAccountNumber}</span></p>
                                  <p><span className="text-gray-400">Branch:</span> <span className="font-bold text-gray-800">{STORE.bankBranch}</span></p>
                                </div>
                              ) : (
                                <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
                                  Bank transfer details are not configured yet. Please do not transfer payment; contact Dexvee at{' '}
                                  <a className="font-black underline" href={`mailto:${STORE.contactEmail}`}>{STORE.contactEmail}</a>.
                                </p>
                              )}
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
                    {priceReviewRequired && (
                      <p role="status" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                        Updated server prices and delivery are shown below. The exchange rate is {Number(lkrRate).toFixed(2)} LKR per USD. Please review the items, shipping, and total, then submit again. Your selected receipt is still attached.
                      </p>
                    )}
                    
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
                      disabled={(isEditingAddress && checkoutStep === 1) || placingOrder || (checkoutStep >= 2 && paymentMethod === 'BANK_TRANSFER' && (!receiptFile || !bankDetailsConfigured))}
                      className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-lg flex items-center justify-center gap-2 ${
                        (isEditingAddress && checkoutStep === 1) || placingOrder || (checkoutStep >= 2 && paymentMethod === 'BANK_TRANSFER' && (!receiptFile || !bankDetailsConfigured))
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

        <SiteFooter categories={categories} />

      </div>
    </Router>
  );
}
