import React, { useState } from 'react';

const AdminImporter = () => {
  const [cjProductId, setCjProductId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!cjProductId) return;
    
    setLoading(true);
    setMessage(null);

    try {
      // In a real app, this points to our Vercel API endpoint
      // Simply change the fetch URL to point to Netlify's functions endpoint
const res = await fetch('/.netlify/functions/import-product', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cjProductId, customCategory: 'Tech' }),
});
      
      const data = await res.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: `Successfully imported: ${data.product.name}` });
        setCjProductId(''); // Clear input
      } else {
        setMessage({ type: 'error', text: 'Failed to import. Check Product ID.' });
      }
    } catch (err) {
      // Temporary mock success for UI testing before backend is live
      setTimeout(() => {
        setMessage({ type: 'success', text: `Mock Import Success for ID: ${cjProductId}` });
        setLoading(false);
        setCjProductId('');
      }, 1500);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-8 bg-[#1A0B2E] rounded-2xl shadow-[0_0_20px_rgba(107,33,168,0.2)] border border-purple-900/50">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
        <span className="bg-purple-600 w-2 h-6 mr-3 rounded-sm"></span>
        Automated Product Importer
      </h2>
      <p className="text-gray-400 text-sm mb-6">
        Paste a CJ Dropshipping Product ID below to auto-fetch images, variants, and apply Dexvee's 40% markup rule.
      </p>

      <form onSubmit={handleImport} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-purple-300 tracking-wider mb-1 block">
            CJ PRODUCT ID OR URL
          </label>
          <input 
            type="text" 
            value={cjProductId}
            onChange={(e) => setCjProductId(e.target.value)}
            placeholder="e.g. 1234567890" 
            className="w-full bg-[#0D0518] text-white border border-purple-800/60 rounded-lg p-3 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all placeholder-gray-600"
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`mt-2 w-full font-bold py-3 px-4 rounded-lg transition-all duration-300 ${
            loading 
              ? 'bg-purple-800 text-purple-300 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600 to-[#00E5FF] text-white hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:scale-[1.02]'
          }`}
        >
          {loading ? 'SYNCING PRODUCT...' : 'IMPORT TO DEXVEE'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm text-center font-medium ${
          message.type === 'success' ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default AdminImporter;