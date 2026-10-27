import { ArrowRight, Mail, MessageCircle, Phone, Store } from 'lucide-react';
import { STORE } from '../data/siteContent';

export default function ContactPage() {
  const hasEmail = Boolean(STORE.contactEmail?.trim());
  const hasPhone = Boolean(STORE.contactPhone?.trim());
  const hasWhatsApp = Boolean(STORE.whatsapp?.trim());
  const hasContact = hasEmail || hasPhone || hasWhatsApp;
  const phoneHref = hasPhone ? STORE.contactPhone.replace(/[^\d+]/g, '') : '';
  const whatsappNumber = hasWhatsApp ? STORE.whatsapp.replace(/\D/g, '') : '';

  return (
    <main className="min-h-screen bg-[#F8F9FA] px-4 py-10 text-slate-900 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="relative mb-8 overflow-hidden rounded-3xl bg-[#1A0F2E] px-6 py-9 text-white sm:px-10 sm:py-12">
          <div aria-hidden="true" className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-fuchsia-600/25 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-cyan-200">
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Customer care
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact Dexvee</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Find the available store contact channels and helpful links for your order.</p>
          </div>
        </header>

        <section aria-labelledby="contact-options-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-700">
              <Store className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 id="contact-options-heading" className="text-xl font-bold text-[#1A0F2E]">Contact options</h2>
          </div>

          {hasContact ? (
            <>
              <p className="mt-4 text-sm leading-6 text-slate-600">Use one of the contact channels currently provided by the store.</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {hasEmail && (
                  <li>
                    <a href={`mailto:${STORE.contactEmail}`} className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-semibold text-[#1A0F2E] transition hover:border-fuchsia-300 hover:bg-fuchsia-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">
                      <Mail className="h-5 w-5 shrink-0 text-fuchsia-700" aria-hidden="true" />
                      <span className="break-all">{STORE.contactEmail}</span>
                    </a>
                  </li>
                )}
                {hasPhone && (
                  <li>
                    <a href={`tel:${phoneHref}`} className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-semibold text-[#1A0F2E] transition hover:border-fuchsia-300 hover:bg-fuchsia-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">
                      <Phone className="h-5 w-5 shrink-0 text-fuchsia-700" aria-hidden="true" />
                      <span>{STORE.contactPhone}</span>
                    </a>
                  </li>
                )}
                {hasWhatsApp && whatsappNumber && (
                  <li>
                    <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-semibold text-[#1A0F2E] transition hover:border-cyan-300 hover:bg-cyan-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">
                      <MessageCircle className="h-5 w-5 shrink-0 text-cyan-700" aria-hidden="true" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  </li>
                )}
              </ul>
            </>
          ) : (
            <div role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
              <h3 className="font-semibold text-[#1A0F2E]">Store contact details are not configured yet</h3>
              <p className="mt-1 text-sm leading-6 text-slate-700">There is currently no support email, phone number or WhatsApp contact listed. We can’t provide a direct contact link until the store adds one.</p>
            </div>
          )}
        </section>

        <section aria-labelledby="order-help-heading" className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 id="order-help-heading" className="text-xl font-bold text-[#1A0F2E]">Need help with an order?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Signed-in customers can follow orders in their account. You can also sign in to continue to your customer account.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="/account?tab=orders" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1A0F2E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#30204a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">My orders <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
            <a href="/auth" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-[#1A0F2E] transition hover:border-fuchsia-300 hover:bg-fuchsia-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">Sign in</a>
            <a href="/" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-[#1A0F2E] transition hover:border-fuchsia-300 hover:bg-fuchsia-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">Return to store</a>
          </div>
        </section>
      </div>
    </main>
  );
}
