import React, { useState, useEffect } from 'react';
import { 
  Lock, Key, Zap, PackagePlus, Link as LinkIcon, Download, 
  Trash2, Plus, LogOut, LayoutDashboard, FileJson, AlertCircle, 
  RefreshCw, Eye, DollarSign, Users, TrendingUp 
} from 'lucide-react';

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "AeroPulse Wireless Earbuds",
    category: "Gadgets",
    costPrice: 20.00,
    price: 49.99,
    profit: 29.99,
    partnerSplit: 14.99,
    supplier: "External Supplier",
    tag: "Fast Shipping",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80"
  }
];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('dexvee_products');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  const [markupPercent, setMarkupPercent] = useState(40);

  useEffect(() => {
    localStorage.setItem('dexvee_products', JSON.stringify(products));
  }, [products]);

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

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect Admin Passcode.");
    }
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cjProductId: externalUrl, 
          customCategory: 'Gadgets' 
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        const pricing = calculatePricing(data.product?.supplierCost || 15.00);
        const newLiveItem = {
          id: data.product?.id || Date.now(),
          name: data.product?.name || "Imported Product",
          category: data.product?.category || "Gadgets",
          ...pricing,
          rating: data.product?.rating || 5.0,
          supplier: "CJ Dropshipping Sync",
          tag: "Live Firebase",
          image: data.product?.image || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80"
        };

        setProducts([newLiveItem, ...products]);
        setExternalUrl("");
        showStatus('success', `Successfully synced "${newLiveItem.name}" to Firebase!`);
      } else {
        showStatus('error', 'Failed to import product from backend.');
      }
    } catch (err) {
      showStatus('error', 'Network error connecting to Netlify function.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!manualItem.name || !manualItem.costPrice) return;

    const pricing = calculatePricing(manualItem.costPrice);

    const newItem = {
      id: Date.now(),
      name: manualItem.name,
      category: manualItem.category,
      ...pricing,
      rating: 5.0,
      supplier: manualItem.supplier || "External Supplier",
      tag: manualItem.tag || "New Arrival",
      image: manualItem.image || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80"
    };

    setProducts([newItem, ...products]);
    setManualItem({ name: "", category: "Gadgets", costPrice: "", supplier: "Dropship Partner", image: "", tag: "Imported" });
    showStatus('success', `Product live! Retail: $${pricing.price} (Your Profit: $${pricing.partnerSplit} | Partner: $${pricing.partnerSplit})`);
  };

  const handleDelete = (id) => {
    setProducts(products.filter(p => p.id !== id));
    showStatus('success', 'Product removed.');
  };

  const totalStoreProfit = products.reduce((sum, p) => sum + (p.profit || 0), 0);
  const myShare = totalStoreProfit / 2;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070A0F] text-white flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-[#0B0F19] border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#635BFF] to-[#00F2FE] p-[2px] mb-6 flex items-center justify-center">
            <div className="w-full h-full bg-[#070A0F] rounded-[14px] flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#00F2FE]" />
            </div>
          </div>
          <h1 className="text-2xl font-black uppercase mb-2">Dexvee Admin Portal</h1>
          <p className="text-xs text-gray-400 mb-6">Restricted access for store managers.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Passcode</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter passcode" 
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#00F2FE]"
                />
                <Key className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
              </div>
            </div>
            {authError && <p className="text-xs text-red-400 font-bold">{authError}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-[#635BFF] to-[#00F2FE] text-black font-black py-3.5 rounded-full uppercase text-xs">
              Access Portal
            </button>
          </form>
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
          <a href="/" target="_blank" rel="noreferrer" className="text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/5">
            <Eye className="w-3.5 h-3.5 text-[#00F2FE]" /> View Store
          </a>
          <button onClick={() => setIsAuthenticated(false)} className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/5">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
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
              <p className="text-xl font-black text-emerald-400">${totalStoreProfit.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-[#0B0F19] border border-white/10 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-[#00F2FE]/10 text-[#00F2FE] rounded-xl"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">50/50 Partner Payout</p>
              <p className="text-xl font-black text-[#00F2FE]">${myShare.toFixed(2)} <span className="text-xs text-gray-400 font-normal">each</span></p>
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
                  <label className="text-xs font-bold uppercase text-gray-400 block mb-1">Low Cost Supplier Price ($)</label>
                  <input required type="number" step="0.01" value={manualItem.costPrice} onChange={(e) => setManualItem({ ...manualItem, costPrice: e.target.value })} placeholder="12.00" className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs outline-none" />
                </div>
                
                {manualItem.costPrice && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs space-y-1">
                    <div className="flex justify-between text-gray-400"><span>Retail Price (+{markupPercent}%):</span> <span className="text-white font-bold">${calculatePricing(manualItem.costPrice).price}</span></div>
                    <div className="flex justify-between text-emerald-400"><span>Net Profit:</span> <span className="font-bold">${calculatePricing(manualItem.costPrice).profit}</span></div>
                    <div className="flex justify-between text-[#00F2FE]"><span>Your Share / Partner Share:</span> <span className="font-bold">${calculatePricing(manualItem.costPrice).partnerSplit} each</span></div>
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
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 font-bold text-white flex items-center gap-2">
                        <img src={p.image} alt={p.name} className="w-7 h-7 rounded object-cover" />
                        <span className="truncate max-w-[140px]">{p.name}</span>
                      </td>
                      <td className="py-3 text-gray-400">${(p.costPrice || 0).toFixed(2)}</td>
                      <td className="py-3 font-bold text-white">${(p.price || 0).toFixed(2)}</td>
                      <td className="py-3 font-bold text-emerald-400">${(p.profit || 0).toFixed(2)}</td>
                      <td className="py-3 font-bold text-[#00F2FE]">${(p.partnerSplit || 0).toFixed(2)}</td>
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
      </main>
    </div>
  );
}