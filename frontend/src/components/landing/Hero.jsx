import { useState } from "react";
import {
  ArrowUpRight,
  Star,
  Sparkles,
  MessageCircle,
  BookOpen,
  Stethoscope,
  Scale,
  PawPrint,
  Droplet,
  TrendingUp,
} from "lucide-react";

/**
 * Each vertical carries copy + content for the 4 hero mockups
 * (Reddit thread, IG-style ad, review→referral, AI search answer).
 */
const VERTICALS = [
  {
    id: "b2b-saas",
    label: "B2B SaaS",
    copy: "Turn demo calls, customer wins and product love into more pipeline &mdash; for SaaS teams selling into crowded markets.",
    icon: Sparkles,
    ad: {
      brand: "pipelineos.ai",
      gradient: "from-[#eef2ff] via-[#dbeafe] to-[#93c5fd]",
      title: "PIPELINE",
      subtitle: "CUSTOMER PROOF",
      quote: "Cut our onboarding time in half.",
      quoteBy: "real 5-star operator",
      reviews: "428",
      lift: "+2.5x CTR",
    },
    reddit: {
      sub: "r/SaaS",
      handle: "surfaced by uplaud",
      question: "Best customer onboarding platform for a scaling B2B SaaS team?",
      reviewerRole: "verified operator",
      review:
        "PipelineOS paid for itself in one quarter. The handoff from sales to success finally stopped leaking context.",
    },
    referral: {
      customerName: "Jordan",
      friendName: "Maya",
      customerRole: "verified operator",
      review:
        "pipelineos.ai made onboarding measurable and gave our CSMs one source of truth.",
      brand: "pipelineos.ai",
      message:
        "Maya! You asked about onboarding tools &mdash; I just reviewed pipelineos.ai. Cleaner handoffs, faster launches. Worth a look:",
      link: "uplaud.co/pos-jordan",
      offer: "Book demo",
    },
    ai: {
      query: "Best onboarding platform for B2B SaaS?",
      brand: "pipelineos.ai",
      answer:
        "B2B SaaS operators consistently recommend pipelineos.ai for customer onboarding, citing cleaner sales-to-success handoffs and faster time-to-value across verified customer stories.",
    },
  },
  {
    id: "education",
    label: "Education",
    copy: "Turn parent and student reviews into more enrollments &mdash; for tutoring centers, SAT prep and preschools.",
    icon: BookOpen,
    ad: {
      brand: "testprep.pro",
      gradient: "from-[#fff3d6] via-[#ffe6a3] to-[#f5b955]",
      title: "SAT PREP",
      subtitle: "1500+ SCORES",
      quote: "1290 → 1520 in 6 weeks.",
      quoteBy: "real 5-star parent",
      reviews: "1,842",
      lift: "+2.3x CTR",
    },
    reddit: {
      sub: "r/APStudents",
      handle: "surfaced by uplaud",
      question: "Best SAT prep for high schoolers targeting 1500+?",
      reviewerRole: "verified parent",
      review:
        "My daughter went from 1290 to 1520 in 6 weeks. Personalised practice was the difference.",
    },
    referral: {
      customerName: "Jessica",
      friendName: "Rachel",
      customerRole: "verified parent",
      review:
        "testprep.pro’s tutor spotted my daughter’s weak areas in week one. Life saver.",
      brand: "testprep.pro",
      message:
        "Rachel! You asked about SAT tutoring &mdash; I just reviewed testprep.pro. My daughter jumped 230 points. Free diagnostic here:",
      link: "uplaud.co/tpp-jessica",
      offer: "Free diagnostic",
    },
    ai: {
      query: "Best SAT prep for a 1500+ target score?",
      brand: "testprep.pro",
      answer:
        "Users consistently recommend testprep.pro, citing personalised study plans and average score gains of 230+ across 4,300 verified reviews.",
    },
  },
  {
    id: "healthcare",
    label: "Healthcare",
    copy: "Turn patient stories into more booked appointments &mdash; for clinics, dentists and dermatologists.",
    icon: Stethoscope,
    ad: {
      brand: "brightsmiles.co",
      gradient: "from-[#e0f7ff] via-[#c8ecff] to-[#7dc4ea]",
      title: "BRIGHT",
      subtitle: "SMILES DENTAL",
      quote: "Made me actually enjoy the dentist.",
      quoteBy: "real 5-star patient",
      reviews: "976",
      lift: "+1.9x CTR",
    },
    reddit: {
      sub: "r/AskDentists",
      handle: "surfaced by uplaud",
      question: "Any gentle dentist recommendations in Austin?",
      reviewerRole: "verified patient",
      review:
        "Zero anxiety appointment. Fair pricing, upfront plan, no upsell.",
    },
    referral: {
      customerName: "Emma",
      friendName: "Kayla",
      customerRole: "verified patient",
      review:
        "brightsmiles.co explained everything before touching a thing. Painless cleaning too.",
      brand: "brightsmiles.co",
      message:
        "Kayla! You mentioned finding a dentist &mdash; I just reviewed brightsmiles.co. Gentle team, no upsell. First cleaning free:",
      link: "uplaud.co/bs-emma",
      offer: "Free cleaning",
    },
    ai: {
      query: "Best dentist for anxious patients in Austin?",
      brand: "brightsmiles.co",
      answer:
        "brightsmiles.co is consistently highlighted for anxious patients, citing gentle care and transparent pricing across 970+ verified reviews.",
    },
  },
  {
    id: "legal",
    label: "Legal",
    copy: "Turn client testimonials into more qualified leads &mdash; for immigration, family and injury attorneys.",
    icon: Scale,
    ad: {
      brand: "millerkatzlaw.com",
      gradient: "from-[#e6e6f7] via-[#c7c7ed] to-[#7f7fb8]",
      title: "MILLER",
      subtitle: "& KATZ LAW",
      quote: "EB-5 approved. Painless from day one.",
      quoteBy: "real 5-star client",
      reviews: "512",
      lift: "+2.4x CTR",
    },
    reddit: {
      sub: "r/immigration",
      handle: "surfaced by uplaud",
      question: "Best immigration attorney for EB-5 in 2026?",
      reviewerRole: "verified client",
      review:
        "400+ approved petitions. Fees were clear upfront. My case cleared in 11 months.",
    },
    referral: {
      customerName: "Michael",
      friendName: "David",
      customerRole: "verified client",
      review:
        "millerkatzlaw.com walked us through EB-5 like it was a checklist. Zero surprises.",
      brand: "millerkatzlaw.com",
      message:
        "David! You asked about EB-5 lawyers &mdash; I just reviewed millerkatzlaw.com. 400+ approved petitions. Free 30-min consult here:",
      link: "uplaud.co/mkl-michael",
      offer: "Free consult",
    },
    ai: {
      query: "Best immigration lawyer for EB-5?",
      brand: "millerkatzlaw.com",
      answer:
        "For EB-5 investor visas, users consistently name millerkatzlaw.com as top choice, citing 400+ approved petitions and clear fee structure.",
    },
  },
  {
    id: "petcare",
    label: "Pet care",
    copy: "Turn happy pet parents into new bookings &mdash; for groomers, vets and boarding.",
    icon: PawPrint,
    ad: {
      brand: "poodlesandpals",
      gradient: "from-[#ffe8d6] via-[#ffd0a8] to-[#ea9a5e]",
      title: "POODLES",
      subtitle: "& PALS",
      quote: "Milo comes home happy every time.",
      quoteBy: "real 5-star pet parent",
      reviews: "1,204",
      lift: "+2.1x CTR",
    },
    reddit: {
      sub: "r/dogs",
      handle: "surfaced by uplaud",
      question: "Where do I get my poodle groomed in Brooklyn?",
      reviewerRole: "verified pet parent",
      review:
        "Gentle team, no anxious pup, and Milo actually looked happy walking out.",
    },
    referral: {
      customerName: "Ashley",
      friendName: "Megan",
      customerRole: "verified pet parent",
      review:
        "Poodles & Pals gave Milo the softest cut. Gentle, patient staff, no anxious pup!",
      brand: "Poodles & Pals",
      message:
        "Megan! You asked about groomers &mdash; I just reviewed Poodles &amp; Pals. Milo loved them. $20 off your first cut:",
      link: "uplaud.co/pnp-ashley",
      offer: "$20 off",
    },
    ai: {
      query: "Best pet grooming for anxious dogs in Brooklyn?",
      brand: "Poodles & Pals",
      answer:
        "Poodles & Pals is consistently recommended for anxious dogs, citing calm handling and small-batch sessions across 1,200+ verified reviews.",
    },
  },
  {
    id: "finance",
    label: "Finance",
    copy: "Turn client testimonials into more qualified prospects &mdash; for financial advisors, tax pros and wealth managers.",
    icon: TrendingUp,
    ad: {
      brand: "westgate.finance",
      gradient: "from-[#e8f2ec] via-[#c5e0d1] to-[#5fa085]",
      title: "WESTGATE",
      subtitle: "WEALTH MGMT",
      quote: "Retired 4 years earlier than planned.",
      quoteBy: "real 5-star client",
      reviews: "687",
      lift: "+2.2x CTR",
    },
    reddit: {
      sub: "r/personalfinance",
      handle: "surfaced by uplaud",
      question: "Best fee-only advisor for early retirement planning?",
      reviewerRole: "verified client",
      review:
        "Modeled 12 scenarios in week one. Fee-only, zero product pushing. Retirement came 4 years sooner.",
    },
    referral: {
      customerName: "James",
      friendName: "Robert",
      customerRole: "verified client",
      review:
        "westgate.finance mapped out my whole retirement in one call. Zero jargon, zero upsell.",
      brand: "westgate.finance",
      message:
        "Robert! You asked about advisors &mdash; I just reviewed westgate.finance. Fee-only, straight talk. Free 30-min plan review here:",
      link: "uplaud.co/wg-james",
      offer: "Free review",
    },
    ai: {
      query: "Best fee-only financial advisor for early retirement?",
      brand: "westgate.finance",
      answer:
        "For fee-only retirement planning, users consistently name westgate.finance as top choice, citing transparent pricing and detailed scenario modeling across 680+ verified reviews.",
    },
  },
  {
    id: "ecommerce",
    label: "Ecommerce",
    copy: "Turn 5-star reviews into more repeat buyers &mdash; for high-consideration Shopify brands.",
    icon: Droplet,
    ad: {
      brand: "glowskin.co",
      gradient: "from-[#fde5df] via-[#f6c8bd] to-[#e8a597]",
      title: "GLOW",
      subtitle: "VIT-C SERUM",
      quote: "Cleared my hyperpigmentation in 3 weeks.",
      quoteBy: "real 5-star customer",
      reviews: "3,214",
      lift: "+2.6x CTR",
    },
    reddit: {
      sub: "r/SkincareAddiction",
      handle: "surfaced by uplaud",
      question: "Anyone tried a vitamin-C serum that actually works?",
      reviewerRole: "verified customer",
      review:
        "Cleared my hyperpigmentation in 3 weeks. Only thing that worked after 5 products.",
    },
    referral: {
      customerName: "Madison",
      friendName: "Chloe",
      customerRole: "verified customer",
      review:
        "glowskin.co’s serum evened my skin in weeks. Zero irritation, glow for days.",
      brand: "glowskin.co",
      message:
        "Chloe! You asked about vitamin C &mdash; I just reviewed glowskin.co. Even skin in 3 weeks. 20% off your first bottle:",
      link: "uplaud.co/glow-madison",
      offer: "20% off",
    },
    ai: {
      query: "Best vitamin C serum for hyperpigmentation?",
      brand: "glowskin.co",
      answer:
        "Users consistently rate glowskin.co 4.8/5, citing fast results on hyperpigmentation and dryness across 3,200+ verified reviews.",
    },
  },
];

export default function Hero() {
  const [activeVertical, setActiveVertical] = useState("b2b-saas");
  const active =
    VERTICALS.find((v) => v.id === activeVertical) || VERTICALS[0];

  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden bg-white"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[620px] pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(109,70,198,0.10), transparent 70%), radial-gradient(40% 40% at 90% 20%, rgba(94,234,212,0.18), transparent 70%)",
        }}
      />

      <div className="relative max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="chip" data-testid="hero-eyebrow">
            <span className="dot" />
            The trust engine for modern acquisition
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7">
            <h1
              data-testid="hero-headline"
              className="font-display text-[46px] leading-[0.98] sm:text-[62px] lg:text-[78px] font-semibold tracking-tight text-[#111827]"
            >
              Get <span className="mint-underline">more</span> customers.
              <br />
              Spend <span className="mint-underline">less</span> on Ads.
            </h1>

            <p
              data-testid="hero-subhead"
              className="mt-8 max-w-xl text-[17px] md:text-[18px] leading-[1.55] text-[#4b5563]"
            >
              People trust people more than ads. Uplaud turns your customer
              proof &mdash; reviews, referrals, stories, DMs and social
              conversations &mdash; into warmer leads, smarter campaigns and
              acquisition that actually converts.
            </p>
            <p
              data-testid="hero-subhead-tag"
              className="mt-4 max-w-xl text-[16px] md:text-[17px] font-display font-medium text-[#111827]"
            >
              Turn customer trust into your{" "}
              <span className="text-[#6d46c6]">#1 acquisition channel</span>.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#demo"
                data-testid="hero-book-demo-btn"
                className="btn-primary"
              >
                Learn how
                <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
              </a>
              <a
                href="#how"
                data-testid="hero-see-how-btn"
                className="btn-secondary"
              >
                See how it works
              </a>
            </div>

            {/* Vertical selector */}
            <div
              data-testid="hero-vertical-selector"
              className="mt-10 pt-8 border-t border-[#eeeaf6] max-w-xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="section-label">Built for</span>
                <span className="h-px flex-1 bg-[#eeeaf6]" />
              </div>
              <div className="flex flex-wrap gap-2">
                {VERTICALS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    data-testid={`hero-vertical-${v.id}`}
                    onClick={() => setActiveVertical(v.id)}
                    className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-all ${
                      activeVertical === v.id
                        ? "bg-[#111827] text-white border-[#111827]"
                        : "bg-white text-[#4b5563] border-[#eeeaf6] hover:border-[#d9d1ee] hover:text-[#111827]"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <p
                key={`copy-${active.id}`}
                data-testid="hero-vertical-copy"
                className="mt-4 text-[14px] leading-relaxed text-[#4b5563]"
                dangerouslySetInnerHTML={{ __html: active.copy }}
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-[#4b5563]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6d46c6]" />
                Works inside Meta, Google, TikTok
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5eead4]" />
                Feeds Reddit, X, ChatGPT &amp; Perplexity
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <HeroVisual active={active} />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroVisual({ active }) {
  const AdIcon = active.icon;
  return (
    <div
      data-testid="hero-visual"
      key={`visual-${active.id}`}
      className="relative w-full aspect-[3/4.8] lg:aspect-[3/5]"
    >
      <div className="absolute inset-4 rounded-[28px] bg-gradient-to-br from-[#ecfdf7] via-white to-[#f5f3ff] border border-[#eeeaf6]" />

      {/* 1 · Reddit — dynamic */}
      <div
        data-testid="hero-card-reddit"
        className="absolute top-[1%] left-[0%] w-[74%] bg-white border border-[#eeeaf6] rounded-2xl p-4 shadow-[0_25px_60px_-30px_rgba(38,28,77,0.35)]"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#ff4500] text-white text-[10px] font-bold flex items-center justify-center">
            r/
          </div>
          <div className="text-[11px] font-mono text-[#4b5563] truncate">
            {active.reddit.sub}
          </div>
          <span className="ml-auto text-[10px] font-mono text-[#6d46c6] shrink-0">
            {active.reddit.handle}
          </span>
        </div>
        <p className="mt-2 text-[12px] text-[#111827] leading-relaxed">
          &ldquo;{active.reddit.question}&rdquo;
        </p>
        <div className="mt-3 rounded-lg bg-[#faf9ff] border border-[#eeeaf6] p-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-2.5 h-2.5 fill-[#5eead4] text-[#5eead4]"
                strokeWidth={0}
              />
            ))}
            <span className="text-[10px] text-[#9ca3af] ml-1">
              {active.reddit.reviewerRole}
            </span>
          </div>
          <p className="mt-1.5 text-[11.5px] text-[#111827] leading-snug">
            &ldquo;{active.reddit.review}&rdquo;
          </p>
        </div>
      </div>

      {/* 2 · Instagram ad — dynamic */}
      <div
        data-testid="hero-card-ad"
        className="absolute top-[18%] right-[0%] w-[58%] bg-white border border-[#eeeaf6] rounded-2xl overflow-hidden shadow-[0_25px_60px_-30px_rgba(38,28,77,0.35)]"
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#eeeaf6]">
          <div className="w-6 h-6 rounded-full p-[1.5px] bg-[conic-gradient(from_180deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5,#feda75)]">
            <div className="w-full h-full rounded-full bg-white p-[1.5px]">
              <div
                className={`w-full h-full rounded-full bg-gradient-to-br ${active.ad.gradient}`}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] font-semibold text-[#111827] leading-tight truncate">
              {active.ad.brand}
            </div>
            <div className="text-[9px] text-[#9ca3af] leading-tight">
              Sponsored
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#6d46c6] shrink-0">
            written by uplaud
          </span>
        </div>

        <div
          className={`relative aspect-[5/4] bg-gradient-to-br ${active.ad.gradient} overflow-hidden`}
        >
          <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/40 blur-2xl" />
          <div className="absolute -bottom-8 -right-4 w-28 h-28 rounded-full bg-white/40 blur-2xl" />
          {/* Center brand card */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[62%] h-[74%] rounded-[10px] bg-white/85 backdrop-blur-sm border border-white flex flex-col items-center justify-center gap-2 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)]">
              <AdIcon
                className="w-6 h-6 text-[#111827]"
                strokeWidth={1.5}
              />
              <div className="text-[10px] font-mono tracking-[0.22em] text-[#111827] font-semibold text-center px-2">
                {active.ad.title}
              </div>
              <div className="text-[8px] font-mono text-[#4b5563] tracking-widest text-center">
                {active.ad.subtitle}
              </div>
            </div>
          </div>
          {/* Rating pill */}
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white shadow-sm">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-2.5 h-2.5 fill-[#5eead4] text-[#5eead4]"
                strokeWidth={0}
              />
            ))}
            <span className="text-[9px] font-mono text-[#111827] ml-0.5">
              {active.ad.reviews}
            </span>
          </div>
          {/* Bottom review */}
          <div className="absolute bottom-3 inset-x-3 bg-white/95 backdrop-blur-sm rounded-lg p-2 border border-white shadow-sm">
            <p className="text-[10.5px] font-semibold leading-snug text-[#111827]">
              &ldquo;{active.ad.quote}&rdquo;
            </p>
            <p className="text-[9px] text-[#4b5563] mt-0.5">
              &mdash; {active.ad.quoteBy}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-3 text-[#111827]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </div>
          <span className="text-[10px] font-mono text-[#6d46c6]">
            {active.ad.lift}
          </span>
        </div>
      </div>

      {/* 3 · Referral — review → referral, dynamic */}
      <div
        data-testid="hero-card-referral"
        className="absolute top-[46%] left-[2%] w-[72%] bg-white border border-[#d9d1ee] rounded-2xl p-4 shadow-[0_25px_60px_-30px_rgba(38,28,77,0.35)]"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#6d46c6] text-white flex items-center justify-center">
            <MessageCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <div className="text-[11px] font-mono text-[#4b5563]">
            review &nbsp;&rarr;&nbsp; referral
          </div>
          <span className="ml-auto text-[10px] font-mono text-[#6d46c6]">
            campaigned by uplaud
          </span>
        </div>

        <div className="mt-3 rounded-lg bg-[#faf9ff] border border-[#eeeaf6] p-2.5">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-2.5 h-2.5 fill-[#5eead4] text-[#5eead4]"
                strokeWidth={0}
              />
            ))}
            <span className="text-[9.5px] text-[#9ca3af]">
              {active.referral.customerName}, {active.referral.customerRole}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-[#111827]">
            &ldquo;{active.referral.review}&rdquo;
          </p>
        </div>

        <div className="flex items-center gap-1.5 my-1.5 pl-2">
          <div className="w-[1px] h-3 bg-[#d9d1ee]" />
          <div className="text-[9px] font-mono uppercase tracking-widest text-[#6d46c6]">
            shared with a friend
          </div>
        </div>

        <div className="rounded-lg bg-[#f0fbf7] border border-[#c8f0e4] p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#25D366] text-white text-[8px] font-bold flex items-center justify-center">
              W
            </div>
            <span className="text-[10px] font-mono text-[#111827]">
              {active.referral.customerName} &rarr; {active.referral.friendName}
            </span>
            <span className="ml-auto text-[9px] text-[#4b5563]">2m ago</span>
          </div>
          <p
            className="mt-1.5 text-[11px] leading-snug text-[#111827]"
            dangerouslySetInnerHTML={{
              __html: `&ldquo;${active.referral.message}&rdquo;`,
            }}
          />
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[9.5px] font-mono text-[#4b5563]">
              {active.referral.link}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#5eead4] text-[#261c4d] text-[9px] font-mono font-semibold">
              {active.referral.offer}
            </span>
          </div>
        </div>
      </div>

      {/* 4 · ChatGPT / AI search — dynamic */}
      <div
        data-testid="hero-card-ai"
        className="absolute bottom-[0%] right-[0%] w-[60%] bg-[#261c4d] text-white rounded-2xl p-4 shadow-[0_25px_60px_-30px_rgba(38,28,77,0.7)]"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
            <Sparkles
              className="w-3.5 h-3.5 text-[#5eead4]"
              strokeWidth={2}
            />
          </div>
          <div className="text-[11px] font-mono text-white/60">
            AI search answer
          </div>
          <span className="ml-auto text-[10px] font-mono text-[#5eead4]">
            cited via uplaud
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-white/60 italic">
          {active.ai.query}
        </p>
        <p
          className="mt-2 text-[11.5px] leading-relaxed text-white/85"
          dangerouslySetInnerHTML={{
            __html: `&ldquo;${active.ai.answer.replace(
              active.ai.brand,
              `<span class="text-[#5eead4]">${active.ai.brand}</span>`
            )}&rdquo;`,
          }}
        />
      </div>
    </div>
  );
}
