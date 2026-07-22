import { TrendingUp, ArrowUpRight } from "lucide-react";

const RESULTS = [
  {
    value: "2.6x",
    label: "paid CAC efficiency",
    body: "When ads run on real customer stories, not agency copy.",
  },
  {
    value: "-38%",
    label: "cost per new customer",
    body: "Blended across referrals, warm leads and smarter paid.",
  },
  {
    value: "71%",
    label: "of advocates refer",
    body: "Of the customers Uplaud identifies, most send at least one.",
  },
];

export default function Outcomes() {
  return (
    <section
      id="results"
      data-testid="outcomes-section"
      className="relative py-24 md:py-32 bg-[#261c4d] text-white overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 20%, rgba(94,234,212,0.14), transparent 70%)",
        }}
      />

      <div className="relative max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end mb-12 md:mb-16">
          <div className="lg:col-span-7">
            <span className="section-label section-label-dark">
              04 / results
            </span>
            <h2
              data-testid="outcomes-headline"
              className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.02] font-semibold tracking-tight"
            >
              Every spin makes
              <br />
              your CAC{" "}
              <span className="text-[#5eead4]">cheaper.</span>
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-[15px] leading-relaxed text-white/65">
              Cold acquisition gets more expensive every quarter. Trust-driven
              acquisition gets cheaper. That gap is the whole thesis.
            </p>
          </div>
        </div>

        {/* Compounding curve */}
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 mb-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-white/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af]" />
              cold acquisition · cost per customer
              <span className="mx-3">|</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#5eead4]" />
              uplaud · cost per customer
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-white/45">
              12 months
              <TrendingUp className="w-3.5 h-3.5 text-[#5eead4]" strokeWidth={2} />
            </div>
          </div>
          <svg
            data-testid="results-chart"
            viewBox="0 0 800 200"
            preserveAspectRatio="none"
            className="w-full h-[180px] md:h-[220px]"
          >
            {/* baseline grid */}
            {[0, 1, 2, 3].map((i) => (
              <line
                key={i}
                x1="0"
                x2="800"
                y1={40 + i * 40}
                y2={40 + i * 40}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
            ))}
            {/* Cold acquisition — rising */}
            <path
              d="M 0 140 C 120 130, 240 120, 360 105 S 600 60, 800 30"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Uplaud — falling */}
            <path
              d="M 0 130 C 140 130, 260 140, 380 150 S 620 178, 800 185"
              fill="none"
              stroke="#5eead4"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* End dots */}
            <circle cx="800" cy="30" r="4" fill="#9ca3af" />
            <circle cx="800" cy="185" r="4.5" fill="#5eead4" />
          </svg>
          <div className="mt-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-white/40">
            <span>month 0</span>
            <span>month 12</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RESULTS.map((o, i) => (
            <div
              key={i}
              data-testid={`outcome-${i}`}
              className="border border-white/10 rounded-2xl p-8 bg-white/[0.03]"
            >
              <div className="font-display text-[72px] md:text-[84px] leading-[0.9] tracking-tight font-semibold text-[#5eead4]">
                {o.value}
              </div>
              <div className="mt-6 text-[13px] font-mono uppercase tracking-widest text-white/70">
                {o.label}
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-white/60 max-w-xs">
                {o.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[12px] text-white/40 max-w-2xl">
            Reference metrics from Uplaud pilots. Your baseline improves as
            more trust flows into the wheel.
          </p>
          <a
            href="#demo"
            data-testid="results-cta"
            className="btn-primary btn-mint"
          >
            Start your flywheel
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
          </a>
        </div>
      </div>
    </section>
  );
}
