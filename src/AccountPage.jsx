import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, Package, MapPin, Heart, Settings, LogOut, 
  Camera, CheckCircle2, Truck, CreditCard, Bell, Shield,
  ChevronRight, Edit3, Trash2, ExternalLink
} from 'lucide-react';

export default function AccountPage({ darkMode, setDarkMode }) {
  const [activeTab, setActiveTab] = useState('profile');

  // Personal Mock Data
  const [profileData, setProfileData] = useState({
    firstName: "Kaveesha",
    lastName: "",
    email: "vikumkaveesha8@gmail.com",
    phone: "+94 77 123 4567",
    bio: "Frontend Developer & UI/UX Designer"
  });

  const MOCK_ORDERS = [
    {
      id: "DXV-98231",
      date: "Aug 02, 2026",
      status: "In Transit",
      total: 99.49,
      trackingNumber: "CJ883920114SL",
      items: [
        { name: "Minimalist Smart Watch V2 AMOLED", qty: 1, price: 64.50, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80" },
        { name: "AeroPulse Wireless Earbuds ANC Pro", qty: 1, price: 34.99, image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&q=80" }
      ]
    },
    {
      id: "DXV-77120",
      date: "Jul 15, 2026",
      status: "Delivered",
      total: 89.90,
      trackingNumber: "CJ883910002SL",
      items: [
        { name: "Cyberpunk RGB Mechanical Keyboard", qty: 1, price: 89.90, image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&q=80" }
      ]
    }
  ];

  const MOCK_WISHLIST = [
    { id: 1, name: "Precision Ergonomic Wireless Mouse", price: 24.99, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&q=80", inStock: true },
    { id: 2, name: "Ultra-Fast 65W GaN Wall Charger", price: 18.50, image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=200&q=80", inStock: true }
  ];

  const TABS = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'orders', label: 'Order History', icon: Package },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'settings', label: 'Account Settings', icon: Settings },
  ];

  return (
    <div className={`min-h-screen pt-8 pb-24 transition-colors duration-500 ${
      darkMode ? 'bg-[#070A0F] text-slate-100' : 'bg-[#F1F5F9] text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-black uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Account <span className={darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}>Dashboard</span>
            </h1>
            <p className={`text-sm mt-1 font-medium ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              Manage your orders, profile details, and security.
            </p>
          </div>
          <Link to="/" className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
            darkMode 
              ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
          }`}>
            Back to Store <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3">
            <div className={`rounded-3xl p-6 border sticky top-24 ${
              darkMode ? 'bg-[#0B0F19] border-white/10 shadow-[0_0_40px_rgba(0,242,254,0.03)]' : 'bg-white border-slate-200 shadow-xl'
            }`}>
              
              {/* User Mini Profile */}
              <div className="flex flex-col items-center mb-8 pb-8 border-b border-white/10">
                <div className="relative mb-4 group cursor-pointer">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black border-2 overflow-hidden transition-all ${
                    darkMode 
                      ? 'bg-gradient-to-br from-[#111827] to-[#070A0F] text-[#00F2FE] border-[#00F2FE]/30 shadow-[0_0_20px_rgba(0,242,254,0.15)]' 
                      : 'bg-indigo-50 text-[#4F46E5] border-[#4F46E5]/20 shadow-lg'
                  }`}>
                    {profileData.firstName.charAt(0)}
                  </div>
                  <div className={`absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm ${
                    darkMode ? 'bg-black/60' : 'bg-white/60'
                  }`}>
                    <Camera className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-slate-900'}`} />
                  </div>
                </div>
                <h2 className="text-lg font-black">{profileData.firstName} {profileData.lastName}</h2>
                <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{profileData.email}</p>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-2">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        isActive 
                          ? darkMode 
                            ? 'bg-gradient-to-r from-[#00F2FE]/10 to-transparent text-[#00F2FE] border-l-2 border-[#00F2FE]' 
                            : 'bg-indigo-50 text-[#4F46E5] border-l-2 border-[#4F46E5]'
                          : darkMode
                            ? 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? (darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]') : 'text-current'}`} />
                        {tab.label}
                      </div>
                      <ChevronRight className={`w-4 h-4 opacity-50 ${isActive ? 'translate-x-1' : ''} transition-transform`} />
                    </button>
                  );
                })}

                <div className={`pt-4 mt-4 border-t ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-9">
            <div className={`rounded-3xl p-6 sm:p-10 border min-h-[600px] ${
              darkMode ? 'bg-[#0B0F19] border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'
            }`}>
              
              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-8">
                    <h2 className="text-2xl font-black uppercase mb-2">Personal Information</h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Update your personal details and public profile.</p>
                  </div>

                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>First Name</label>
                        <input 
                          type="text" 
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                          className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                            darkMode 
                              ? 'bg-[#070A0F] border-white/10 focus:border-[#00F2FE] focus:shadow-[0_0_15px_rgba(0,242,254,0.2)] text-white' 
                              : 'bg-slate-50 border-slate-300 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 text-slate-900'
                          }`} 
                        />
                      </div>
                      <div>
                        <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Last Name</label>
                        <input 
                          type="text" 
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                          placeholder="Optional"
                          className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                            darkMode 
                              ? 'bg-[#070A0F] border-white/10 focus:border-[#00F2FE] focus:shadow-[0_0_15px_rgba(0,242,254,0.2)] text-white' 
                              : 'bg-slate-50 border-slate-300 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 text-slate-900'
                          }`} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Email Address</label>
                        <input 
                          type="email" 
                          value={profileData.email}
                          readOnly
                          className={`w-full px-4 py-3 rounded-xl border text-sm outline-none cursor-not-allowed ${
                            darkMode ? 'bg-white/5 border-white/5 text-gray-500' : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`} 
                        />
                      </div>
                      <div>
                        <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Phone Number</label>
                        <input 
                          type="tel" 
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                          className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                            darkMode 
                              ? 'bg-[#070A0F] border-white/10 focus:border-[#00F2FE] focus:shadow-[0_0_15px_rgba(0,242,254,0.2)] text-white' 
                              : 'bg-slate-50 border-slate-300 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 text-slate-900'
                          }`} 
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Bio</label>
                      <textarea 
                        rows="4"
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all resize-none ${
                          darkMode 
                            ? 'bg-[#070A0F] border-white/10 focus:border-[#00F2FE] focus:shadow-[0_0_15px_rgba(0,242,254,0.2)] text-white' 
                            : 'bg-slate-50 border-slate-300 focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 text-slate-900'
                        }`} 
                      />
                    </div>

                    <div className="pt-6">
                      <button type="button" className={`px-8 py-3.5 rounded-full font-black text-xs uppercase tracking-wider transition-all shadow-lg ${
                        darkMode 
                          ? 'bg-[#00F2FE] text-black hover:bg-cyan-300 shadow-[#00F2FE]/20' 
                          : 'bg-[#4F46E5] text-white hover:bg-indigo-700'
                      }`}>
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-8">
                    <h2 className="text-2xl font-black uppercase mb-2">Order History</h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Track and manage your recent purchases.</p>
                  </div>

                  <div className="space-y-6">
                    {MOCK_ORDERS.map((order) => (
                      <div key={order.id} className={`rounded-2xl border overflow-hidden transition-colors ${
                        darkMode ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'
                      }`}>
                        {/* Order Header */}
                        <div className={`px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          darkMode ? 'bg-white/[0.02] border-white/10' : 'bg-slate-100/50 border-slate-200'
                        }`}>
                          <div className="flex flex-wrap items-center gap-6">
                            <div>
                              <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>Order Number</p>
                              <p className="font-bold text-sm">{order.id}</p>
                            </div>
                            <div>
                              <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>Date Placed</p>
                              <p className="font-bold text-sm">{order.date}</p>
                            </div>
                            <div>
                              <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>Total Amount</p>
                              <p className={`font-black text-sm ${darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}`}>${order.total.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 w-fit ${
                            order.status === 'Delivered' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {order.status === 'Delivered' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                            {order.status}
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="px-6 py-4 space-y-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-slate-900" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm truncate">{item.name}</h4>
                                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Qty: {item.qty}</p>
                              </div>
                              <div className="font-black text-sm text-right whitespace-nowrap">
                                ${(item.price * item.qty).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer - Tracking Info Only, No Returns */}
                        <div className={`px-6 py-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          darkMode ? 'bg-white/[0.01] border-white/10' : 'bg-white border-slate-200'
                        }`}>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Tracking ID:</span>
                            <span className={`font-mono font-bold px-2 py-1 rounded ${darkMode ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}>
                              {order.trackingNumber}
                            </span>
                          </div>
                          
                          <button className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                            darkMode 
                              ? 'bg-transparent border-white/20 hover:bg-white/10 text-white' 
                              : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-800'
                          }`}>
                            Track Package
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADDRESSES TAB */}
              {activeTab === 'addresses' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                      <h2 className="text-2xl font-black uppercase mb-2">Saved Addresses</h2>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Manage your shipping and billing locations.</p>
                    </div>
                    <button className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-lg ${
                      darkMode ? 'bg-[#00F2FE] text-black hover:bg-cyan-300' : 'bg-[#4F46E5] text-white hover:bg-indigo-700'
                    }`}>
                      + Add New Address
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Default Address Card */}
                    <div className={`relative p-6 rounded-2xl border ${
                      darkMode ? 'bg-[#070A0F] border-[#00F2FE]/50 shadow-[0_0_15px_rgba(0,242,254,0.1)]' : 'bg-white border-[#4F46E5] shadow-md'
                    }`}>
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}><Edit3 className="w-4 h-4" /></button>
                        <button className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      
                      <div className={`inline-block px-2.5 py-1 mb-4 rounded text-[10px] font-black uppercase tracking-wider ${
                        darkMode ? 'bg-[#00F2FE]/20 text-[#00F2FE]' : 'bg-indigo-100 text-[#4F46E5]'
                      }`}>
                        Default Shipping
                      </div>
                      
                      <h3 className="font-black text-lg mb-2">Kaveesha</h3>
                      <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                        <p>123 Main Street</p>
                        <p>Ipalogama</p>
                        <p>Anuradhapura, 00100</p>
                        <p>Sri Lanka</p>
                        <p className="pt-2 font-mono text-xs">+94 77 123 4567</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* WISHLIST TAB */}
              {activeTab === 'wishlist' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-8">
                    <h2 className="text-2xl font-black uppercase mb-2">My Wishlist</h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Items you've saved for later.</p>
                  </div>

                  {MOCK_WISHLIST.length === 0 ? (
                    <div className="text-center py-20">
                      <Heart className="w-12 h-12 mx-auto mb-4 text-gray-500 opacity-50" />
                      <p className={`font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Your wishlist is currently empty.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {MOCK_WISHLIST.map((item) => (
                        <div key={item.id} className={`group rounded-2xl border p-4 flex flex-col transition-all ${
                          darkMode ? 'bg-white/[0.02] border-white/10 hover:border-[#00F2FE]/30' : 'bg-white border-slate-200 hover:shadow-lg'
                        }`}>
                          <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4 bg-slate-900">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <button className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500/80 backdrop-blur-md text-white rounded-full transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-sm mb-2 line-clamp-2">{item.name}</h4>
                            <div className={`text-lg font-black ${darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}`}>
                              ${item.price.toFixed(2)}
                            </div>
                          </div>
                          <button className={`w-full mt-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                            darkMode 
                              ? 'bg-transparent border-[#00F2FE]/50 text-[#00F2FE] hover:bg-[#00F2FE] hover:text-black' 
                              : 'bg-transparent border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white'
                          }`}>
                            Move to Cart
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-8">
                    <h2 className="text-2xl font-black uppercase mb-2">Account Settings</h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Manage preferences and security parameters.</p>
                  </div>

                  <div className="space-y-8 max-w-2xl">
                    
                    {/* Notifications Section */}
                    <section>
                      <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Bell className={`w-4 h-4 ${darkMode ? 'text-[#00F2FE]' : 'text-[#4F46E5]'}`} /> Notifications
                      </h3>
                      <div className={`rounded-2xl border p-2 ${darkMode ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        
                        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                          <div>
                            <p className="font-bold text-sm">Order Updates</p>
                            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Receive SMS and email tracking updates.</p>
                          </div>
                          {/* Custom Toggle */}
                          <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${darkMode ? 'bg-[#00F2FE]' : 'bg-[#4F46E5]'}`}>
                            <div className="absolute right-1 top-1 bottom-1 w-4 rounded-full bg-white shadow-sm" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="font-bold text-sm">Promotional Offers</p>
                            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Flash deals and exclusive discounts.</p>
                          </div>
                          <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${darkMode ? 'bg-white/10' : 'bg-slate-300'}`}>
                            <div className="absolute left-1 top-1 bottom-1 w-4 rounded-full bg-white shadow-sm" />
                          </div>
                        </div>

                      </div>
                    </section>

                    {/* Security Section */}
                    <section>
                      <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Shield className={`w-4 h-4 ${darkMode ? 'text-[#635BFF]' : 'text-[#4F46E5]'}`} /> Security
                      </h3>
                      <div className={`rounded-2xl border p-6 space-y-4 ${darkMode ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        
                        <div>
                          <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Current Password</label>
                          <input type="password" placeholder="••••••••" className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                            darkMode ? 'bg-[#070A0F] border-white/10 focus:border-[#635BFF] text-white' : 'bg-white border-slate-300 focus:border-[#4F46E5] text-slate-900'
                          }`} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>New Password</label>
                            <input type="password" placeholder="Enter new password" className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                              darkMode ? 'bg-[#070A0F] border-white/10 focus:border-[#635BFF] text-white' : 'bg-white border-slate-300 focus:border-[#4F46E5] text-slate-900'
                            }`} />
                          </div>
                          <div>
                            <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Confirm Password</label>
                            <input type="password" placeholder="Confirm new password" className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                              darkMode ? 'bg-[#070A0F] border-white/10 focus:border-[#635BFF] text-white' : 'bg-white border-slate-300 focus:border-[#4F46E5] text-slate-900'
                            }`} />
                          </div>
                        </div>

                        <div className="pt-2">
                          <button className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border ${
                            darkMode 
                              ? 'bg-transparent border-[#635BFF] text-[#635BFF] hover:bg-[#635BFF] hover:text-white' 
                              : 'bg-transparent border-[#4F46E5] text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white'
                          }`}>
                            Update Password
                          </button>
                        </div>
                      </div>
                    </section>

                    {/* Danger Zone */}
                    <section className="pt-4">
                      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-red-500">Delete Account</h4>
                          <p className={`text-xs mt-1 max-w-sm ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                            Permanently delete your account and all associated data. This action cannot be undone.
                          </p>
                        </div>
                        <button className="px-5 py-2.5 rounded-full bg-red-500 text-white text-xs font-black uppercase tracking-wider hover:bg-red-600 transition-colors whitespace-nowrap">
                          Delete Account
                        </button>
                      </div>
                    </section>

                  </div>
                </div>
              )}

            </div>
          </main>

        </div>
      </div>
    </div>
  );
}