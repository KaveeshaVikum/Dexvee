import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer({ darkMode }) {
  return (
    <footer className={`pt-16 pb-8 border-t transition-colors duration-500 ${
      darkMode ? 'bg-[#04060A] border-white/10 text-gray-400' : 'bg-slate-50 border-slate-200 text-slate-600'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Top Section: Links & Apps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          
          {/* Customer Care */}
          <div>
            <h3 className={`text-lg font-black uppercase tracking-wider mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Customer Care</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/help" className="hover:underline hover:text-[#00F2FE] transition-colors">Help Center</Link></li>
              <li><Link to="/how-to-buy" className="hover:underline hover:text-[#00F2FE] transition-colors">How to Buy</Link></li>
              <li><Link to="/corporate" className="hover:underline hover:text-[#00F2FE] transition-colors">Corporate & Bulk Purchasing</Link></li>
              <li><Link to="/contact" className="hover:underline hover:text-[#00F2FE] transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Dexvee Info */}
          <div>
            <h3 className={`text-lg font-black uppercase tracking-wider mb-6 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Dexvee</h3>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link to="/about" className="hover:underline hover:text-[#00F2FE] transition-colors">About Dexvee</Link></li>
              <li><Link to="/careers" className="hover:underline hover:text-[#00F2FE] transition-colors">Careers</Link></li>
              <li><Link to="/terms" className="hover:underline hover:text-[#00F2FE] transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:underline hover:text-[#00F2FE] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/affiliate" className="hover:underline hover:text-[#00F2FE] transition-colors">Join Affiliate Program</Link></li>
            </ul>
          </div>

          {/* App Downloads */}
          <div className="lg:col-span-2 flex flex-col md:items-end">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                darkMode ? 'bg-gradient-to-br from-[#00F2FE] to-blue-600 text-black' : 'bg-gradient-to-br from-[#4F46E5] to-indigo-400 text-white'
              }`}>
                 <span className="font-black text-2xl">D</span>
              </div>
              <div>
                <h4 className={`text-sm font-bold ${darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}`}>Happy Shopping</h4>
                <p className="text-sm">Download the Dexvee App</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Mock App Store Buttons */}
              <button className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                darkMode ? 'bg-black border-white/20 hover:border-[#00F2FE] text-white' : 'bg-slate-900 border-transparent hover:bg-black text-white'
              }`}>
                <div className="text-left">
                  <p className="text-[9px] uppercase tracking-wider">Download on the</p>
                  <p className="text-sm font-bold">App Store</p>
                </div>
              </button>
              <button className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                darkMode ? 'bg-black border-white/20 hover:border-[#00F2FE] text-white' : 'bg-slate-900 border-transparent hover:bg-black text-white'
              }`}>
                <div className="text-left">
                  <p className="text-[9px] uppercase tracking-wider">Get it on</p>
                  <p className="text-sm font-bold">Google Play</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Payment & Copyright */}
        <div className={`pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-6 ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
            <span className="text-xs font-black uppercase tracking-wider">Payment Methods</span>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Minimalist Payment Badges */}
              {['COD', 'VISA', 'MASTER', 'AMEX'].map((method) => (
                <div key={method} className={`px-3 py-1.5 rounded text-[10px] font-black tracking-wider border ${
                  darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                }`}>
                  {method}
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs font-medium text-center md:text-right">
            &copy; {new Date().getFullYear()} DEXVEE. All rights reserved.
          </div>
        </div>

      </div>
    </footer>
  );
}