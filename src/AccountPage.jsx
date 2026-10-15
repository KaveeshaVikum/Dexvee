import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  User, Package, MapPin, Shield, LogOut, ChevronRight, ExternalLink,
  CheckCircle2, Clock, XCircle
} from 'lucide-react';
import {
  signOut, updateProfile, EmailAuthProvider,
  reauthenticateWithCredential, updatePassword
} from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { formatLKR } from './utils/currency';

const TABS = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'orders', label: 'Order History', icon: Package },
  { id: 'address', label: 'Last Address', icon: MapPin },
  { id: 'security', label: 'Security', icon: Shield },
];

// What the customer sees. Deliberately says nothing about suppliers.
function getOrderStatus(order) {
  if (order.paymentStatus === 'pending_verification') {
    return { label: 'Awaiting payment check', tone: 'amber', icon: Clock, note: 'We verify bank transfers within 3 business days.' };
  }
  if (order.paymentStatus === 'rejected') {
    return { label: 'Payment not verified', tone: 'red', icon: XCircle, note: 'We couldn\'t match your transfer. Please contact us so we can sort it out.' };
  }
  return { label: 'Payment confirmed', tone: 'emerald', icon: CheckCircle2, note: 'Your order is being prepared. International delivery can take a few weeks.' };
}

const TONES = {
  amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  red: 'bg-red-500/10 text-red-500 border-red-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

export default function AccountPage({ darkMode, user, authReady, lkrRate, onProfileUpdated }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    setDisplayName(user?.displayName || '');
  }, [user]);

  // Live-updates, so a status change (e.g. payment approved) shows up
  // without the customer refreshing. Firestore rules only let a signed-in
  // customer read orders where userId is their own uid.
  useEffect(() => {
    if (!user) return undefined;
    setOrdersLoading(true);
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setOrders(list);
        setOrdersError('');
        setOrdersLoading(false);
      },
      (err) => {
        console.error('Orders listener error:', err);
        setOrdersError('We couldn\'t load your orders right now. Please try again later.');
        setOrdersLoading(false);
      }
    );
    return unsubscribe;
  }, [user]);

  if (!authReady) {
    return <div className="min-h-[60vh] flex items-center justify-center text-sm font-bold text-gray-400">Loading your account…</div>;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isPasswordUser = user.providerData.some((p) => p.providerId === 'password');
  const signInMethods = user.providerData
    .map((p) => (p.providerId === 'google.com' ? 'Google' : p.providerId === 'facebook.com' ? 'Facebook' : p.providerId === 'password' ? 'Email & password' : p.providerId))
    .join(', ');
  const initial = (user.displayName || user.email || '?').charAt(0).toUpperCase();
  const lastOrder = orders[0];

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    if (!displayName.trim()) {
      setProfileMsg({ type: 'error', text: 'Please enter your name.' });
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      onProfileUpdated?.();
      setProfileMsg({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      console.error('Profile update error:', err);
      setProfileMsg({ type: 'error', text: 'Couldn\'t save your changes. Please try again.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    if (pw.next.length < 8) {
      setPwMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setSavingPw(true);
    try {
      // Firebase makes you prove it's really you before changing a password.
      const credential = EmailAuthProvider.credential(user.email, pw.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      setPwMsg({ type: 'success', text: 'Password updated.' });
    } catch (err) {
      console.error('Password change error:', err);
      const wrong = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password';
      setPwMsg({ type: 'error', text: wrong ? 'Your current password is incorrect.' : 'Couldn\'t update your password. Please try again.' });
    } finally {
      setSavingPw(false);
    }
  };

  const muted = darkMode ? 'text-gray-400' : 'text-slate-500';
  const card = darkMode ? 'bg-[#0B0F19] border-white/10 shadow-2xl' : 'bg-white border-slate-200 shadow-sm';
  const inputCls = darkMode
    ? 'bg-[#070A0F] border-white/10 focus:border-[#1A0F2E] text-white'
    : 'bg-slate-50 border-slate-300 focus:border-[#1A0F2E] focus:ring-4 focus:ring-[#1A0F2E]/10 text-slate-900';
  const labelCls = `text-[10px] font-black uppercase tracking-wider block mb-2 ${muted}`;
  const msgCls = (t) => (t === 'success' ? 'text-emerald-600' : 'text-red-500');

  return (
    <div className={`min-h-screen pt-8 pb-24 transition-colors duration-500 ${darkMode ? 'bg-[#070A0F] text-slate-100' : 'bg-[#F5F5F5] text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-black uppercase tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              My <span className="text-[#1A0F2E]">Account</span>
            </h1>
            <p className={`text-sm mt-1 font-medium ${muted}`}>Your orders, profile and security.</p>
          </div>
          <Link to="/" className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'}`}>
            Back to Store <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <aside className="lg:col-span-3">
            <div className={`rounded-3xl p-6 border lg:sticky lg:top-24 ${card}`}>
              <div className={`flex flex-col items-center mb-8 pb-8 border-b ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-24 h-24 rounded-full object-cover border-2 border-[#1A0F2E]/20 mb-4" />
                ) : (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black border-2 mb-4 bg-[#1A0F2E]/10 text-[#1A0F2E] border-[#1A0F2E]/20">
                    {initial}
                  </div>
                )}
                <h2 className="text-lg font-black text-center">{user.displayName || 'Dexvee Customer'}</h2>
                <p className={`text-xs font-bold text-center break-all ${muted}`}>{user.email}</p>
              </div>

              <nav className="space-y-2">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-[#1A0F2E]/10 text-[#1A0F2E] border-l-2 border-[#1A0F2E]'
                          : darkMode
                            ? 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-2 border-transparent'
                      }`}>
                      <div className="flex items-center gap-3"><Icon className="w-4 h-4" />{tab.label}</div>
                      <ChevronRight className={`w-4 h-4 opacity-50 ${isActive ? 'translate-x-1' : ''} transition-transform`} />
                    </button>
                  );
                })}
                <div className={`pt-4 mt-4 border-t ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                  <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          <main className="lg:col-span-9">
            <div className={`rounded-3xl p-6 sm:p-10 border min-h-[500px] ${card}`}>

              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-black uppercase mb-2">Personal Information</h2>
                  <p className={`text-sm mb-8 ${muted}`}>Your name appears on your account. Your email is set by how you signed in.</p>

                  <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <input type="text" value={displayName} onChange={(e) => { setDisplayName(e.target.value); setProfileMsg({ type: '', text: '' }); }}
                        className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${inputCls}`} />
                    </div>
                    <div>
                      <label className={labelCls}>Email Address</label>
                      <input type="email" value={user.email || ''} readOnly
                        className={`w-full px-4 py-3 rounded-xl border text-sm outline-none cursor-not-allowed ${darkMode ? 'bg-white/5 border-white/5 text-gray-500' : 'bg-slate-100 border-slate-200 text-slate-500'}`} />
                    </div>
                    <div>
                      <label className={labelCls}>Signed in with</label>
                      <p className="text-sm font-bold">{signInMethods || '—'}</p>
                    </div>
                    {profileMsg.text && <p className={`text-xs font-bold ${msgCls(profileMsg.type)}`}>{profileMsg.text}</p>}
                    <button type="submit" disabled={savingProfile}
                      className="px-8 py-3.5 bg-[#1A0F2E] hover:bg-[#0D0717] text-white rounded-full font-black text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-60">
                      {savingProfile ? 'Saving…' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-2xl font-black uppercase mb-2">Order History</h2>
                  <p className={`text-sm mb-8 ${muted}`}>Orders placed while you were signed in. Orders placed as a guest or before you signed up won't appear here.</p>

                  {ordersLoading ? (
                    <p className={`text-sm font-bold ${muted}`}>Loading your orders…</p>
                  ) : ordersError ? (
                    <p className="text-sm font-bold text-red-500">{ordersError}</p>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-16">
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-500 opacity-50" />
                      <p className={`font-bold mb-4 ${muted}`}>You haven't placed any orders yet.</p>
                      <Link to="/" className="inline-block px-6 py-3 bg-[#1A0F2E] text-white rounded-full text-xs font-black uppercase tracking-wider">Start Shopping</Link>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {orders.map((order) => {
                        const status = getOrderStatus(order);
                        const StatusIcon = status.icon;
                        const rate = order.lkrRate || lkrRate;
                        const placed = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
                        return (
                          <div key={order.id} className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`px-6 py-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${darkMode ? 'border-white/10' : 'bg-slate-100/50 border-slate-200'}`}>
                              <div className="flex flex-wrap items-center gap-6">
                                <div>
                                  <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${muted}`}>Order</p>
                                  <p className="font-mono font-bold text-xs">{order.id}</p>
                                </div>
                                <div>
                                  <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${muted}`}>Placed</p>
                                  <p className="font-bold text-sm">{placed}</p>
                                </div>
                                <div>
                                  <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${muted}`}>Total</p>
                                  <p className="font-black text-sm text-[#1A0F2E]">
                                    {order.grandTotalLkr
                                      ? `Rs. ${Number(order.grandTotalLkr).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      : formatLKR(order.grandTotal, rate)}
                                  </p>
                                </div>
                              </div>
                              <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 w-fit ${TONES[status.tone]}`}>
                                <StatusIcon className="w-3.5 h-3.5" /> {status.label}
                              </div>
                            </div>

                            <div className="px-6 py-4 space-y-4">
                              {(order.items || []).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                  {item.image && <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover bg-slate-200" />}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm line-clamp-2">{item.name}</h4>
                                    <p className={`text-xs mt-1 ${muted}`}>Qty: {item.quantity}</p>
                                  </div>
                                  <div className="font-black text-sm text-right whitespace-nowrap">{formatLKR(item.price * item.quantity, rate)}</div>
                                </div>
                              ))}
                            </div>

                            <div className={`px-6 py-3 border-t text-xs font-medium ${muted} ${darkMode ? 'border-white/10' : 'border-slate-200 bg-white'}`}>{status.note}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'address' && (
                <div>
                  <h2 className="text-2xl font-black uppercase mb-2">Last Shipping Address</h2>
                  <p className={`text-sm mb-8 ${muted}`}>The address from your most recent order. You can change it at checkout.</p>
                  {lastOrder?.shippingDetails ? (
                    <div className={`p-6 rounded-2xl border max-w-md ${darkMode ? 'bg-[#070A0F] border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <h3 className="font-black text-lg mb-2">{lastOrder.shippingDetails.name}</h3>
                      <div className={`space-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                        <p>{lastOrder.shippingDetails.address}</p>
                        <p>{[lastOrder.shippingDetails.city, lastOrder.shippingDetails.district].filter(Boolean).join(', ')}{lastOrder.shippingDetails.postalCode ? `, ${lastOrder.shippingDetails.postalCode}` : ''}</p>
                        <p>Sri Lanka</p>
                        <p className="pt-2 font-mono text-xs">{lastOrder.shippingDetails.phone}</p>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-sm font-bold ${muted}`}>No address saved yet — it appears here after your first order.</p>
                  )}
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl font-black uppercase mb-2">Security</h2>
                  {isPasswordUser ? (
                    <>
                      <p className={`text-sm mb-8 ${muted}`}>Change the password you use to sign in with your email.</p>
                      <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                        <div>
                          <label className={labelCls}>Current Password</label>
                          <input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required
                            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${inputCls}`} />
                        </div>
                        <div>
                          <label className={labelCls}>New Password</label>
                          <input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required
                            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${inputCls}`} />
                        </div>
                        <div>
                          <label className={labelCls}>Confirm New Password</label>
                          <input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required
                            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${inputCls}`} />
                        </div>
                        {pwMsg.text && <p className={`text-xs font-bold ${msgCls(pwMsg.type)}`}>{pwMsg.text}</p>}
                        <button type="submit" disabled={savingPw}
                          className="px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider border border-[#1A0F2E] text-[#1A0F2E] hover:bg-[#1A0F2E] hover:text-white transition-all disabled:opacity-60">
                          {savingPw ? 'Updating…' : 'Update Password'}
                        </button>
                      </form>
                    </>
                  ) : (
                    <p className={`text-sm ${muted}`}>You sign in with {signInMethods}, so your password is managed there, not on Dexvee.</p>
                  )}
                </div>
              )}

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}