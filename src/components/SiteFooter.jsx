import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Banknote, Package, ShieldCheck, Mail, Phone } from 'lucide-react';
import { STORE } from '../data/siteContent';

const TRUST = [
  { icon: Truck, title: 'Island-wide delivery', text: 'Delivered to your door in Sri Lanka' },
  { icon: Banknote, title: 'Pay by bank transfer', text: 'Payments verified within 3 business days' },
  { icon: Package, title: 'Track your orders', text: 'See every order\'s status in your account' },
  { icon: ShieldCheck, title: 'Secure sign-in', text: 'Accounts protected by Google Firebase' },
];

export default function SiteFooter({ categories }) {
  const year = new Date().getFullYear();
  const hasContact = STORE.contactEmail || STORE.contactPhone || STORE.whatsapp;
  const hasSocial = STORE.facebookUrl || STORE.instagramUrl;

  return (
    <footer className="mt-12">
      <div className="bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {TRUST.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-10 h-10 shrink-0 rounded-full bg-[#1A0F2E]/5 text-[#1A0F2E] flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0D0717] text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <img src="/logo.png" alt={STORE.name} className="h-9 object-contain mb-3" />
            <p className="text-sm text-gray-500 leading-relaxed">
              {STORE.tagline}. Products from around the world, delivered to Sri Lanka.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-3">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-cyan-400 transition-colors">All Products</Link></li>
              {categories.slice(0, 5).map((c) => (
                <li key={c.name}>
                  <Link to={`/?category=${encodeURIComponent(c.name)}`} className="hover:text-cyan-400 transition-colors">{c.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-3">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/account" className="hover:text-cyan-400 transition-colors">Track My Order</Link></li>
              <li><Link to="/account" className="hover:text-cyan-400 transition-colors">My Account</Link></li>
              <li><Link to="/about" className="hover:text-cyan-400 transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              {STORE.contactEmail && (
                <li><a href={`mailto:${STORE.contactEmail}`} className="flex items-center gap-2 hover:text-cyan-400"><Mail className="w-4 h-4" /> {STORE.contactEmail}</a></li>
              )}
              {STORE.contactPhone && (
                <li><a href={`tel:${STORE.contactPhone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-cyan-400"><Phone className="w-4 h-4" /> {STORE.contactPhone}</a></li>
              )}
              {STORE.whatsapp && (
                <li><a href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-cyan-400">Chat on WhatsApp</a></li>
              )}
              {STORE.facebookUrl && (
                <li><a href={STORE.facebookUrl} target="_blank" rel="noreferrer" className="hover:text-cyan-400">Facebook</a></li>
              )}
              {STORE.instagramUrl && (
                <li><a href={STORE.instagramUrl} target="_blank" rel="noreferrer" className="hover:text-cyan-400">Instagram</a></li>
              )}
              {!hasContact && !hasSocial && <li className="text-gray-600">Contact details coming soon.</li>}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 pb-24 md:pb-5">
            <span>© {year} {STORE.name}. All rights reserved.</span>
            <span>Payment: bank transfer · Card payments coming soon</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
