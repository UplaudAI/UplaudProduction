const OUTCOMES = [
  {
    value: "-38%",
    label: "blended CAC",
    detail:
      "Across active pilot cohorts. Compounding by cohort as the Trust Graph grows.",
  },
  {
    value: "+2.6x",
    label: "creative ROAS",
    detail:
      "Story-native ad creative vs. generic performance benchmarks in your account.",
  },
  {
    value: "71%",
    label: "referral share rate",
    detail:
      "Of advocates surfaced by Uplaud send at least one qualified referral.",
  },
];

export default function Outcomes() {
  return (
    <section
      data-testid="outcomes-section"
      className="relative py-24 md:py-32 bg-[#faf7ff]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.15),transparent_60%)] pointer-events-none" />
      <div className="relative max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="max-w-2xl mb-14">
          <span className="section-label">
            06 &nbsp;/&nbsp; outcomes
          </span>
          <h2
            data-testid="outcomes-headline"
            className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.05] font-semibold tracking-tight text-[#0f0a1e]"
          >
            Growth that
            <br />
            <span className="text-violet-gradient">
              gets cheaper
            </span>{" "}
            as it scales.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-violet-100 border-y border-violet-100 bg-white rounded-2xl overflow-hidden">
          {OUTCOMES.map((o, i) => (
            <div
              key={i}
              data-testid={`outcome-${i}`}
              className="p-10 md:p-12"
            >
              <div className="font-display text-[64px] md:text-[88px] leading-none tracking-tight font-semibold text-violet-gradient">
                {o.value}
              </div>
              <div className="mt-4 font-mono text-[11px] uppercase tracking-widest text-[#4a3d63]">
                {o.label}
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[#4a3d63] max-w-xs">
                {o.detail}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[13px] text-[#4a3d63] max-w-xl">
          Reference metrics from Uplaud pilots. Your baseline improves the more
          the Trust Graph learns your customers, channels and moments.
        </p>
      </div>
    </section>
  );
}
