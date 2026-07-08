import { ArrowUpRight, ArrowDown } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative pt-32 md:pt-40 pb-20 md:pb-28 overflow-hidden"
    >
      {/* subtle grid backdrop */}
      <div className="absolute inset-0 grid-bg-light opacity-[0.5] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-[#10b981]/8 blur-3xl pointer-events-none" />

      <div className="relative max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="chip" data-testid="hero-eyebrow">
            <span className="dot" />
            Trust-powered acquisition · v1
          </span>
          <span className="hidden md:inline-flex section-label">
            for founders &amp; growth teams
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8">
            <h1
              data-testid="hero-headline"
              className="font-display text-[44px] leading-[1.02] sm:text-[64px] lg:text-[88px] font-medium tracking-tight text-[#0a0a0a]"
            >
              Turn customer trust
              <br />
              into a
              <span className="relative inline-block mx-3">
                <span className="relative z-10">compounding</span>
                <span className="absolute inset-x-0 bottom-1 h-3 bg-[#10b981]/40 -z-0" />
              </span>
              acquisition engine.
            </h1>

            <p
              data-testid="hero-subhead"
              className="mt-8 max-w-2xl text-[16px] md:text-[18px] leading-relaxed text-[#525252]"
            >
              Cold ads cost more every quarter. Uplaud AI builds a live Trust
              Graph from your reviews, referrals and customer stories — then
              feeds it into personalized outreach and smarter paid loops.
              Result: lower CAC, higher ROAS, growth that gets cheaper as it
              scales.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
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
                See how it works
                <ArrowDown className="w-4 h-4" strokeWidth={1.75} />
              </a>
            </div>

            <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 text-[13px] text-[#525252]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                Ingests reviews from Trustpilot, G2, Reddit, WeChat &amp; more
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a]" />
                Works alongside Meta, Google &amp; TikTok ad accounts
              </div>
            </div>
          </div>

          {/* Right side: conceptual data card cluster */}
          <div className="lg:col-span-4 relative">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div
      data-testid="hero-visual"
      className="relative w-full aspect-[4/5] lg:aspect-[3/4]"
    >
      {/* Card 1 */}
      <div className="absolute top-0 left-0 w-[74%] bg-white border border-black/10 rounded-sm p-5 shadow-[0_20px_60px_-30px_rgba(10,10,10,0.25)]">
        <div className="flex items-center justify-between">
          <span className="section-label">signal · review</span>
          <span className="text-[11px] font-mono text-[#10b981]">+92% intent</span>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-[#0a0a0a]">
          “Prep felt personal. My tutor even predicted my weak spots on
          reading comp before the mock.”
        </p>
        <div className="mt-4 flex items-center justify-between text-[11px] text-[#525252]">
          <span>— Aanya, admitted to UCLA</span>
          <span className="font-mono">trustpilot</span>
        </div>
      </div>

      {/* Card 2 */}
      <div className="absolute top-[38%] right-0 w-[68%] bg-[#0a0a0a] text-[#fdfdfb] border border-white/10 rounded-sm p-5 emerald-glow">
        <div className="flex items-center justify-between">
          <span className="section-label section-label-dark">trust graph</span>
          <span className="text-[11px] font-mono text-[#10b981]">
            cluster · sat-prep-parents
          </span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`h-6 rounded-sm ${
                i % 3 === 0 ? "bg-[#10b981]" : "bg-white/8"
              }`}
              style={{ opacity: i % 3 === 0 ? 0.9 : 0.5 }}
            />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-white/60">
          <span>7,431 stories · 24 themes</span>
          <span className="font-mono text-[#10b981]">-38% CAC</span>
        </div>
      </div>

      {/* Card 3 */}
      <div className="absolute bottom-0 left-[8%] w-[64%] bg-[#f4f4f0] border border-black/10 rounded-sm p-4">
        <div className="flex items-center justify-between text-[11px]">
          <span className="section-label">referral · one-click</span>
          <span className="font-mono text-[#525252]">3 friends</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {["MK", "RA", "JT"].map((s, i) => (
            <span
              key={s}
              className="w-7 h-7 rounded-full border border-black/10 bg-white text-[10px] font-mono flex items-center justify-center"
              style={{ marginLeft: i === 0 ? 0 : -8 }}
            >
              {s}
            </span>
          ))}
          <span className="ml-auto text-[11px] text-[#0a0a0a] font-mono">
            72% share rate
          </span>
        </div>
      </div>
    </div>
  );
}
