import { ArrowUpRight, Star, Sparkles, MessageCircle } from "lucide-react";

export default function Hero() {
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
              Get more customers.
              <br />
              Spend less on{" "}
              <span className="mint-underline">Ads.</span>
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

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-[#4b5563]">
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
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Product-clarity visual: four stacked mockups showing Uplaud in action
 * across FOUR verticals (SAT prep, skincare, pet grooming, immigration).
 *  1. Reddit answer          — SAT prep
 *  2. Meta ad                — Skincare
 *  3. Referral campaign      — Pet grooming
 *  4. ChatGPT / AI answer    — Immigration (EB5)
 */
function HeroVisual() {
  return (
    <div
      data-testid="hero-visual"
      className="relative w-full aspect-[3/4.8] lg:aspect-[3/5]"
    >
      <div className="absolute inset-4 rounded-[28px] bg-gradient-to-br from-[#ecfdf7] via-white to-[#f5f3ff] border border-[#eeeaf6]" />

      {/* 1 · Reddit — SAT prep */}
      <div
        data-testid="hero-card-reddit"
        className="absolute top-[1%] left-[0%] w-[74%] bg-white border border-[#eeeaf6] rounded-2xl p-4 shadow-[0_25px_60px_-30px_rgba(38,28,77,0.35)]"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#ff4500] text-white text-[10px] font-bold flex items-center justify-center">
            r/
          </div>
          <div className="text-[11px] font-mono text-[#4b5563]">
            r/APStudents
          </div>
          <span className="ml-auto text-[10px] font-mono text-[#6d46c6]">
            surfaced by uplaud
          </span>
        </div>
        <p className="mt-2 text-[12px] text-[#111827] leading-relaxed">
          &ldquo;Best SAT prep for high schoolers targeting 1500+?&rdquo;
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
              verified parent
            </span>
          </div>
          <p className="mt-1.5 text-[11.5px] text-[#111827] leading-snug">
            &ldquo;My daughter went from 1290 to 1520 in 6 weeks. Personalised
            practice was the difference.&rdquo;
          </p>
        </div>
      </div>

      {/* 2 · Instagram ad — skincare */}
      <div
        data-testid="hero-card-ad"
        className="absolute top-[18%] right-[0%] w-[58%] bg-white border border-[#eeeaf6] rounded-2xl overflow-hidden shadow-[0_25px_60px_-30px_rgba(38,28,77,0.35)]"
      >
        {/* IG-style header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#eeeaf6]">
          <div className="w-6 h-6 rounded-full p-[1.5px] bg-[conic-gradient(from_180deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5,#feda75)]">
            <div className="w-full h-full rounded-full bg-white p-[1.5px]">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#f9c9c1] to-[#ecb7ac]" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] font-semibold text-[#111827] leading-tight">
              glowskin.co
            </div>
            <div className="text-[9px] text-[#9ca3af] leading-tight">
              Sponsored
            </div>
          </div>
          <span className="text-[10px] font-mono text-[#6d46c6]">
            written by uplaud
          </span>
        </div>

        {/* IG visual — abstract product shot */}
        <div className="relative aspect-[5/4] bg-gradient-to-br from-[#fde5df] via-[#f6c8bd] to-[#e8a597] overflow-hidden">
          {/* Soft blobs */}
          <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/40 blur-2xl" />
          <div className="absolute -bottom-8 -right-4 w-28 h-28 rounded-full bg-[#f7d4c8]/70 blur-2xl" />
          {/* Faux product bottle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[38%] h-[62%] rounded-[10px] bg-gradient-to-b from-[#fff5f0] via-[#ffe7dc] to-[#f2c0b0] shadow-[inset_0_-8px_20px_rgba(0,0,0,0.08),0_10px_30px_-10px_rgba(0,0,0,0.15)]">
              <div className="absolute top-0 inset-x-3 h-[10%] rounded-t-[10px] bg-[#111827]" />
              <div className="absolute top-[18%] inset-x-2 flex flex-col items-center gap-1">
                <div className="text-[8px] font-mono tracking-[0.2em] text-[#111827]/70">
                  GLOW
                </div>
                <div className="w-8 h-[1px] bg-[#111827]/25" />
                <div className="text-[6.5px] font-mono text-[#111827]/50">
                  VIT-C SERUM
                </div>
              </div>
              <div className="absolute bottom-[18%] inset-x-3 h-[3px] rounded-full bg-[#111827]/10" />
            </div>
          </div>
          {/* Review overlay pill */}
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white shadow-sm">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-2.5 h-2.5 fill-[#5eead4] text-[#5eead4]"
                strokeWidth={0}
              />
            ))}
            <span className="text-[9px] font-mono text-[#111827] ml-0.5">
              3,214
            </span>
          </div>
          {/* Bottom review quote */}
          <div className="absolute bottom-3 inset-x-3 bg-white/95 backdrop-blur-sm rounded-lg p-2 border border-white shadow-sm">
            <p className="text-[10.5px] font-semibold leading-snug text-[#111827]">
              &ldquo;Cleared my hyperpigmentation in 3 weeks.&rdquo;
            </p>
            <p className="text-[9px] text-[#4b5563] mt-0.5">
              — real 5-star customer
            </p>
          </div>
        </div>

        {/* IG action row */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-3 text-[#111827]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </div>
          <span className="text-[10px] font-mono text-[#6d46c6]">
            +2.6x CTR
          </span>
        </div>
      </div>

      {/* 3 · Referral campaign — review turned into a referral for pet grooming */}
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

        {/* Source review */}
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
              Priya, verified customer
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-[#111827]">
            &ldquo;Poodles &amp; Pals gave Milo the softest cut. Gentle,
            patient staff, no anxious pup!&rdquo;
          </p>
        </div>

        {/* Arrow connector */}
        <div className="flex items-center gap-1.5 my-1.5 pl-2">
          <div className="w-[1px] h-3 bg-[#d9d1ee]" />
          <div className="text-[9px] font-mono uppercase tracking-widest text-[#6d46c6]">
            shared with a friend
          </div>
        </div>

        {/* Personalized referral */}
        <div className="rounded-lg bg-[#f0fbf7] border border-[#c8f0e4] p-2.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-[#25D366] text-white text-[8px] font-bold flex items-center justify-center">
              W
            </div>
            <span className="text-[10px] font-mono text-[#111827]">
              Priya &rarr; Anaya
            </span>
            <span className="ml-auto text-[9px] text-[#4b5563]">2m ago</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-[#111827]">
            &ldquo;Anaya! You asked about groomers &mdash; I actually just
            reviewed{" "}
            <span className="font-semibold text-[#6d46c6]">
              Poodles &amp; Pals
            </span>
            . Milo loved them. Here&apos;s $20 off your first cut:&rdquo;
          </p>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[9.5px] font-mono text-[#4b5563]">
              uplaud.co/pnp-priya
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#5eead4] text-[#261c4d] text-[9px] font-mono font-semibold">
              $20 off
            </span>
          </div>
        </div>
      </div>

      {/* 4 · ChatGPT — EB5 immigration */}
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
          Best immigration lawyer for EB-5?
        </p>
        <p className="mt-2 text-[11.5px] leading-relaxed text-white/85">
          &ldquo;For EB-5 investor visas, users consistently name{" "}
          <span className="text-[#5eead4]">Sethi &amp; Roy Law</span> as top
          choice, citing 400+ approved petitions and clear fee structure.&rdquo;
        </p>
      </div>
    </div>
  );
}
