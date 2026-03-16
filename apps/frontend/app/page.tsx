import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PromptAnimation } from './components/prompt-animation';

// TODO: This should be a marketing landing page, not just a simple welcome screen
// TODO: Add hero section, features, testimonials, etc.
// HINT: Check out the bonus challenge for marketing landing page!

const featureCards = [
  {
    eyebrow: 'Sponsors',
    title: 'Discover premium inventory faster',
    description:
      'Review opportunities, compare rates, and move into campaign planning without bouncing between static decks and inbox threads.',
  },
  {
    eyebrow: 'Publishers',
    title: 'Present inventory like a premium storefront',
    description:
      'List sponsorship opportunities with stronger positioning, clearer details, and a buying experience that feels credible to brands.',
  },
  {
    eyebrow: 'Agencies',
    title: 'Keep planning workflows centralized',
    description:
      'Shortlist opportunities, align stakeholders, and manage sponsorship discovery in one place instead of scattered documents.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Explore the marketplace',
    description:
      'Search high-impact sponsorship opportunities by audience, format, and category in a single workflow.',
  },
  {
    number: '02',
    title: 'Compare the best-fit options',
    description:
      'Evaluate pricing, context, and publisher fit side by side before you move into outreach or booking.',
  },
  {
    number: '03',
    title: 'Launch with less friction',
    description:
      'Move from discovery to action with a marketplace designed for modern sponsorship buying and selling.',
  },
];

const marqueeItems = [
  { type: 'wordmark', label: 'ORA' },
  { type: 'wordmark', label: 'Huel' },
  { type: 'wordmark', label: 'micro1.' },
  { type: 'wordmark', label: 'LEGENDZ' },
  { type: 'wordmark', label: 'DELTA' },
  { type: 'logo', src: '/icons8-amazon-64.png', alt: 'Amazon', width: 52, height: 52 },
  { type: 'logo', src: '/icons8-facebook-50.png', alt: 'Facebook', width: 44, height: 44 },
  { type: 'logo', src: '/icons8-instagram-50.png', alt: 'Instagram', width: 44, height: 44 },
  { type: 'logo', src: '/icons8-snapchat-64.png', alt: 'Snapchat', width: 52, height: 52 },
  { type: 'logo', src: '/tiktok.png', alt: 'TikTok', width: 44, height: 44 },
] as const;

const showcaseCards = [
  {
    title: 'PGA TOUR Tahoe Championship',
    meta: 'Sports Partnership · Lake Tahoe, CA',
    image: '/pga-tour-tahoe-championship.jpeg',
  },
  {
    title: 'Pebble Beach Food & Wine Festival',
    meta: 'Food Festival · Pebble Beach, CA',
    image: '/pebble-beach-food-wine-festival.jpg',
  },
  {
    title: 'The Wish Gala',
    meta: 'Cause Marketing · San Diego, CA',
    image: '/the-wish-gala.jpeg',
  },
] as const;

export const metadata: Metadata = {
  title: 'Sponsorship Marketplace for Brands and Publishers',
  description:
    'Discover premium sponsorship inventory, compare opportunities faster, and help publishers present listings in a polished marketplace.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Anvara Marketplace | The Sponsorship Marketplace',
    description:
      'Discover, compare, and act on premium sponsorship opportunities through Anvara’s sponsorship marketplace.',
    type: 'website',
    url: '/',
    images: [
      {
        url: '/pga-tour-tahoe-championship.jpeg',
        width: 1200,
        height: 630,
        alt: 'Anvara marketplace sponsorship showcase',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sponsorship Marketplace for Brands and Publishers',
    description:
      'Discover premium sponsorship inventory, compare opportunities faster, and help publishers present listings in a polished marketplace.',
    images: ['/pga-tour-tahoe-championship.jpeg'],
  },
};

export default function Home() {
  return (
    <article
      aria-labelledby="hero-heading"
      className="relative left-1/2 right-1/2 min-h-screen w-screen -translate-x-1/2 px-4 pb-8 sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <video className="h-full w-full object-cover" autoPlay muted loop playsInline>
          <source src="/hero-background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,32,0.56),rgba(8,17,32,0.82))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.34),transparent_38%)]" />
        <div className="absolute inset-0 bg-[rgba(2,6,23,0.3)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-8 sm:space-y-10">
        <header className="relative overflow-hidden rounded-[2.5rem] border border-white/12 bg-[rgba(8,17,32,0.46)] px-6 pb-10 pt-12 shadow-[0_30px_100px_rgba(2,6,23,0.45)] backdrop-blur-[6px] sm:px-10 sm:pb-14 sm:pt-16 lg:px-14 lg:pt-20">
          <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
            <p className="rounded-full border border-white/18 bg-black/20 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-200">
              Sponsorship discovery platform
            </p>
            <h1
              id="hero-heading"
              className="mt-8 max-w-4xl text-5xl font-medium tracking-[-0.06em] text-white sm:text-7xl lg:text-[6.5rem] lg:leading-[0.95]"
            >
              The Sponsorship Marketplace
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl">
              Anvara helps brands discover high-impact sponsorship opportunities and gives publishers a
              more polished way to bring inventory to market.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center rounded-2xl bg-[--color-primary] px-8 py-4 text-base font-semibold text-white bg-[linear-gradient(180deg,var(--color-primary-light),var(--color-primary))] shadow-[0_18px_45px_rgba(49,80,255,0.42)] ring-1 ring-white/12 transition hover:brightness-110"
              >
                Explore Marketplace
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-white/18 bg-white/8 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/14"
              >
                Get Started
              </Link>
            </div>

            <section
              aria-labelledby="showcase-heading"
              className="mt-12 w-full rounded-[2rem] border border-white/12 bg-[rgba(8,17,32,0.72)] p-4 backdrop-blur-md sm:p-5"
            >
              <PromptAnimation />
              <div className="mt-5 text-left">
                <h2 id="showcase-heading" className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  Featured sponsorship opportunities
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Preview the kind of premium inventory brands can discover and publishers can present through Anvara.
                </p>
              </div>

              <ul className="mt-5 grid gap-4 lg:grid-cols-3">
                {showcaseCards.map((card) => (
                  <li key={card.title} className="list-none">
                    <article className="flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-white/12 bg-white/6 text-left backdrop-blur-sm">
                      <div className="relative h-44">
                        <img
                          src={card.image}
                          alt={card.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.42))]" />
                      </div>
                      <div className="flex flex-1 flex-col justify-between space-y-2 p-5">
                        <h3 className="text-2xl font-semibold tracking-tight text-white">{card.title}</h3>
                        <p className="text-sm text-slate-300">{card.meta}</p>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </header>

        <section aria-labelledby="teams-heading" className="px-2 py-4 sm:px-0">
          <h2 id="teams-heading" className="text-center text-sm font-medium uppercase tracking-[0.3em] text-slate-300">
            Used by teams at
          </h2>
          <div className="logo-marquee mt-6" aria-label="Brand logos">
            <ul className="logo-track list-none p-0">
              {[...marqueeItems, ...marqueeItems].map((item, index) => (
                <li key={`${item.type}-${index}`} className="logo-item flex h-20 items-center justify-center px-8" aria-hidden="true">
                  {item.type === 'wordmark' ? (
                    <span className="text-2xl font-semibold tracking-tight text-white/92 sm:text-4xl">
                      {item.label}
                    </span>
                  ) : (
                    <Image
                      src={item.src}
                      alt={item.alt}
                      width={item.width}
                      height={item.height}
                      className="h-10 w-auto object-contain brightness-0 invert opacity-90"
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="features-heading" className="rounded-[2.25rem] border border-white/12 bg-[rgba(8,17,32,0.58)] px-6 py-16 backdrop-blur-[10px] sm:px-8 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-300">Why teams choose Anvara</p>
            <h2 id="features-heading" className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              Designed for premium sponsorship buying and selling
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {featureCards.map((feature, index) => (
              <article
                key={feature.title}
                className="rounded-[2rem] border border-white/12 bg-[rgba(255,255,255,0.06)] p-7 shadow-[0_24px_70px_rgba(2,6,23,0.24)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold text-white">
                  0{index + 1}
                </div>
                <p className="mt-6 text-sm uppercase tracking-[0.22em] text-slate-300">{feature.eyebrow}</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-slate-300">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="how-it-works-heading" className="grid gap-10 rounded-[2.25rem] border border-white/12 bg-[rgba(8,17,32,0.58)] p-7 backdrop-blur-[10px] sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-300">How it works</p>
            <h2 id="how-it-works-heading" className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              A cleaner path from discovery to placement
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
              Replace disconnected outreach, decks, and manual comparisons with a marketplace that feels
              credible to buyers and manageable for publishers.
            </p>
          </div>

          <ol className="space-y-5">
            {steps.map((step) => (
              <li
                key={step.number}
                className="rounded-[1.75rem] border border-white/12 bg-[rgba(255,255,255,0.05)] p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[--color-primary] text-sm font-semibold text-white">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-base leading-7 text-slate-300">{step.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="cta-heading" className="pb-2">
          <div className="rounded-[2.5rem] border border-white/12 bg-[linear-gradient(135deg,rgba(99,102,241,0.28),rgba(8,17,32,0.84)_45%,rgba(8,17,32,0.92))] px-7 py-10 shadow-[0_30px_100px_rgba(2,6,23,0.4)] backdrop-blur-[10px] sm:px-10 sm:py-14">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-300">Start now</p>
              <h2 id="cta-heading" className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Bring sponsorship inventory to market with less friction
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-200">
                Launch a marketplace experience that feels polished enough for brands and simple enough
                for your team to use every day.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(180deg,var(--color-primary-light),var(--color-primary))] px-7 py-4 text-base font-semibold text-white shadow-[0_18px_45px_rgba(49,80,255,0.42)] ring-1 ring-white/12 transition hover:brightness-110"
              >
                Get Started
              </Link>
              <p className="text-sm text-slate-300">
                No long setup. Start exploring marketplace inventory immediately.
              </p>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
