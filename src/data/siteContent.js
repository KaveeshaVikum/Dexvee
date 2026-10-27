// Everything here is plain text you can edit — no code knowledge needed.

// Big rotating banners on the home page. `gradient` is a Tailwind gradient;
// `link` is where the button goes (use "/?category=Name" to open a category).
export const BANNERS = [
  {
    id: 'new',
    eyebrow: 'Just landed',
    title: 'New arrivals, delivered island-wide',
    subtitle: 'Fresh finds from around the world, shipped straight to your door in Sri Lanka.',
    cta: 'Shop now',
    link: '/?category=All',
    gradient: 'from-[#1A0F2E] via-[#3B1D6E] to-fuchsia-600'
  },
  {
    id: 'payment',
    eyebrow: 'Easy payment',
    title: 'Pay by bank transfer',
    subtitle: 'Transfer the amount, upload your receipt at checkout, and we verify it within 3 business days.',
    cta: 'Start shopping',
    link: '/?category=All',
    gradient: 'from-[#0D0717] via-[#164E63] to-cyan-500'
  },
  {
    id: 'delivery',
    eyebrow: 'Good to know',
    title: 'Overseas delivery takes a little time',
    subtitle: 'Orders ship from our international suppliers. Follow your order any time in your account.',
    cta: 'My orders',
    link: '/account',
    gradient: 'from-[#1A0F2E] via-[#4C1D95] to-indigo-500'
  }
];

// Shown in the footer. Leave a value as '' to hide that line completely.
export const STORE = {
  name: 'Dexvee',
  tagline: 'The Future of Shopping',
  contactEmail: '',
  contactPhone: '',
  whatsapp: '',      // digits only with country code, e.g. 94771234567
  facebookUrl: '',   // e.g. https://facebook.com/yourpage
  instagramUrl: '',
  freeShippingOverUsd: 50 // must match the free-shipping rule used at checkout
};
