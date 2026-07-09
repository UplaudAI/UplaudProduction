import { ArrowUpRight, Sparkles } from "lucide-react";

const SOURCES = [
  "Trustpilot",
  "G2",
  "Shopify",
  "Reddit",
  "Instagram",
  "CRM",
  "WhatsApp",
];

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
            The trust engine for modern acquisition
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <h1
              data-testid="hero-headline"
              className="font-display text-[46px] leading-[0.98] sm:text-[64px] lg:text-[82px] font-semibold tracking-tight text-[#111827]"
            >
              Turn customer trust
              <br />
              into your{" "}
              <span className="mint-underline">#1 acquisition channel</span>.
            </h1>

            <p
              data-testid="hero-subhead"
              className="mt-8 max-w-xl text-[17px] md:text-[18px] leading-[1.55] text-[#4b5563]"
            >
              Uplaud pulls trust signals from every corner of your business
              &mdash; reviews, referrals, testimonials, social, CRM &mdash;
              structures them with AI, and activates them across ads,
              referrals, sales and social. Growth that compounds every quarter,
              not fades.
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

            <div className="mt-10">
              <div className="section-label mb-3">
                Pulls trust from
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {SOURCES.map((v, i) => (
                  <span
                    key={v}
                    data-testid={`hero-source-${i}`}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium border border-[#eeeaf6] bg-[#faf9ff] text-[#4b5563]"
                  >
                    {v}
                  </span>
                ))}
                <span className="px-3 py-1.5 rounded-full text-[12px] font-medium border border-[#eeeaf6] bg-white text-[#9ca3af]">
                  + 20 more
                </span>
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

function HeroVisual() {
  return (
    <div
      data-testid="hero-visual"
      className="relative w-full aspect-[4/5] lg:aspect-[3/3.4]"
    >
      <div className="absolute inset-6 rounded-[28px] bg-gradient-to-br from-[#ecfdf7] via-white to-[#f5f3ff] border border-[#eeeaf6]" />

      {/* Card 1 – multi-source ingest */}
      <div className="absolute top-2 left-1 w-[80%] bg-white border border-[#eeeaf6] rounded-2xl p-4 shadow-[0_25px_60px_-30px_rgba(38,28,77,0.35)]">
        <div className="flex items-center justify-between">
          <span className="section-label">trust in · today</span>
          <span className="text-[10px] font-mono text-[#6d46c6]">+312</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          {[
            ["Trustpilot", "84"],
            ["Shopify", "67"],
            ["Reddit", "44"],
            ["Instagram", "58"],
            ["CRM emails", "39"],
            ["WhatsApp", "20"],
          ].map(([s, n]) => (
            <div
              key={s}
              className="flex items-center justify-between border border-[#eeeaf6] rounded-lg px-2.5 py-1.5 bg-[#faf9ff]"
            >
              <span className="text-[#4b5563]">{s}</span>
              <span className="font-mono font-semibold text-[#111827]">
                {n}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Card 2 – AI agent action */}
      <div className="absolute top-[46%] right-1 w-[76%] bg-[#261c4d] text-white rounded-2xl p-4 shadow-[0_25px_60px_-30px_rgba(38,28,77,0.7)]">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <div className="w-7 h-7 rounded-full bg-[#5eead4]/15 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#5eead4]" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold">Uplaud Agent</div>
            <div className="text-[9.5px] text-white/50 font-mono">
              acquisition · autopilot
            </div>
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-white/85">
          Spotted <span className="text-[#5eead4]">7 story-driven ads</span>{" "}
          outperforming benchmark. Ready to launch a lookalike campaign to
          2.1K high-intent buyers?
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-[#5eead4] text-[#261c4d] text-[10px] font-semibold">
            Approve
          </span>
          <span className="px-2.5 py-1 rounded-full border border-white/20 text-white/70 text-[10px]">
            Tweak
          </span>
        </div>
      </div>

      {/* Card 3 – flywheel counter */}
      <div className="absolute bottom-4 left-6 bg-white border border-[#eeeaf6] rounded-2xl px-4 py-3 shadow-[0_15px_40px_-20px_rgba(38,28,77,0.35)]">
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#4b5563]">
          flywheel · Q3
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-display text-[22px] font-semibold text-[#111827]">
            2.6x
          </span>
          <span className="text-[11px] text-[#4b5563]">CAC efficiency</span>
        </div>
      </div>
    </div>
  );
}
