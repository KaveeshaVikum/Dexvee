import React from 'react';
import { ShieldCheck, Eye, HeartHandshake, CheckCircle2 } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
      
      {/* Hero Section */}
      <div className="bg-[#2D1B4E] text-white rounded-3xl p-8 md:p-12 text-center shadow-xl space-y-4">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">About Dexvee</h1>
        <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-base font-medium leading-relaxed">
          Built on a foundation of absolute transparency, modern design, and customer-first values. We are redefining how you experience online shopping.
        </p>
      </div>

      {/* Core Values / Transparency Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-[#2D1B4E]/10 rounded-2xl flex items-center justify-center text-[#2D1B4E]">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-gray-800">Radical Transparency</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            No hidden fees or unexpected costs. From transparent shipping times to clear cost breakdowns at checkout, you always know what you're paying for.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-[#2D1B4E]/10 rounded-2xl flex items-center justify-center text-[#2D1B4E]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-gray-800">Verified Quality</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Every product listed goes through rigorous sourcing standards. We partner with reliable suppliers to ensure top-tier durability and performance.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-[#2D1B4E]/10 rounded-2xl flex items-center justify-center text-[#2D1B4E]">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-gray-800">Customer First</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your satisfaction is our benchmark. Our support systems and policies are designed to protect your interests and provide seamless assistance every step of the way.
          </p>
        </div>
      </div>

      {/* Mission Statement Section */}
      <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-4">
          <div className="text-xs font-bold text-[#2D1B4E] uppercase tracking-widest">Our Vision</div>
          <h2 className="text-2xl font-black text-gray-800">Creating a Trusted Digital Marketplace</h2>
          <p className="text-gray-500 text-sm md:text-base leading-relaxed">
            Dexvee was created to bridge the gap between quality electronics, lifestyle tech, and everyday convenience. By keeping our workflows open and our community close, we continue to build a trusted space for online shoppers.
          </p>
        </div>
        <div className="w-full md:w-80 bg-[#2D1B4E]/5 rounded-2xl p-6 border border-[#2D1B4E]/10 space-y-3">
          <div className="text-sm font-bold text-[#2D1B4E]">Commitment Highlights</div>
          <ul className="space-y-2.5 text-xs text-gray-600 font-medium">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D1B4E]" /> Real-time order tracking</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D1B4E]" /> Secure checkout protection</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D1B4E]" /> Open customer communication</li>
          </ul>
        </div>
      </div>

    </div>
  );
}