import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, Truck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const STATUS_LABELS = {
  placed: 'Order received',
  payment_pending: 'Payment under review',
  pending_verification: 'Payment under review',
  payment_confirmed: 'Payment confirmed',
  sent_to_cj: 'Order sent for processing',
  processing: 'Preparing your order',
  shipped: 'Shipped',
  in_transit: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  delayed: 'Delivery delayed',
  cancelled: 'Cancelled'
};

const STATUS_STEPS = [
  ['placed', 'Order received'],
  ['payment_confirmed', 'Payment confirmed'],
  ['processing', 'Preparing your order'],
  ['shipped', 'Shipped'],
  ['in_transit', 'In transit'],
  ['delivered', 'Delivered']
];

function displayStatus(order) {
  if (order.paymentStatus === 'pending_verification') return 'pending_verification';
  if (order.paymentStatus === 'rejected') return 'cancelled';
  if (order.status === 'placed' && order.paymentStatus === 'confirmed') return 'payment_confirmed';
  return String(order.status || order.cjOrderStatus || 'placed').toLowerCase();
}

function stepIndex(status) {
  const index = STATUS_STEPS.findIndex(([key]) => key === status);
  if (status === 'pending_verification') return 0;
  return index < 0 ? 0 : index;
}

export default function GuestTrackPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [identity, setIdentity] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setOrder(null);
    setLoading(true);

    try {
      const response = await fetch('/.netlify/functions/lookup-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, identity })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Order not found.');
      setOrder(data.order);
    } catch {
      setError('We could not find that order. Check the order number and email or phone details.');
    } finally {
      setLoading(false);
    }
  }

  const currentStatus = order ? displayStatus(order) : null;
  const currentStep = order ? stepIndex(currentStatus) : 0;

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 py-10 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Package className="w-10 h-10 mx-auto mb-3 text-[#1A0F2E]" />
          <h1 className="text-3xl font-black text-gray-900">Track your order</h1>
          <p className="mt-2 text-sm text-gray-500">No account is required. Use your order number and the email or last four digits of the phone number used at checkout.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-500">
              Order number
              <input
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                placeholder="e.g. DV-123456"
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:border-[#1A0F2E]"
              />
            </label>
            <label className="text-xs font-black uppercase tracking-wider text-gray-500">
              Email or phone last 4 digits
              <input
                value={identity}
                onChange={(event) => setIdentity(event.target.value)}
                placeholder="name@example.com or 4567"
                required
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium outline-none focus:border-[#1A0F2E]"
              />
            </label>
          </div>
          <button disabled={loading} className="mt-5 w-full rounded-xl bg-[#1A0F2E] py-3.5 text-sm font-black uppercase tracking-wider text-white disabled:opacity-60">
            <Search className="inline-block w-4 h-4 mr-2" />
            {loading ? 'Checking…' : 'Track Order'}
          </button>
          {error && <p className="mt-4 text-sm font-bold text-red-500">{error}</p>}
        </form>

        {order && (
          <section className="mt-6 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-gray-100 pb-5">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-gray-400">Order</p>
                <h2 className="text-xl font-black text-gray-900">#{order.orderNumber}</h2>
                <p className="mt-1 text-sm text-gray-500">{order.productName}{order.quantity > 1 ? ` × ${order.quantity}` : ''}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs font-black uppercase tracking-wider text-gray-400">Current status</p>
                <p className="mt-1 text-lg font-black text-[#1A0F2E]">{STATUS_LABELS[currentStatus] || 'Order update'}</p>
              </div>
            </div>

            {currentStatus === 'pending_verification' ? (
              <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <Clock className="w-5 h-5 shrink-0" />
                <p>We received your payment proof and are checking it. We will contact you when verification is complete.</p>
              </div>
            ) : currentStatus === 'delayed' ? (
              <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>Your shipment is taking longer than expected. We are monitoring it and will update you.</p>
              </div>
            ) : (
              <div className="mt-7 space-y-5">
                {STATUS_STEPS.map(([key, label], index) => (
                  <div key={key} className="flex items-center gap-3 text-sm">
                    {index <= currentStep ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Truck className="w-5 h-5 text-gray-300" />}
                    <span className={index <= currentStep ? 'font-bold text-gray-900' : 'text-gray-400'}>{label}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-7 grid gap-3 border-t border-gray-100 pt-5 text-sm text-gray-600 sm:grid-cols-2">
              {order.estimatedDelivery && <p><strong>Estimated delivery:</strong> {order.estimatedDelivery}</p>}
              {order.trackingNumber && <p><strong>Tracking number:</strong> {order.trackingNumber}</p>}
              {order.trackingUrl && <a className="font-bold text-[#1A0F2E] underline" href={order.trackingUrl} target="_blank" rel="noreferrer">Track with carrier</a>}
            </div>
          </section>
        )}

        <div className="mt-7 text-center text-sm text-gray-500">
          Need help? <Link className="font-bold text-[#1A0F2E] underline" to="/about">Contact support</Link> · <Link className="font-bold text-[#1A0F2E] underline" to="/">Back to store</Link>
        </div>
      </div>
    </main>
  );
}
