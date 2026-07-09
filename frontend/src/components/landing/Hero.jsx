import { ArrowUpRight, Star, MessageCircle } from "lucide-react";

const VERTICALS = [
  "Education",
  "Doctors & clinics",
  "Law firms",
  "Pet care",
];

export default function Hero() {
  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden bg-white"
    >
      {/* soft brand halo */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[520px] pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(109,70,198,0.10), transparent 70%), radial-gradient(40% 40% at 90% 20%, rgba(94,234,212,0.16), transparent 70%)",
        }}
      />

      <div className="relative max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="chip" data-testid="hero-eyebrow">
            <span className="dot" />
            Built for education, healthcare, legal &amp; pet care
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <h1
              data-testid="hero-headline"
              className="font-display text-[46px] leading-[0.98] sm:text-[64px] lg:text-[84px] font-semibold tracking-tight text-[#111827]"
            >
              More reviews.
              <br />
              More referrals.
              <br />
              <span className="mint-underline">More customers.</span>
            </h1>

            <p
              data-testid="hero-subhead"
              className="mt-8 max-w-xl text-[17px] md:text-[18px] leading-[1.55] text-[#4b5563]"
            >
              Uplaud turns your happiest patients, parents, clients and pet
              parents into your best growth channel. Reviews on WhatsApp.
              Referrals in one tap. New customers on autopilot.
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
                See how it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-2">
              {VERTICALS.map((v, i) => (
                <span
                  key={v}
                  data-testid={`hero-vertical-${i}`}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium border border-[#eeeaf6] bg-[#faf9ff] text-[#4b5563]"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Visual */}
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
      {/* Mint background card */}
      <div className="absolute inset-6 rounded-[28px] bg-gradient-to-br from-[#ecfdf7] via-white to-[#f5f3ff] border border-[#eeeaf6]" />

      {/* WhatsApp review card */}
      <div className="absolute top-4 left-2 w-[78%] bg-white border border-[#eeeaf6] rounded-2xl p-4 shadow-[0_25px_60px_-30px_rgba(38,28,77,0.35)]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#6d46c6] flex items-center justify-center text-white text-[13px] font-semibold">
            U
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-[#111827]">
              WhatsApp review
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="w-3 h-3 fill-[#5eead4] text-[#5eead4]"
                  strokeWidth={0}
                />
              ))}
              <span className="text-[10px] text-[#9ca3af] ml-1">just now</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-[#111827]">
          &ldquo;Dr. Mehta&apos;s clinic is a game changer. Kind staff, no
          wait, and my daughter actually likes going. Highly recommend!&rdquo;
        </p>
        <div className="mt-3 flex items-center justify-between text-[11px] text-[#4b5563]">
          <span>Priya · patient</span>
          <span className="font-mono text-[#6d46c6]">+100 pts</span>
        </div>
      </div>

      {/* Referral card */}
      <div className="absolute top-[44%] right-3 w-[70%] bg-[#261c4d] text-white rounded-2xl p-4 shadow-[0_25px_60px_-30px_rgba(38,28,77,0.7)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-widest text-white/60">
            1-click referral
          </span>
          <span className="text-[10px] font-mono text-[#5eead4]">
            sent to 3
          </span>
        </div>
        <div className="mt-3 flex items-center">
          {["MK", "RA", "JT"].map((s, i) => (
            <span
              key={s}
              className="w-8 h-8 rounded-full bg-white text-[#261c4d] text-[10px] font-semibold flex items-center justify-center border-2 border-[#261c4d]"
              style={{ marginLeft: i === 0 ? 0 : -10 }}
            >
              {s}
            </span>
          ))}
          <span className="ml-auto text-[12px] font-semibold text-[#5eead4]">
            72% share rate
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-[11px] text-white/60">
          <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
          Personalized on WhatsApp
        </div>
      </div>

      {/* Small badge card bottom */}
      <div className="absolute bottom-6 left-8 bg-white border border-[#eeeaf6] rounded-2xl px-4 py-3 shadow-[0_15px_40px_-20px_rgba(38,28,77,0.35)]">
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#4b5563]">
          this month
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-display text-[22px] font-semibold text-[#111827]">
            +248
          </span>
          <span className="text-[11px] text-[#4b5563]">new reviews</span>
        </div>
      </div>
    </div>
  );
}
