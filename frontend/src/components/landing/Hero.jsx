import { ArrowUpRight, ArrowDown, MessageCircle } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative pt-28 md:pt-36 pb-20 md:pb-28 overflow-hidden"
    >
      {/* Halo & grid backdrop */}
      <div className="absolute inset-0 violet-halo opacity-90 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-light opacity-40 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white via-white/60 to-transparent pointer-events-none" />

      <div className="relative max-w-[1240px] mx-auto px-6 md:px-10">
        {/* Problem-first eyebrow */}
        <div className="flex flex-wrap items-center gap-3 mb-6" data-testid="hero-eyebrow">
          <span className="chip">
            <span className="dot" />
            CAC up 60%. ROAS down 30%. Your ads are quietly bleeding.
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7">
            {/* Small pain-lead line above H1 */}
            <p
              data-testid="hero-pain-lead"
              className="font-display text-[16px] md:text-[17px] font-medium tracking-tight text-[#6d28d9] uppercase mb-4"
            >
              Dear growth-obsessed founder,
            </p>

            <h1
              data-testid="hero-headline"
              className="font-display text-[42px] leading-[1.02] sm:text-[58px] lg:text-[74px] font-semibold tracking-tight text-[#0f0a1e]"
            >
              You&apos;re spending{" "}
              <span className="text-violet-shine">$2 to earn $1</span> on cold
              ads. Your happiest customers can fix that.
            </h1>

            <p
              data-testid="hero-subhead"
              className="mt-7 max-w-2xl text-[16px] md:text-[18px] leading-relaxed text-[#4a3d63]"
            >
              Uplaud is the only trust-powered growth engine that captures
              authentic reviews on WhatsApp, turns them into one-click
              personalized referrals, and feeds real trust signals back into
              your paid ads. Lower CAC, higher ROAS, and pre-sold customers
              landing in your inbox in under 30 days.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#demo"
                data-testid="hero-book-demo-btn"
                className="btn-primary"
              >
                Book a 20-min demo
                <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
              </a>
              <a
                href="#pain"
                data-testid="hero-see-how-btn"
                className="btn-secondary"
              >
                See why cold ads stopped working
                <ArrowDown className="w-4 h-4" strokeWidth={1.75} />
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-[#4a3d63]">
              <div className="flex items-center gap-2">
                <MessageCircle
                  className="w-4 h-4 text-[#7c3aed]"
                  strokeWidth={1.75}
                />
                Native WhatsApp capture, 50+ languages
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
                Plugs into Meta, Google &amp; TikTok ad accounts
              </div>
            </div>
          </div>

          {/* Right: WhatsApp-style conceptual visual */}
          <div className="lg:col-span-5 relative">
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
      {/* Big violet glow behind */}
      <div className="absolute inset-8 rounded-[40px] bg-gradient-to-br from-[#a78bfa]/40 via-[#7c3aed]/20 to-transparent blur-2xl pointer-events-none" />

      {/* Card 1 – WhatsApp review */}
      <div className="absolute top-0 left-0 w-[78%] bg-white border border-violet-100 rounded-2xl p-4 shadow-[0_25px_60px_-25px_rgba(109,40,217,0.4)]">
        <div className="flex items-center gap-2 pb-3 border-b border-violet-50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#6d28d9] flex items-center justify-center text-white text-[12px] font-semibold">
            U
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-[#0f0a1e]">
              Uplaud on WhatsApp
            </div>
            <div className="text-[10px] text-[#4a3d63]">
              5 stars &nbsp;·&nbsp; just now
            </div>
          </div>
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-[#0f0a1e]">
          &ldquo;Prep felt personal. My tutor even predicted my weak spots on
          reading comp before the mock. Cannot recommend enough.&rdquo;
        </p>
        <div className="mt-3 flex items-center justify-between text-[10.5px] text-[#4a3d63]">
          <span>Aanya · admitted to UCLA</span>
          <span className="font-mono text-[#7c3aed]">+100 pts</span>
        </div>
      </div>

      {/* Card 2 – Trust cluster / signal card (dark) */}
      <div className="absolute top-[40%] right-0 w-[70%] bg-[#0b0616] text-[#fdfbff] border border-violet-500/30 rounded-2xl p-4 violet-glow">
        <div className="flex items-center justify-between">
          <span className="section-label section-label-dark">
            trust cluster
          </span>
          <span className="text-[10.5px] font-mono text-[#a78bfa]">
            sat-prep parents
          </span>
        </div>
        <div className="mt-3 grid grid-cols-6 gap-1.5">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className={`h-5 rounded-md ${
                i % 3 === 0 ? "bg-[#7c3aed]" : "bg-white/8"
              }`}
              style={{ opacity: i % 3 === 0 ? 0.95 : 0.4 }}
            />
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px] text-white/60">
          <span>7,431 stories · 24 themes</span>
          <span className="font-mono text-[#c4b5fd]">-38% CAC</span>
        </div>
      </div>

      {/* Card 3 – Referral share */}
      <div className="absolute bottom-0 left-[6%] w-[66%] bg-[#faf7ff] border border-violet-100 rounded-2xl p-4">
        <div className="flex items-center justify-between text-[11px]">
          <span className="section-label">1-click referral</span>
          <span className="font-mono text-[#4a3d63]">3 friends</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          {["MK", "RA", "JT"].map((s, i) => (
            <span
              key={s}
              className="w-7 h-7 rounded-full border border-violet-200 bg-white text-[10px] font-mono flex items-center justify-center text-[#6d28d9]"
              style={{ marginLeft: i === 0 ? 0 : -8 }}
            >
              {s}
            </span>
          ))}
          <span className="ml-auto text-[11px] text-[#6d28d9] font-mono font-semibold">
            72% share rate
          </span>
        </div>
      </div>
    </div>
  );
}
