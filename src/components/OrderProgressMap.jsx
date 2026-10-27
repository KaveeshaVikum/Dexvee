import {
  AlertCircle,
  BadgeCheck,
  Check,
  CreditCard,
  PackageCheck,
  Truck
} from 'lucide-react';

const JOURNEY_STEPS = [
  { id: 'toPay', label: 'To Pay', detail: 'Payment check', icon: CreditCard },
  { id: 'toShip', label: 'To Ship', detail: 'Getting ready', icon: PackageCheck },
  { id: 'toReceive', label: 'To Receive', detail: 'On the way', icon: Truck },
  { id: 'toReview', label: 'To Review', detail: 'Delivered', icon: BadgeCheck }
];

export default function OrderProgressMap({ order, darkMode, progress }) {
  const lineBase = darkMode ? 'bg-white/10' : 'bg-slate-200';
  const lineDone = darkMode ? 'bg-violet-400' : 'bg-[#1A0F2E]';
  const muted = darkMode ? 'text-slate-500' : 'text-slate-400';
  const currentStep = progress.stage;
  const completion = currentStep < 1 ? 0 : (currentStep / (JOURNEY_STEPS.length - 1)) * 100;

  return (
    <section className={`rounded-2xl border p-5 sm:p-6 ${darkMode ? 'border-white/10 bg-[#080B13]' : 'border-slate-200 bg-white'}`} aria-label={`Order progress: ${progress.status}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${muted}`}>Delivery journey</p>
          <h3 className="mt-1 text-base font-black">{progress.terminal ? 'Order update' : 'Your order, at a glance'}</h3>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-extrabold ${progress.terminal
          ? (darkMode ? 'border-amber-300/20 bg-amber-300/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800')
          : (darkMode ? 'border-violet-300/20 bg-violet-300/10 text-violet-200' : 'border-violet-200 bg-violet-50 text-[#1A0F2E]')}`}>
          {progress.terminal ? <AlertCircle className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current" />}
          {progress.status}
        </span>
      </div>

      <div className={`relative mt-7 ${progress.terminal ? 'opacity-45' : ''}`}>
        <div className={`absolute left-[12.5%] right-[12.5%] top-[15px] h-1 rounded-full ${lineBase}`} />
        {!progress.terminal && (
          <div
            className={`absolute left-[12.5%] top-[15px] h-1 rounded-full transition-[width] duration-500 ${lineDone}`}
            style={{ width: `${completion * 0.75}%` }}
          />
        )}
        <ol className="relative grid grid-cols-4">
          {JOURNEY_STEPS.map((step, index) => {
            const Icon = step.icon;
            const reached = !progress.terminal && index <= currentStep;
            const isCurrent = !progress.terminal && index === currentStep;
            return (
              <li key={step.id} className="flex min-w-0 flex-col items-center text-center" aria-current={isCurrent ? 'step' : undefined}>
                <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${reached
                  ? (isCurrent ? 'border-[#1A0F2E] bg-[#1A0F2E] text-white shadow-[0_0_0_5px_rgba(26,15,46,0.10)]' : (darkMode ? 'border-violet-300 bg-violet-300 text-[#10091D]' : 'border-[#1A0F2E] bg-[#1A0F2E] text-white'))
                  : (darkMode ? 'border-white/10 bg-[#080B13] text-slate-600' : 'border-slate-200 bg-white text-slate-400')}`}>
                  {reached && index < currentStep ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <span className={`mt-3 text-[10px] font-black leading-tight sm:text-xs ${reached ? (darkMode ? 'text-slate-100' : 'text-slate-900') : muted}`}>{step.label}</span>
                <span className={`mt-1 hidden text-[10px] font-medium sm:block ${muted}`}>{step.detail}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className={`mt-6 flex flex-col gap-3 border-t pt-4 text-xs sm:flex-row sm:items-center sm:justify-between ${darkMode ? 'border-white/10 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
        <p className="max-w-2xl leading-relaxed">{progress.note}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 font-semibold">
          {order.trackingNumber && <span>Tracking <span className={darkMode ? 'text-slate-200' : 'text-slate-800'}>{order.trackingNumber}</span></span>}
          {order.estimatedDelivery && <span>Est. {order.estimatedDelivery}</span>}
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 font-black underline underline-offset-2 ${darkMode ? 'text-violet-300' : 'text-[#1A0F2E]'}`}>
              Track parcel <Truck className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
