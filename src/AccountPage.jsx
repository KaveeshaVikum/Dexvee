import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, Package, MapPin, Shield, LogOut, ChevronRight, ExternalLink,
  CreditCard, PackageCheck, Truck, Star, RotateCcw
} from 'lucide-react';
import {
  signOut, updateProfile, EmailAuthProvider,
  reauthenticateWithCredential, updatePassword
} from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { formatLKR } from './utils/currency';
import OrderProgressMap from './components/OrderProgressMap';
import { getOrderProgressState } from './utils/orderProgress';

const TABS = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'address', label: 'Last Address', icon: MapPin },
  { id: 'security', label: 'Security', icon: Shield },
];

const ORDER_FILTERS = [
  { id: 'all', label: 'All orders', icon: Package },
  { id: 'toPay', label: 'To Pay', icon: CreditCard },
  { id: 'toShip', label: 'To Ship', icon: PackageCheck },
  { id: 'toReceive', label: 'To Receive', icon: Truck },
  { id: 'toReview', label: 'To Review', icon: Star },
  { id: 'returns', label: 'Returns & Cancellations', icon: RotateCcw },
];

export default function AccountPage({ darkMode, user, authReady, lkrRate, onProfileUpdated }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(requestedTab || 'profile');
  const [orderFilter, setOrderFilter] = useState('all');

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [orderActionMessages, setOrderActionMessages] = useState({});

  const [displayName, setDisplayName] = useState('');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    setDisplayName(user?.displayName || '');
  }, [user]);

  useEffect(() => {
    if (TABS.some((tab) => tab.id === requestedTab)) setActiveTab(requestedTab);
  }, [requestedTab]);

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
  const orderCounts = orders.reduce((counts, order) => {
    const { bucket } = getOrderProgressState(order);
    counts.all += 1;
    if (bucket !== 'all') counts[bucket] = (counts[bucket] || 0) + 1;
    return counts;
  }, { all: 0, toPay: 0, toShip: 0, toReceive: 0, toReview: 0, returns: 0 });
  const visibleOrders = orderFilter === 'all'
    ? orders
    : orders.filter((order) => getOrderProgressState(order).bucket === orderFilter);

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

  const submitOrderAction = async (order, action) => {
    const prompt = action === 'cancel'
      ? 'Tell us why you want to cancel this order request:'
      : 'Tell us why you want to request a return:';
    const reason = window.prompt(prompt);
    if (!reason?.trim()) return;

    setOrderActionMessages((current) => ({ ...current, [order.id]: '' }));
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/.netlify/functions/request-order-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderId: order.id, action, reason: reason.trim() })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'The request could not be submitted.');
      setOrderActionMessages((current) => ({ ...current, [order.id]: 'Your request was sent for review. The order status will update here.' }));
    } catch (err) {
      setOrderActionMessages((current) => ({ ...current, [order.id]: err.message || 'Could not submit your request. Please try again.' }));
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
                  <div className="mb-7">
                    <h2 className="text-2xl font-black uppercase mb-2">My Orders</h2>
                    <p className={`text-sm ${muted}`}>Follow every order from payment check to delivery, with live updates from your account.</p>
                  </div>

                  <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A0F2E] via-[#281746] to-[#402669] px-6 py-7 text-white shadow-lg sm:px-8">
                    <div className="pointer-events-none absolute -right-8 -top-20 h-64 w-64 rounded-full border border-white/10" />
                    <div className="pointer-events-none absolute -right-1 -top-12 h-48 w-48 rounded-full border border-white/10" />
                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                      <div className="max-w-lg">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">Your order board</p>
                        <h3 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Every order. <span className="text-violet-200">One clear journey.</span></h3>
                        <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">See what needs attention and where each parcel is in its journey.</p>
                      </div>
                      <div className="flex shrink-0 gap-3">
                        <div className="min-w-[106px] rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">All orders</p>
                          <p className="mt-1 text-2xl font-black">{ordersLoading ? '—' : orderCounts.all}</p>
                        </div>
                        <div className="min-w-[106px] rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">In progress</p>
                          <p className="mt-1 text-2xl font-black">{ordersLoading ? '—' : orderCounts.toPay + orderCounts.toShip + orderCounts.toReceive}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <nav className="mb-7 -mx-2 flex gap-2 overflow-x-auto px-2 pb-2 [scrollbar-width:thin]" aria-label="Filter orders" role="group">
                    {ORDER_FILTERS.map((filter) => {
                      const Icon = filter.icon;
                      const selected = orderFilter === filter.id;
                      return (
                        <button
                          key={filter.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setOrderFilter(filter.id)}
                          className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-black transition-all ${selected
                            ? 'border-[#1A0F2E] bg-[#1A0F2E] text-white shadow-md'
                            : darkMode
                              ? 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.07]'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                          <Icon className="h-4 w-4" />
                          <span>{filter.label}</span>
                          <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-[10px] ${selected ? 'bg-white/15 text-white' : darkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                            {ordersLoading ? '—' : orderCounts[filter.id]}
                          </span>
                        </button>
                      );
                    })}
                  </nav>

                  {ordersLoading ? (
                    <div className={`rounded-2xl border p-8 text-center text-sm font-bold ${darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'} ${muted}`}>Loading your orders…</div>
                  ) : ordersError ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm font-bold text-red-500">{ordersError}</div>
                  ) : orders.length === 0 ? (
                    <div className={`rounded-3xl border px-6 py-14 text-center ${darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
                      <span className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${darkMode ? 'bg-white/5 text-violet-200' : 'bg-[#1A0F2E]/5 text-[#1A0F2E]'}`}><Package className="h-7 w-7" /></span>
                      <h3 className="font-black">Your next favorite find starts here.</h3>
                      <p className={`mt-2 mb-5 text-sm ${muted}`}>Orders placed while signed in will appear here with their progress.</p>
                      <Link to="/" className="inline-flex items-center rounded-full bg-[#1A0F2E] px-6 py-3 text-xs font-black uppercase tracking-wider text-white">Start Shopping</Link>
                    </div>
                  ) : visibleOrders.length === 0 ? (
                    <div className={`rounded-3xl border px-6 py-14 text-center ${darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
                      <span className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${darkMode ? 'bg-white/5 text-violet-200' : 'bg-[#1A0F2E]/5 text-[#1A0F2E]'}`}>
                        {(() => { const EmptyIcon = ORDER_FILTERS.find((item) => item.id === orderFilter)?.icon || Package; return <EmptyIcon className="h-7 w-7" />; })()}
                      </span>
                      <h3 className="font-black">Nothing in {ORDER_FILTERS.find((item) => item.id === orderFilter)?.label || 'this section'} right now.</h3>
                      <p className={`mt-2 text-sm ${muted}`}>When an order reaches this stage, it will appear here automatically.</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {visibleOrders.map((order) => {
                        const progress = getOrderProgressState(order);
                        const orderStatus = String(order.status || '').toLowerCase();
                        const hasCustomerRequest = Boolean(order.customerRequestStatus);
                        const isDelivered = ['delivered', 'complete', 'completed'].includes(orderStatus);
                        const canRequestCancel = ['placed', 'processing', 'ready_to_ship'].includes(orderStatus) && !hasCustomerRequest;
                        const canRequestReturn = isDelivered && !hasCustomerRequest;
                        const reviewedProductIds = new Set(Array.isArray(order.reviewedProductIds) ? order.reviewedProductIds : []);
                        const reviewableItems = (order.items || []).filter((item) => item.id && !reviewedProductIds.has(item.id));
                        const rate = order.lkrRate || lkrRate;
                        const placed = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
                        return (
                          <article key={order.id} className={`overflow-hidden rounded-3xl border ${darkMode ? 'border-white/10 bg-white/[0.025]' : 'border-slate-200 bg-slate-50'}`}>
                            <header className={`flex flex-col gap-4 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-white/70'}`}>
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                                <div>
                                  <p className={`mb-1 text-[10px] font-black uppercase tracking-wider ${muted}`}>Order number</p>
                                  <p className="font-mono text-xs font-bold">{order.orderNumber || order.id}</p>
                                </div>
                                <div>
                                  <p className={`mb-1 text-[10px] font-black uppercase tracking-wider ${muted}`}>Placed</p>
                                  <p className="text-sm font-bold">{placed}</p>
                                </div>
                                <div>
                                  <p className={`mb-1 text-[10px] font-black uppercase tracking-wider ${muted}`}>Total</p>
                                  <p className="text-sm font-black text-[#8B6BB3]">
                                    {order.grandTotalLkr
                                      ? `Rs. ${Number(order.grandTotalLkr).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      : formatLKR(order.grandTotal, rate)}
                                  </p>
                                </div>
                              </div>
                              <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${progress.terminal
                                ? (darkMode ? 'border-amber-300/20 bg-amber-300/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800')
                                : (darkMode ? 'border-violet-300/20 bg-violet-300/10 text-violet-200' : 'border-violet-200 bg-violet-50 text-[#1A0F2E]')}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${progress.terminal ? 'bg-current' : 'bg-violet-500'}`} />{progress.status}
                              </span>
                            </header>

                            <div className="space-y-5 p-4 sm:p-6">
                              {(order.items || []).map((item, idx) => (
                                <div key={`${item.id || item.name || 'item'}-${idx}`} className="flex items-center gap-4">
                                  {item.image ? <img src={item.image} alt={item.name || 'Order item'} className="h-14 w-14 rounded-xl bg-slate-200 object-cover sm:h-16 sm:w-16" /> : <span className={`flex h-14 w-14 items-center justify-center rounded-xl ${darkMode ? 'bg-white/5 text-slate-500' : 'bg-slate-200 text-slate-500'}`}><Package className="h-6 w-6" /></span>}
                                  <div className="min-w-0 flex-1">
                                    <h4 className="line-clamp-2 text-sm font-bold">{item.name || 'Dexvee item'}</h4>
                                    <p className={`mt-1 text-xs ${muted}`}>Quantity: {item.quantity || 1}</p>
                                  </div>
                                  <div className="whitespace-nowrap text-right text-sm font-black">{formatLKR((Number(item.price) || 0) * (Number(item.quantity) || 1), rate)}</div>
                                </div>
                              ))}
                              <OrderProgressMap order={order} darkMode={darkMode} progress={progress} />
                              {order.adminNote && (
                                <p className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${darkMode ? 'border-violet-300/15 bg-violet-300/5 text-violet-100' : 'border-violet-200 bg-violet-50 text-violet-900'}`}>
                                  <span className="font-black">Update from Dexvee: </span>{order.adminNote}
                                </p>
                              )}
                              {orderActionMessages[order.id] && (
                                <p role="status" className={`rounded-xl border px-4 py-3 text-xs font-bold ${orderActionMessages[order.id].startsWith('Your request') ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
                                  {orderActionMessages[order.id]}
                                </p>
                              )}
                              {(canRequestCancel || canRequestReturn || (isDelivered && reviewableItems.length > 0)) && (
                                <div className="flex flex-wrap gap-2">
                                  {canRequestCancel && (
                                    <button type="button" onClick={() => submitOrderAction(order, 'cancel')} className={`rounded-full border px-4 py-2 text-xs font-black transition-colors ${darkMode ? 'border-white/15 text-slate-200 hover:bg-white/5' : 'border-slate-300 text-slate-700 hover:bg-white'}`}>
                                      Request cancellation
                                    </button>
                                  )}
                                  {canRequestReturn && (
                                    <button type="button" onClick={() => submitOrderAction(order, 'return')} className={`rounded-full border px-4 py-2 text-xs font-black transition-colors ${darkMode ? 'border-white/15 text-slate-200 hover:bg-white/5' : 'border-slate-300 text-slate-700 hover:bg-white'}`}>
                                      Request a return
                                    </button>
                                  )}
                                  {isDelivered && reviewableItems.map((item) => (
                                    <Link key={item.id} to={`/product/${item.id}?reviewOrder=${encodeURIComponent(order.id)}`} className="rounded-full bg-[#1A0F2E] px-4 py-2 text-xs font-black text-white hover:bg-fuchsia-600">
                                      Review {item.name || 'item'}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          </article>
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
