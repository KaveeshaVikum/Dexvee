import React, { useState } from 'react';
import { Search, ShoppingBag, User, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#070A0F]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00F2FE] to-[#635BFF] flex items-center justify-center font-black text-black text-xl">
              D
            </div>
            <span className="text-2xl font-black tracking-tight text-white uppercase">
              Dexvee
            </span>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search for gaming gear, smart watches..." 
              className="w-full bg-[#0B0F19] border border-white/10 focus:border-[#00F2FE] rounded-full py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-gray-500 outline-none transition-all"
            />
          </div>

          {/* Icons (Cart & Profile) */}
          <div className="hidden md:flex items-center gap-6">
            <button className="text-gray-300 hover:text-[#00F2FE] transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
              <User className="w-5 h-5" /> Account
            </button>
            
            <button className="relative p-2 text-gray-300 hover:text-[#00F2FE] transition-colors">
              <ShoppingBag className="w-6 h-6" />
              {/* Cart Badge */}
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#635BFF] rounded-full border-2 border-[#070A0F]"></span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button className="relative p-2 text-gray-300">
              <ShoppingBag className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#635BFF] rounded-full"></span>
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#0B0F19] border-b border-white/10 px-4 py-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-11 pr-4 text-sm text-white outline-none"
            />
          </div>
          <button className="w-full text-left py-2 text-sm font-bold uppercase tracking-wide text-gray-300 flex items-center gap-3">
            <User className="w-5 h-5" /> Account Settings
          </button>
        </div>
      )}
    </nav>
  );
}