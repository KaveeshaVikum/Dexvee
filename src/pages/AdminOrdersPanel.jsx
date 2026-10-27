import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Save, Truck } from 'lucide-react';
import { auth } from '../firebase';
import { formatLKR } from '../utils/currency';

const ORDER_STATUSES = [
  'placed',
  'processing',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'cancelled'
];

const REQUEST_STATUSES = [
  '',
  'cancel_approved',
  'cancel_rejected',
  'return_approved',
  'return_rejected'
];

function displayMoney(order) {
  if (order.grandTotalLkr != null && Number.isFinite(Number(order.grandTotalLkr))) {
    return `Rs. ${Number(order.grandTotalLkr).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return formatLKR(order.grandTotal, order.lkrRate);
}

function orderDate(order) {
  const date = order.createdAt?.toDate?.()
    || (typeof order.createdAt === 'string' ? new Date(order.createdAt) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : 'Date unavailable';
}

export default function AdminOrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const request = useCallback(async (path, payload = {}) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Your admin session has expired. Sign in again.');
    const token = await user.getIdToken();
    const response = await fetch(`/.netlify/functions/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'The request could not be completed.');
    return data;
  }, []);

  const loadOrders = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await request('admin-orders');
      setError('');
      setOrders(data.orders || []);
      setDrafts(Object.fromEntries((data.orders || []).map((order) => [order.id, {
        status: order.status || 'placed',
        trackingNumber: order.trackingNumber || '',
        trackingUrl: order.trackingUrl || '',
        estimatedDelivery: order.estimatedDelivery || '',
        requestStatus: '',
        adminNote: ''
      }])));
    } catch (err) {
      setError(err.message || 'Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateDraft = (orderId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [orderId]: { ...current[orderId], [field]: value }
    }));
  };

  const saveOrder = async (orderId) => {
    setSavingId(orderId);
    setError('');
    setNotice('');
    try {
      const draft = drafts[orderId] || {};
      await request('update-order-status', { orderId, ...draft });
      setNotice(`Order ${orderId} updated.`);
      await loadOrders();
    } catch (err) {
      setError(err.message || 'Could not update the order.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black uppercase flex items-center gap-2"><Truck className="w-5 h-5 text-[#00F2FE]" /> Order Management</h2>
          <p className="text-xs text-gray-400 mt-1">Update fulfillment progress and review customer requests. Status changes appear in customer accounts.</p>
        </div>
        <button type="button" onClick={() => loadOrders(true)} disabled={loading} className="text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-red-300"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
      {notice && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">{notice}</p>}

      {loading ? (
        <p className="py-8 text-center text-xs text-gray-500">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="py-8 text-center text-xs text-gray-500">No orders have been placed yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const draft = drafts[order.id] || {};
            const shipping = order.shippingDetails || {};
            return (
              <article key={order.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <p className="text-sm font-black text-white">{shipping.name || 'Customer'} <span className="text-xs font-normal text-gray-400">· {shipping.phone || 'No phone'}</span></p>
                    <p className="mt-1 text-xs text-gray-400">{[shipping.address, shipping.city, shipping.district, shipping.postalCode].filter(Boolean).join(', ')}</p>
                    <p className="mt-1 text-[10px] text-gray-600 font-mono">Order {order.id} · {orderDate(order)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#00F2FE]">{displayMoney(order)}</p>
                    <p className="mt-1 text-[10px] uppercase font-bold text-gray-400">{order.paymentMethod || 'Payment'} · {order.paymentStatus || 'unknown'}</p>
                    {order.customerRequestStatus && <p className="mt-1 text-[10px] font-black uppercase text-amber-300">{order.customerRequestStatus.replaceAll('_', ' ')}</p>}
                  </div>
                </div>

                <p className="py-3 text-xs text-gray-300">{(order.items || []).map((item) => `${item.name || 'Item'} ×${item.quantity || 1}`).join(', ') || 'No item details'}</p>
                {order.customerRequest?.reason && <p className="mb-3 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-100">Customer request: {order.customerRequest.reason}</p>}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Order status
                    <select value={draft.status || 'placed'} onChange={(e) => updateDraft(order.id, 'status', e.target.value)} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#070A0F] px-3 py-2 text-xs text-white">
                      {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
                    </select>
                  </label>
                  <label className="text-[10px] font-bold uppercase text-gray-500">Tracking number
                    <input value={draft.trackingNumber || ''} onChange={(e) => updateDraft(order.id, 'trackingNumber', e.target.value)} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#070A0F] px-3 py-2 text-xs text-white" placeholder="Optional" />
                  </label>
                  <label className="text-[10px] font-bold uppercase text-gray-500">Tracking URL
                    <input type="url" value={draft.trackingUrl || ''} onChange={(e) => updateDraft(order.id, 'trackingUrl', e.target.value)} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#070A0F] px-3 py-2 text-xs text-white" placeholder="https://…" />
                  </label>
                  <label className="text-[10px] font-bold uppercase text-gray-500">Estimated delivery
                    <input value={draft.estimatedDelivery || ''} onChange={(e) => updateDraft(order.id, 'estimatedDelivery', e.target.value)} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#070A0F] px-3 py-2 text-xs text-white" placeholder="e.g. 12–18 Nov" />
                  </label>
                </div>

                {order.customerRequestStatus && (order.customerRequestStatus.endsWith('_requested') || order.customerRequestStatus === 'cancel_requested' || order.customerRequestStatus === 'return_requested') && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Request decision
                      <select value={draft.requestStatus || ''} onChange={(e) => updateDraft(order.id, 'requestStatus', e.target.value)} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#070A0F] px-3 py-2 text-xs text-white">
                        {REQUEST_STATUSES.map((status) => <option key={status || 'keep'} value={status}>{status ? status.replaceAll('_', ' ') : 'Choose decision'}</option>)}
                      </select>
                    </label>
                    <label className="text-[10px] font-bold uppercase text-gray-500">Note for customer
                      <input value={draft.adminNote || ''} onChange={(e) => updateDraft(order.id, 'adminNote', e.target.value)} className="mt-1 block w-full rounded-lg border border-white/10 bg-[#070A0F] px-3 py-2 text-xs text-white" placeholder="Optional update shown with the order" />
                    </label>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button type="button" onClick={() => saveOrder(order.id)} disabled={savingId === order.id} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#635BFF] to-[#00F2FE] px-4 py-2 text-xs font-black text-black disabled:opacity-50">
                    <Save className="w-3.5 h-3.5" /> {savingId === order.id ? 'Saving…' : 'Save updates'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
