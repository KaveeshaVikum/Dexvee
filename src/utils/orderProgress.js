const normalize = (value) => String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

function hasReview(order) {
  const reviewStatus = normalize(order.reviewStatus);
  return Boolean(
    order.reviewedAt
    || order.reviewSubmittedAt
    || order.reviewId
    || order.isReviewed
    || ['reviewed', 'review_complete', 'review_completed'].includes(normalize(order.status))
    || ['submitted', 'approved', 'complete', 'completed'].includes(reviewStatus)
  );
}

export function getOrderProgressState(order) {
  const status = normalize(order.status || 'placed');
  const paymentStatus = normalize(order.paymentStatus);
  const requestStatus = normalize(order.customerRequestStatus || order.requestStatus);
  const returnStatus = normalize(order.returnStatus);
  const cancellationStatus = normalize(order.cancellationStatus);
  const refundStatus = normalize(order.refundStatus);
  const allStates = [status, requestStatus, returnStatus, cancellationStatus, refundStatus];

  const isReturnOrCancellation = allStates.some((value) => [
    'cancel_requested',
    'cancel_request',
    'cancellation_requested',
    'cancel_approved',
    'cancelled',
    'canceled',
    'return_requested',
    'return_request',
    'return_in_progress',
    'return_approved',
    'returned',
    'refund_pending',
    'refunded'
  ].includes(value));

  if (paymentStatus === 'rejected' || isReturnOrCancellation) {
    let label = 'Order update';
    let note = 'This order has an update from our team.';
    const currentRequest = allStates.find((value) => value.includes('return') || value.includes('refund') || value.includes('cancel'));

    if (paymentStatus === 'rejected') {
      label = 'Payment not verified';
      note = "We couldn't match your transfer. Please contact support for help with this order.";
    } else if (currentRequest?.includes('return')) {
      label = currentRequest === 'returned' ? 'Return complete' : 'Return in progress';
      note = currentRequest === 'returned'
        ? 'Your return has been marked complete.'
        : 'Your return request is being reviewed. We will update you here.';
    } else if (currentRequest?.includes('refund')) {
      label = currentRequest === 'refunded' ? 'Refund complete' : 'Refund in progress';
      note = currentRequest === 'refunded'
        ? 'Your refund has been marked complete.'
        : 'Your refund is being processed.';
    } else if (currentRequest?.includes('request')) {
      label = 'Cancellation requested';
      note = 'Your cancellation request is being reviewed. We will update you here.';
    } else if (['cancelled', 'canceled'].includes(currentRequest)) {
      label = 'Order cancelled';
      note = 'This order has been cancelled.';
    }

    return { bucket: 'returns', stage: -1, status: label, note, terminal: true };
  }

  if (paymentStatus === 'pending_verification' || paymentStatus === 'pending' || ['pending_payment', 'payment_pending', 'to_pay'].includes(status)) {
    return {
      bucket: 'toPay',
      stage: 0,
      status: 'Payment under review',
      note: 'Your payment receipt is in. We will move your order forward after the payment check.',
      terminal: false
    };
  }

  if (['delivered', 'complete', 'completed', 'to_review', 'reviewed', 'review_complete', 'review_completed'].includes(status)) {
    const reviewed = hasReview(order);
    return {
      bucket: reviewed ? 'all' : 'toReview',
      stage: 3,
      status: reviewed ? 'Delivered · reviewed' : 'Delivered',
      note: reviewed ? 'Your order was delivered and reviewed.' : 'Your order has arrived. We hope you love it.',
      terminal: false
    };
  }

  if (['shipped', 'in_transit', 'out_for_delivery', 'to_receive'].includes(status)) {
    const labels = {
      shipped: 'Shipped',
      in_transit: 'In transit',
      out_for_delivery: 'Out for delivery',
      to_receive: 'In transit'
    };
    return {
      bucket: 'toReceive',
      stage: 2,
      status: labels[status],
      note: 'Your order is on its way. Use the carrier tracking link below for shipment updates.',
      terminal: false
    };
  }

  const isPreparing = ['processing', 'sent_to_cj', 'payment_confirmed', 'to_ship', 'packing', 'ready_to_ship'].includes(status)
    || order.cjOrderStatus === 'created'
    || paymentStatus === 'confirmed';

  return {
    bucket: 'toShip',
    stage: 1,
    status: isPreparing ? 'Being prepared' : 'Order received',
    note: isPreparing
      ? 'Payment is confirmed. We are preparing your order for dispatch.'
      : 'We have received your order and will share the next update here.',
    terminal: false
  };
}
