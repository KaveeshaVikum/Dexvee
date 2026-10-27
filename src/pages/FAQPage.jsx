import { ArrowRight, CircleHelp, CreditCard, PackageCheck, RotateCcw, Truck } from 'lucide-react';

const faqItems = [
  {
    icon: Truck,
    title: 'Where does Dexvee deliver?',
    text: 'Dexvee delivers within Sri Lanka. Products ship from overseas, so the delivery estimate can vary by product and route. You’ll see the shipping charge at checkout; shipping is free on orders over USD 50.'
  },
  {
    icon: PackageCheck,
    title: 'How can I follow my order?',
    text: 'Signed-in customers can follow their orders in their account. Sign in or create an account to check your order details and progress.',
    link: { href: '/account?tab=orders', label: 'Go to my orders' }
  },
  {
    icon: CreditCard,
    title: 'How do I pay?',
    text: 'Payment currently uses bank transfer. Upload your transfer receipt with your order, and payment verification is promised within 3 business days.'
  },
  {
    icon: RotateCcw,
    title: 'Can I return a product?',
    text: 'A product page may display the phrase “14 days easy return,” but detailed return terms are not yet published here. The store must confirm your return eligibility and the process. Precise published return terms need configuration; please don’t treat that phrase alone as a complete policy.'
  }
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FA] px-4 py-10 text-slate-900 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="relative mb-8 overflow-hidden rounded-3xl bg-[#1A0F2E] px-6 py-9 text-white sm:px-10 sm:py-12">
          <div aria-hidden="true" className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-fuchsia-600/25 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-cyan-200">
              <CircleHelp className="h-4 w-4" aria-hidden="true" /> Help center
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Quick answers about delivery, orders, payment and returns at Dexvee.</p>
          </div>
        </header>

        <section aria-label="Frequently asked questions" className="grid gap-4 sm:grid-cols-2">
          {faqItems.map(({ icon: Icon, title, text, link }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-bold text-[#1A0F2E]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              {link && (
                <a href={link.href} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-[#1A0F2E] underline decoration-fuchsia-400 decoration-2 underline-offset-4 hover:text-fuchsia-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-600">
                  {link.label}<ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </article>
          ))}
        </section>

        <nav aria-label="Helpful links" className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-slate-600">Ready to browse or need to sign in?</p>
          <div className="flex flex-wrap gap-3">
            <a href="/auth" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1A0F2E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#30204a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">Sign in</a>
            <a href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-[#1A0F2E] transition hover:border-fuchsia-300 hover:bg-fuchsia-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">Continue shopping</a>
          </div>
        </nav>
      </div>
    </main>
  );
}
