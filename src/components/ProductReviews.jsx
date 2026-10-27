import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, LoaderCircle, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';

function reviewDate(review) {
  const date = review.createdAt?.toDate?.();
  return date ? date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';
}

export default function ProductReviews({ productId, requestedOrderId = '' }) {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(requestedOrderId);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadedViewKey, setLoadedViewKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadReviews = useCallback(async () => {
    if (!productId) return;
    try {
      const reviewQuery = query(collection(db, 'productReviews'), where('productId', '==', productId));
      const snapshot = await getDocs(reviewQuery);
      const list = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((review) => review.verifiedPurchase === true)
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
        .slice(0, 40);
      setReviews(list);
    } catch (err) {
      console.error('Could not load product reviews:', err);
      setReviews([]);
    }
  }, [productId]);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    let active = true;
    const viewKey = `${productId}:${user?.uid || 'guest'}`;

    const load = async () => {
      await loadReviews();
      if (active) setError('');
      if (user) {
        try {
          const ordersQuery = query(collection(db, 'orders'), where('userId', '==', user.uid));
          const snapshot = await getDocs(ordersQuery);
          const eligible = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((order) => ['delivered', 'complete', 'completed'].includes(String(order.status || '').toLowerCase()))
            .filter((order) => (order.items || []).some((item) => item.id === productId || item.productId === productId))
            .filter((order) => !(order.reviewedProductIds || []).includes(productId));
          if (!active) return;
          setEligibleOrders(eligible);
          const requested = eligible.find((order) => order.id === requestedOrderId);
          setSelectedOrderId(requested?.id || eligible[0]?.id || '');
        } catch (err) {
          console.error('Could not check review eligibility:', err);
          if (active) setError('We could not verify your delivered orders right now. Please try again.');
        }
      } else if (active) {
        setEligibleOrders([]);
        setSelectedOrderId('');
      }
      if (active) {
        setLoadedViewKey(viewKey);
        setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [productId, user, requestedOrderId, loadReviews]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedOrderId || text.trim().length < 5) return;
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/.netlify/functions/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: selectedOrderId,
          productId,
          rating,
          text: text.trim()
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not submit your review.');
      setText('');
      setNotice('Thanks — your verified review has been published.');
      await loadReviews();
      setEligibleOrders((current) => current.filter((order) => order.id !== selectedOrderId));
      setSelectedOrderId('');
    } catch (err) {
      setError(err.message || 'Could not submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : null;
  const viewKey = `${productId}:${user?.uid || 'guest'}`;
  const isLoading = loading || loadedViewKey !== viewKey;

  return (
    <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 sm:p-6" aria-labelledby="product-reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-600">Verified buyers</p>
          <h2 id="product-reviews-heading" className="mt-1 text-lg font-black text-[#1A0F2E]">Customer reviews</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {average !== null && <><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><strong className="text-gray-800">{average.toFixed(1)}</strong><span>·</span></>}
          <span>{reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-sm text-gray-400">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="py-7 text-center text-sm text-gray-500">No verified reviews yet. Be the first to share your experience after delivery.</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {reviews.map((review) => (
            <article key={review.id} className="py-4 first:pt-5 last:pb-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">{review.authorName || 'Verified customer'}</span>
                  {review.verifiedPurchase && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"><BadgeCheck className="h-3 w-3" /> Verified purchase</span>}
                </div>
                <span className="text-xs text-gray-400">{reviewDate(review)}</span>
              </div>
              <div className="mt-1 flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-3.5 w-3.5 ${index < Number(review.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />)}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">{review.text}</p>
            </article>
          ))}
        </div>
      )}

      {!isLoading && notice && <p role="status" className="mt-4 text-xs font-semibold text-emerald-700">{notice}</p>}
      {!isLoading && user && eligibleOrders.length > 0 && (
        <form onSubmit={handleSubmit} className="mt-5 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
          <h3 className="font-black text-[#1A0F2E]">Share your experience</h3>
          <p className="mt-1 text-xs text-gray-500">Only customers with a delivered order can post a verified review.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <label className="text-xs font-bold text-gray-600">Delivered order
              <select required value={selectedOrderId} onChange={(event) => setSelectedOrderId(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800">
                {eligibleOrders.map((order) => <option key={order.id} value={order.id}>Order {order.orderNumber || order.id}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-gray-600">Rating
              <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800">
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? '' : 's'}</option>)}
              </select>
            </label>
          </div>
          <label className="mt-3 block text-xs font-bold text-gray-600">Your review
            <textarea required minLength={5} maxLength={1500} value={text} onChange={(event) => setText(event.target.value)} rows={4} placeholder="What did you think of this product?" className="mt-1 block w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1A0F2E]" />
          </label>
          {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
          <button type="submit" disabled={submitting || text.trim().length < 5} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#1A0F2E] px-5 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50">
            {submitting && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{submitting ? 'Submitting…' : 'Post verified review'}
          </button>
        </form>
      )}

      {!isLoading && user && eligibleOrders.length === 0 && reviews.length > 0 && (
        <p className="mt-4 text-xs text-gray-400">Reviews are available after a delivered purchase.</p>
      )}
      {!isLoading && !user && (
        <p className="mt-4 text-xs text-gray-500"><Link to="/auth" className="font-bold text-[#1A0F2E] underline">Sign in</Link> with the account used for a delivered order to write a verified review.</p>
      )}
      {!isLoading && error && !eligibleOrders.length && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
    </section>
  );
}
