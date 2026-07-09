import { ArrowUpRight, Star, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden bg-white"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[560px] pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(109,70,198,0.10), transparent 70%), radial-gradient(40% 40% at 90% 20%, rgba(94,234,212,0.18), transparent 70%)",
        }}
      />

      <div className="relative max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="chip" data-testid="hero-eyebrow">
            <span className="dot" />
            You pay for the click. Your customer pays attention to the review.
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <h1
              data-testid="hero-headline"
              className="font-display text-[46px] leading-[0.98] sm:text-[62px] lg:text-[78px] font-semibold tracking-tight text-[#111827]"
            >
              You spend on ads.
              <br />
              They decide on{" "}
              <span className="mint-underline">reviews.</span>
            </h1>

            <p
              data-testid="hero-subhead"
              className="mt-8 max-w-xl text-[17px] md:text-[18px] leading-[1.55] text-[#4b5563]"
            >
              Every buyer today checks Reddit, reads reviews, and asks ChatGPT
              before they check out. Uplaud plugs the trust they find there
              directly into the ads, referrals, sales follow-ups and AI-search
              results you already spend on &mdash; so the whole funnel finally
              works together.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#demo"
                data-testid="hero-book-demo-btn"
                className="btn-primary"
              >
                Book a demo
                <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
              </a>
              <a
                href="#how"
                data-testid="hero-see-how-btn"
                className="btn-secondary"
              >
                See the flywheel
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-[#4b5563]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6d46c6]" />
                Works inside Meta, Google, TikTok
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5eead4]" />
                Feeds Reddit, X, ChatGPT & Perplexity
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
 * Product-clarity visual: three stacked mockups showing Uplaud in action.
 *  1. A Reddit answer surfacing a real customer testimonial
 *  2. A Meta ad using a 5-star customer story as creative
 *  3. A ChatGPT / AI-search answer citing the brand
 */
function HeroVisual() {
  return (
    <div
      data-testid="hero-visual"
      className="relative w-full aspect-[4/5] lg:aspect-[3/3.5]"
    >
      <div className="absolute inset-4 rounded-[28px] bg-gradient-to-br from-[#ecfdf7] via-white to-[#f5f3ff] border border-[#eeeaf6]" />

      {/* Reddit answer card */}
      <div className="absolute top-2 left-1 w-[80%] bg-white border border-[#eeeaf6] rounded-2xl p-4 shadow-[0_25px_60px_-30px_rgba(38,28,77,0.35)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#ff4500] text-white text-[10px] font-bold flex items-center justify-center">
            r/
          </div>
          <div className="text-[11px] font-mono text-[#4b5563]">
            r/skincareaddiction
          </div>
          <span className="ml-auto text-[10px] font-mono text-[#6d46c6]">
            surfaced by uplaud
          </span>
        </div>
        <p className="mt-2 text-[12px] text-[#111827] leading-relaxed">
          &ldquo;Anyone tried the vitamin C serum? Worth it?&rdquo;
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
              verified customer
            </span>
          </div>
          <p className="mt-1.5 text-[11.5px] text-[#111827] leading-snug">
            &ldquo;Cleared my hyperpigmentation in 3 weeks. Only thing that
            worked after 5 products.&rdquo;
          </p>
        </div>
      </div>

      {/* Meta ad card */}
      <div className="absolute top-[38%] right-1 w-[74%] bg-white border border-[#eeeaf6] rounded-2xl p-4 shadow-[0_25px_60px_-30px_rgba(38,28,77,0.35)]">
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

      {/* ChatGPT answer card */}
      <div className="absolute bottom-1 left-4 w-[78%] bg-[#261c4d] text-white rounded-2xl p-4 shadow-[0_25px_60px_-30px_rgba(38,28,77,0.7)]">
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
        <p className="mt-2 text-[11.5px] leading-relaxed text-white/85">
          &ldquo;Users consistently rate this brand 4.8/5, citing fast results
          on hyperpigmentation and dryness &mdash; per 3,200+ verified
          reviews.&rdquo;
        </p>
      </div>
    </div>
  );
}
