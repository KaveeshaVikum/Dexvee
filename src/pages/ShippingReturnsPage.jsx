import { ArrowRight, Banknote, Clock3, MapPin, PackageCheck, RotateCcw, Truck } from 'lucide-react';

function InfoCard({ icon: Icon, title, children, accent = 'fuchsia' }) {
  const iconClass = accent === 'cyan' ? 'bg-cyan-50 text-cyan-700' : 'bg-fuchsia-50 text-fuchsia-700';
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-bold text-[#1A0F2E]">{title}</h2>
      <div className="mt-2 text-sm leading-6 text-slate-600">{children}</div>
    </article>
  );
}

export default function ShippingReturnsPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FA] px-4 py-10 text-slate-900 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="relative mb-8 overflow-hidden rounded-3xl bg-[#1A0F2E] px-6 py-9 text-white sm:px-10 sm:py-12">
          <div aria-hidden="true" className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-fuchsia-600/25 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-cyan-200">
              <Truck className="h-4 w-4" aria-hidden="true" /> Delivery information
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Shipping &amp; returns</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">What to know about getting your order in Sri Lanka and where return details still need confirmation.</p>
          </div>
        </header>

        <section aria-labelledby="shipping-heading" className="mb-8">
          <h2 id="shipping-heading" className="mb-4 text-2xl font-bold tracking-tight text-[#1A0F2E]">Shipping</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard icon={MapPin} title="Delivery within Sri Lanka">
              Dexvee delivers within Sri Lanka. Products ship from overseas, and the delivery estimate varies by product and route.
            </InfoCard>
            <InfoCard icon={Truck} title="Shipping cost" accent="cyan">
              Shipping is calculated at checkout. Orders over USD 50 qualify for free shipping.
            </InfoCard>
            <InfoCard icon={PackageCheck} title="Follow your order">
              Signed-in customers can follow their orders in their account.
              <a href="/account?tab=orders" className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-[#1A0F2E] underline decoration-fuchsia-400 decoration-2 underline-offset-4 hover:text-fuchsia-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">
                View my account <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </InfoCard>
            <InfoCard icon={Banknote} title="Payment verification" accent="cyan">
              Payment currently uses bank transfer with receipt upload. Payment verification is promised within 3 business days.
            </InfoCard>
          </div>
        </section>

        <section aria-labelledby="returns-heading" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="returns-heading" className="text-xl font-bold text-[#1A0F2E]">Returns: please confirm with the store</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">A product page may show the phrase “14 days easy return,” but detailed return terms are not available here. The store must confirm whether a return is eligible and what process applies. The precise published terms need configuration; the phrase on a product page is not a complete return policy.</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">No eligibility, return-postage, refund-timing or cancellation terms are stated on this page.</p>
            </div>
          </div>
        </section>

        <nav aria-label="Next steps" className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Clock3 className="h-5 w-5 shrink-0 text-cyan-700" aria-hidden="true" />
            <span>Check your order or explore the store.</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/account?tab=orders" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1A0F2E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#30204a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">My orders</a>
            <a href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-[#1A0F2E] transition hover:border-fuchsia-300 hover:bg-fuchsia-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">Shop Dexvee</a>
          </div>
        </nav>
      </div>
    </main>
  );
}
