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
      className="relative w-full aspect-[3/4] lg:aspect-[3/4.1]"
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

      {/* 2 · Meta ad — skincare */}
      <div
        data-testid="hero-card-ad"
        className="absolute top-[24%] right-[0%] w-[70%] bg-white border border-[#eeeaf6] rounded-2xl p-4 shadow-[0_25px_60px_-30px_rgba(38,28,77,0.35)]"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#1877f2] text-white text-[10px] font-bold flex items-center justify-center">
            f
          </div>
          <div className="text-[11px] font-mono text-[#4b5563]">Sponsored</div>
          <span className="ml-auto text-[10px] font-mono text-[#6d46c6]">
            written by uplaud
          </span>
        </div>
        <p className="mt-3 text-[13px] leading-snug font-semibold text-[#111827]">
          &ldquo;Cleared my hyperpigmentation in 3 weeks.&rdquo;
        </p>
        <p className="mt-1 text-[11.5px] text-[#4b5563]">
          Real 5-star review, now your best-performing ad.
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-full bg-[#111827] text-white text-[10px] font-semibold">
            Shop now
          </span>
          <span className="font-mono text-[10px] text-[#6d46c6]">
            +2.6x CTR
          </span>
        </div>
      </div>

      {/* 3 · Referral campaign — pet grooming */}
      <div
        data-testid="hero-card-referral"
        className="absolute top-[49%] left-[3%] w-[74%] bg-[#faf9ff] border border-[#d9d1ee] rounded-2xl p-4 shadow-[0_25px_60px_-30px_rgba(38,28,77,0.35)]"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#25D366] text-white flex items-center justify-center">
            <MessageCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <div className="text-[11px] font-mono text-[#4b5563]">
            referral · sent
          </div>
          <span className="ml-auto text-[10px] font-mono text-[#6d46c6]">
            sent by uplaud
          </span>
        </div>
        <div className="mt-3 rounded-lg bg-white border border-[#eeeaf6] p-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#6d46c6] text-white text-[9px] font-bold flex items-center justify-center">
              P
            </div>
            <span className="text-[11px] font-semibold text-[#111827]">
              Priya
            </span>
            <span className="text-[10px] text-[#9ca3af]">to Anaya</span>
          </div>
          <p className="mt-2 text-[11.5px] leading-snug text-[#111827]">
            &ldquo;Anaya! You asked where I get Milo groomed &mdash;
            <span className="font-semibold text-[#6d46c6]">
              {" "}
              Poodles &amp; Pals
            </span>{" "}
            in Bandra. Best cuts, super gentle. My referral link:&rdquo;
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#4b5563]">
              uplaud.co/poodles-priya
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#5eead4] text-[#261c4d] text-[9px] font-mono font-semibold">
              20% off both
            </span>
          </div>
        </div>
      </div>

      {/* 4 · ChatGPT — EB5 immigration */}
      <div
        data-testid="hero-card-ai"
        className="absolute bottom-[1%] right-[2%] w-[72%] bg-[#261c4d] text-white rounded-2xl p-4 shadow-[0_25px_60px_-30px_rgba(38,28,77,0.7)]"
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
