import React, { useState } from 'react';
import { Mail, Gift, ArrowRight, Check } from 'lucide-react';

export default function NewsletterVoucher() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden bg-gradient-to-r from-[#0B0F19] via-[#111827] to-[#0B0F19] border border-[#00F2FE]/30 text-white">
      {/* Background Accent glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#00F2FE]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#00F2FE]/10 border border-[#00F2FE]/30 text-[#00F2FE] flex items-center justify-center mx-auto mb-4">
          <Gift className="w-6 h-6" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">
          Claim <span className="text-[#00F2FE]">$10 OFF</span> Your First Order
        </h2>

        <p className="text-xs text-gray-300 font-medium mb-6">
          Subscribe to Dexvee Express updates to receive exclusive flash deal vouchers, tech drop alerts, and promo codes.
        </p>

        {submitted ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase flex items-center justify-center gap-2 max-w-md mx-auto">
            <Check className="w-4 h-4" /> Coupon Code DEXVEE10 Sent to your email!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2 max-w-md mx-auto">
            <div className="relative w-full flex-1">
              <Mail className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="email" 
                required
                placeholder="Enter your email address..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/15 focus:border-[#00F2FE] rounded-full pl-11 pr-4 py-3 text-xs outline-none text-white placeholder:text-gray-500 font-medium transition-all"
              />
            </div>
            <button 
              type="submit" 
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#00F2FE] text-black font-black text-xs uppercase tracking-wider hover:bg-cyan-300 transition-all flex items-center justify-center gap-2 shrink-0 shadow-md shadow-[#00F2FE]/20"
            >
              Get Voucher <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <p className="text-[10px] text-gray-500 font-bold mt-4">
          No spam. Unsubscribe anytime with 1-click.
        </p>
      </div>
    </div>
  );
}