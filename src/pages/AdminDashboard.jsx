import { useState, useEffect } from 'react';
import { 
  Lock, Mail, Zap, PackagePlus, Download,
  Trash2, Plus, LogOut, LayoutDashboard, AlertCircle,
  RefreshCw, Eye, DollarSign, Users, TrendingUp, Check, X, Banknote 
} from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { getUsdToLkrRate, formatLKR } from '../utils/currency';
import AdminOrdersPanel from './AdminOrdersPanel';

async function getAdminHeaders(user = auth.currentUser) {
  if (!user) throw new Error('Sign in again to continue.');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${await user.getIdToken()}`
  };
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      setAdminUser(user);
      if (!user) {
        setIsAuthenticated(false);
        setAuthChecking(false);
        return;
      }

      setAuthChecking(true);
      try {
        const response = await fetch('/.netlify/functions/admin-check', {
          method: 'POST',
          headers: await getAdminHeaders(user)
        });
        const data = await response.json();
        if (!active) return;
        if (response.ok && data.success) {
          setIsAuthenticated(true);
          setAuthError('');
        } else {
          setIsAuthenticated(false);
          setAuthError(data.error || 'This Firebase account is not authorized for admin access.');
        }
      } catch {
        if (active) {
          setIsAuthenticated(false);
          setAuthError('Could not verify admin access. Check the Netlify admin configuration and try again.');
        }
      } finally {
        if (active) setAuthChecking(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [markupPercent, setMarkupPercent] = useState(40);

  // Live USD→LKR exchange rate — supplier costs come in from CJ in USD, but
  // this dashboard displays everything to you in LKR. Refreshes once a day.
  const [lkrRate, setLkrRate] = useState(300);

  useEffect(() => {
    let isMounted = true;
    const syncRate = () => {
      getUsdToLkrRate().then((rate) => { if (isMounted) setLkrRate(rate); });
    };
    syncRate();
    const interval = setInterval(syncRate, 60 * 60 * 1000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  // Single source of truth: live-subscribe to Firestore so this table always
  // matches exactly what the storefront is reading. No more localStorage —
  // that's what let the admin view and the storefront drift apart before.
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveProducts = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Unnamed Product',
            category: data.category || 'Gadgets',
            costPrice: data.costPrice ?? 0,
            price: data.sellingPrice ?? 0,
            profit: data.totalProfit ?? 0,
            partnerSplit: data.partnerSplit ?? 0,
            supplier: data.supplier || 'External Supplier',
            tag: data.tag || 'Imported',
            image: data.image || (Array.isArray(data.images) ? data.images[0] : '') || ''
          };
        });
        setProducts(liveProducts);
        setProductsLoading(false);
      },
      (err) => {
        console.error('Failed to subscribe to products:', err);
        setProductsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const [dashboardTab, setDashboardTab] = useState('overview');
  const [activeTab, setActiveTab] = useState("url");
  const [externalUrl, setExternalUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const [manualItem, setManualItem] = useState({
    name: "",
    category: "Gadgets",
    costPrice: "",
    supplier: "Dropship Partner",
    image: "",
    tag: "Imported"
  });

  const showStatus = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword('');
    } catch (err) {
      setAuthError(err?.code === 'auth/invalid-credential'
        ? 'The email or password is incorrect.'
        : 'Could not sign in. Check the account details and try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setAuthError('Google sign-in failed. Please try again.');
      }
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setIsAuthenticated(false);
    setAdminUser(null);
    setAuthError('');
  };

  const calculatePricing = (baseCost) => {
    const cost = parseFloat(baseCost) || 10;
    const sellingPrice = cost * (1 + markupPercent / 100);
    const profit = sellingPrice - cost;
    const partnerSplit = profit / 2; 

    return {
      costPrice: cost,
      price: parseFloat(sellingPrice.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      partnerSplit: parseFloat(partnerSplit.toFixed(2))
    };
  };

  const handleUrlImport = async (e) => {
    e.preventDefault();
    if (!externalUrl) return;

    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      // FIXED: Endpoint changed to match plural 'import-products'
      const res = await fetch('/.netlify/functions/import-products', {
        method: 'POST',
        headers: await getAdminHeaders(),
        body: JSON.stringify({ 
          cjProductId: externalUrl, 
          customCategory: 'Gadgets' 
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // The Netlify function already wrote this to Firestore — the onSnapshot
        // listener above will pick it up on its own, so we just reset the form.
        setExternalUrl("");
        showStatus('success', `Successfully synced "${data.product?.name || 'product'}" to Firebase!`);
      } else {
        showStatus('error', data.error || 'Failed to import product from backend.');
      }
    } catch {
      showStatus('error', 'Network error connecting to Netlify function.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!manualItem.name || !manualItem.costPrice) return;

    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/manage-products', {
        method: 'POST',
        headers: await getAdminHeaders(),
        body: JSON.stringify({ action: 'add', ...manualItem, markupPercent })
      });
      const data = await res.json();

      if (data.success) {
        // onSnapshot picks this up automatically once Firestore confirms the write.
        setManualItem({ name: "", category: "Gadgets", costPrice: "", supplier: "Dropship Partner", image: "", tag: "Imported" });
        const pricing = calculatePricing(manualItem.costPrice);
        showStatus('success', `Product live! Retail: ${formatLKR(pricing.price, lkrRate)} (Your Profit: ${formatLKR(pricing.partnerSplit, lkrRate)} | Partner: ${formatLKR(pricing.partnerSplit, lkrRate)})`);
      } else {
        showStatus('error', data.error || 'Failed to add product.');
      }
    } catch {
      showStatus('error', 'Network error connecting to Netlify function.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch('/.netlify/functions/manage-products', {
        method: 'POST',
        headers: await getAdminHeaders(),
        body: JSON.stringify({ action: 'delete', id })
      });
      const data = await res.json();

      if (data.success) {
        // onSnapshot picks up the removal automatically.
        showStatus('success', 'Product removed.');
      } else {
        showStatus('error', data.error || 'Failed to remove product.');
      }
    } catch {
      showStatus('error', 'Network error connecting to Netlify function.');
    }
  };

  const [backfilling, setBackfilling] = useState(false);

  // One-time fix for products imported before we started tracking CJ's
  // variant id (vid) — without it, live shipping quotes can't be fetched
  // and checkout silently falls back to the same flat rate for everything.
  const handleBackfillShipping = async () => {
    setBackfilling(true);
    try {
      const res = await fetch('/.netlify/functions/backfill-vid', {
        method: 'POST',
        headers: await getAdminHeaders()
      });
      const data = await res.json();
      if (data.success) {
        showStatus('success', data.message);
      } else {
        showStatus('error', data.error || 'Backfill failed.');
      }
    } catch {
      showStatus('error', 'Network error connecting to Netlify function.');
    } finally {
      setBackfilling(false);
    }
  };

  // --- Bank transfer payments waiting for review ---
  // Orders hold customers' personal details, so the browser can't read them
  // from Firestore directly; these go through Firebase-authenticated functions.
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [zoomedReceipt, setZoomedReceipt] = useState(null);

  const loadPendingPayments = async () => {
    setPendingLoading(true);
    try {
      const res = await fetch('/.netlify/functions/get-pending-payments', {
        method: 'POST',
        headers: await getAdminHeaders(),
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        setPendingPayments(data.orders);
      } else {
        showStatus('error', data.error || 'Could not load pending payments.');
      }
    } catch {
      showStatus('error', 'Network error loading pending payments.');
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadPendingPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleReviewPayment = async (orderId, action) => {
    const verb = action === 'approve' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${verb} this payment?`)) return;

    setReviewingId(orderId);
    try {
      const res = await fetch('/.netlify/functions/review-payment', {
        method: 'POST',
        headers: await getAdminHeaders(),
        body: JSON.stringify({ orderId, action })
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'approve') {
          const msg = data.cjOrderStatus === 'created'
            ? 'Payment approved and the order was sent to CJ (unpaid in MyCJ — pay it there).'
            : `Payment approved, but CJ forwarding: ${data.cjOrderStatus}${data.cjError ? ' — ' + data.cjError : ''}. Place this one with CJ manually.`;
          showStatus('success', msg);
        } else {
          showStatus('success', 'Payment rejected.');
        }
        setPendingPayments((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        showStatus('error', data.error || 'Review failed.');
      }
    } catch {
      showStatus('error', 'Network error while reviewing payment.');
    } finally {
      setReviewingId(null);
    }
  };

  const totalStoreProfit = products.reduce((sum, p) => sum + (p.profit || 0), 0);
  const myShare = totalStoreProfit / 2;

  if (!isAuthenticated) {
    if (authChecking) {
      return <div className="min-h-screen bg-[#070A0F] text-white flex items-center justify-center p-6">Checking admin access…</div>;
    }
    return (
      <div className="min-h-screen bg-[#070A0F] text-white flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-[#0B0F19] border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#635BFF] to-[#00F2FE] p-[2px] mb-6 flex items-center justify-center">
            <div className="w-full h-full bg-[#070A0F] rounded-[14px] flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#00F2FE]" />
            </div>
          </div>
          <h1 className="text-2xl font-black uppercase mb-2">Dexvee Admin Portal</h1>
          <p className="text-xs text-gray-400 mb-6">Sign in with an approved Firebase account. Access is verified securely on the server.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Email address</label>
              <div className="relative">
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#00F2FE]"
                />
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Firebase account password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#00F2FE]"
                />
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              </div>
            </div>
            {authError && <p className="text-xs text-red-400 font-bold">{authError}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-[#635BFF] to-[#00F2FE] text-black font-black py-3.5 rounded-full uppercase text-xs">
              Sign in to Admin
            </button>
          </form>
          <button type="button" onClick={handleGoogleLogin} className="w-full mt-3 py-3 rounded-full border border-white/15 text-white text-xs font-bold hover:bg-white/5">
            Continue with Google
          </button>
          {adminUser && (
            <button type="button" onClick={handleSignOut} className="w-full mt-3 text-xs text-gray-400 hover:text-white">
              Sign out of {adminUser.email}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A0F] text-white font-sans">
      <header className="border-b border-white/10 bg-[#0B0F19]/90 backdrop-blur-xl px-8 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#635BFF] to-[#00F2FE] p-[2px] flex items-center justify-center">
            <div className="w-full h-full bg-[#070A0F] rounded-[10px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#00F2FE]" />
            </div>
          </div>
          <span className="font-extrabold tracking-wider bg-gradient-to-r from-[#635BFF] to-[#00F2FE] bg-clip-text text-transparent text-lg">
            Dexvee Profit Manager
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBackfillShipping}
            disabled={backfilling}
            title="One-time fix: fetches the missing CJ variant ID for products imported before live shipping quotes were added, so checkout can price them correctly instead of using a flat fallback rate."
            className={`text-xs font-bold flex items-center gap-1.5 px-4 py-2 rounded-full border transition-colors ${
              backfilling
                ? 'text-gray-500 border-white/5 cursor-not-allowed'
                : 'text-gray-300 hover:text-white border-white/10 hover:bg-white/5'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#00F2FE] ${backfilling ? 'animate-spin' : ''}`} />
            {backfilling ? 'Fixing Shipping IDs…' : 'Fix Shipping IDs'}
          </button>
          <a href="/" target="_blank" rel="noreferrer" className="text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/5">
            <Eye className="w-3.5 h-3.5 text-[#00F2FE]" /> View Store
          </a>
          <button onClick={handleSignOut} className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/5">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <nav className="flex gap-2 mb-6" aria-label="Admin sections">
          <button type="button" onClick={() => setDashboardTab('overview')} aria-pressed={dashboardTab === 'overview'} className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wide transition-colors ${dashboardTab === 'overview' ? 'bg-[#635BFF] text-white' : 'border border-white/10 text-gray-400 hover:text-white'}`}>
            Catalog & Payments
          </button>
          <button type="button" onClick={() => setDashboardTab('orders')} aria-pressed={dashboardTab === 'orders'} className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wide transition-colors ${dashboardTab === 'orders' ? 'bg-[#635BFF] text-white' : 'border border-white/10 text-gray-400 hover:text-white'}`}>
            Orders
          </button>
        </nav>

        {dashboardTab === 'orders' ? <AdminOrdersPanel /> : (
          <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-[#635BFF]/10 text-[#635BFF] rounded-xl"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Store Profit Margin</p>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="number" 
                  value={markupPercent} 
                  onChange={(e) => setMarkupPercent(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded text-center text-sm font-bold text-[#00F2FE] outline-none"
                />
                <span className="text-sm font-bold">% Profit Markup</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><DollarSign className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Catalog Total Profit</p>
              <p className="text-xl font-black text-emerald-400">{formatLKR(totalStoreProfit, lkrRate)}</p>
            </div>
          </div>

          <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-[#00F2FE]/10 text-[#00F2FE] rounded-xl"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">50/50 Partner Payout</p>
              <p className="text-xl font-black text-[#00F2FE]">{formatLKR(myShare, lkrRate)} <span className="text-xs text-gray-400 font-normal">each</span></p>
            </div>
          </div>
        </div>

        {statusMsg.text && (
          <div className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
            statusMsg.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            <AlertCircle className="w-4 h-4" /> {statusMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-[#0B0F19] border border-white/10 rounded-3xl p-6 h-fit">
            <h2 className="text-lg font-black uppercase mb-1 flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-[#00F2FE]" /> Import & Set Markup
            </h2>
            <p className="text-xs text-gray-400 mb-6">Upload products with built-in profit split.</p>

            <div className="flex rounded-full p-1 bg-white/5 border border-white/10 mb-6 text-xs font-bold">
              <button onClick={() => setActiveTab("url")} className={`flex-1 py-2 rounded-full ${activeTab === "url" ? "bg-[#635BFF] text-white" : "text-gray-400"}`}>
                URL Import
              </button>
              <button onClick={() => setActiveTab("manual")} className={`flex-1 py-2 rounded-full ${activeTab === "manual" ? "bg-[#635BFF] text-white" : "text-gray-400"}`}>
                Manual Add
              </button>
            </div>

            {activeTab === "url" && (
              <form onSubmit={handleUrlImport} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Supplier Product ID / URL</label>
                  <input 
                    required type="text" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="e.g. CJ-998877 or URL"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs outline-none focus:border-[#00F2FE]"
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#635BFF] to-[#00F2FE] text-black font-black py-3.5 rounded-full uppercase text-xs flex items-center justify-center gap-2">
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {loading ? "Syncing to Firebase..." : "Import with Profit Margin"}
                </button>
              </form>
            )}

            {activeTab === "manual" && (
              <form onSubmit={handleManualAdd} className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Product Title</label>
                  <input required type="text" value={manualItem.name} onChange={(e) => setManualItem({ ...manualItem, name: e.target.value })} placeholder="Smart Wireless Watch" className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Low Cost Supplier Price (USD $)</label>
                  <input required type="number" step="0.01" value={manualItem.costPrice} onChange={(e) => setManualItem({ ...manualItem, costPrice: e.target.value })} placeholder="12.00" className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs outline-none" />
                  <p className="text-[10px] text-gray-500 mt-1">Entered in USD (what the supplier bills you) — shown to you and customers in LKR below.</p>
                </div>
                
                {manualItem.costPrice && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs space-y-1">
                    <div className="flex justify-between text-gray-400"><span>Retail Price (+{markupPercent}%):</span> <span className="text-white font-bold">{formatLKR(calculatePricing(manualItem.costPrice).price, lkrRate)}</span></div>
                    <div className="flex justify-between text-emerald-400"><span>Net Profit:</span> <span className="font-bold">{formatLKR(calculatePricing(manualItem.costPrice).profit, lkrRate)}</span></div>
                    <div className="flex justify-between text-[#00F2FE]"><span>Your Share / Partner Share:</span> <span className="font-bold">{formatLKR(calculatePricing(manualItem.costPrice).partnerSplit, lkrRate)} each</span></div>
                  </div>
                )}

                <button type="submit" className="w-full bg-gradient-to-r from-[#635BFF] to-[#00F2FE] text-black font-black py-3 rounded-full uppercase text-xs flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </form>
            )}
          </div>

          <div className="lg:col-span-2 bg-[#0B0F19] border border-white/10 rounded-3xl p-6">
            <h2 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-[#635BFF]" /> Live Products & Split Breakdown
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 uppercase">
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Cost Price</th>
                    <th className="pb-3">Selling Price</th>
                    <th className="pb-3">Total Profit</th>
                    <th className="pb-3">Your Split (50%)</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {productsLoading && <tr><td colSpan={6} className="py-8 text-center text-gray-500">Loading products…</td></tr>}
                  {!productsLoading && products.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500">No products in the catalog yet.</td></tr>}
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 font-bold text-white flex items-center gap-2">
                        <img src={p.image} alt={p.name} className="w-7 h-7 rounded object-cover" />
                        <span className="truncate max-w-[140px]">{p.name}</span>
                      </td>
                      <td className="py-3 text-gray-400">{formatLKR(p.costPrice, lkrRate)}</td>
                      <td className="py-3 font-bold text-white">{formatLKR(p.price, lkrRate)}</td>
                      <td className="py-3 font-bold text-emerald-400">{formatLKR(p.profit, lkrRate)}</td>
                      <td className="py-3 font-bold text-[#00F2FE]">{formatLKR(p.partnerSplit, lkrRate)}</td>
                      <td className="py-3 text-right">
                        <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        <div className="mt-8 bg-[#0B0F19] border border-white/10 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-black uppercase flex items-center gap-2">
              <Banknote className="w-5 h-5 text-[#00F2FE]" /> Bank Transfer Payments to Verify
              {pendingPayments.length > 0 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-2 py-0.5">{pendingPayments.length} pending</span>
              )}
            </h2>
            <button onClick={loadPendingPayments} disabled={pendingLoading} className="text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5">
              <RefreshCw className={`w-3.5 h-3.5 ${pendingLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-5">Check each receipt against your bank account before approving. Approving sends the order to CJ (created unpaid — you still pay it in MyCJ). Oldest first.</p>

          {pendingPayments.length === 0 ? (
            <p className="text-xs text-gray-500 py-6 text-center">{pendingLoading ? 'Loading…' : 'No payments waiting for review.'}</p>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((o) => {
                const ageDays = o.createdAtMs ? Math.floor((Date.now() - o.createdAtMs) / 86400000) : 0;
                return (
                  <div key={o.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                    {o.receiptImage ? (
                      <img src={o.receiptImage} alt="Payment receipt" onClick={() => setZoomedReceipt(o.receiptImage)} className="w-full md:w-40 h-40 object-cover rounded-xl cursor-zoom-in border border-white/10" />
                    ) : (
                      <div className="w-full md:w-40 h-40 rounded-xl border border-dashed border-white/20 flex items-center justify-center text-xs text-gray-500">No receipt found</div>
                    )}
                    <div className="flex-1 text-xs space-y-1">
                      <p className="font-black text-sm text-white">{o.shippingDetails?.name} <span className="text-gray-400 font-normal">· {o.shippingDetails?.phone}</span></p>
                      <p className="text-gray-400">{o.shippingDetails?.address}, {o.shippingDetails?.city}</p>
                      <p className="text-gray-400">{(o.items || []).map((i) => `${i.name} ×${i.quantity}`).join(', ')}</p>
                      <p className="pt-1">Expected transfer: <span className="font-black text-[#00F2FE]">{o.grandTotalLkr ? `Rs. ${Number(o.grandTotalLkr).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : formatLKR(o.grandTotal, lkrRate)}</span></p>
                      <p className={ageDays >= 2 ? 'text-amber-400 font-bold' : 'text-gray-500'}>Placed {ageDays === 0 ? 'today' : `${ageDays} day${ageDays > 1 ? 's' : ''} ago`}{ageDays >= 2 ? ' — nearing your 3-day promise' : ''}</p>
                      <p className="text-gray-600 font-mono">Order {o.id}</p>
                    </div>
                    <div className="flex md:flex-col gap-2 md:justify-center">
                      <button onClick={() => handleReviewPayment(o.id, 'approve')} disabled={reviewingId === o.id} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 text-xs font-bold disabled:opacity-50">
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={() => handleReviewPayment(o.id, 'reject')} disabled={reviewingId === o.id} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 text-xs font-bold disabled:opacity-50">
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {zoomedReceipt && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => setZoomedReceipt(null)}>
            <img src={zoomedReceipt} alt="Receipt" className="max-h-full max-w-full rounded-xl" />
          </div>
        )}
          </>
        )}
      </main>
    </div>
  );
}
