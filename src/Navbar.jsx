import React from 'react';
import { Link } from 'react-router-dom';
import { Gift, Lock, Sun, Moon, Search, User, ShoppingCart } from 'lucide-react';

export default function NavBar({ 
  darkMode, 
  setDarkMode, 
  searchQuery, 
  setSearchQuery, 
  userProfile, 
  totalItems, 
  setIsCartOpen 
}) {
  return (
    <>
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
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            {/* REAL LOGO IMAGE TAG - Update the src path below */}
            <img 
              src="/logo.png" 
              alt="Dexvee Logo" 
              className="w-10 h-10 object-contain drop-shadow-lg" 
            />
            
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
    </>
  );
}