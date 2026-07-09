const OUTCOMES = [
  {
    value: "2.6x",
    label: "paid CAC efficiency",
    detail: "When ads run on trust-driven creative and audiences.",
  },
  {
    value: "-38%",
    label: "cost per new customer",
    detail: "Blended across referrals, warm leads and smarter paid.",
  },
  {
    value: "71%",
    label: "of advocates refer",
    detail: "Of the customers Uplaud identifies, most send at least one.",
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
        <div className="max-w-3xl mb-14">
          <span className="section-label section-label-dark">
            04 / the flywheel
          </span>
          <h2
            data-testid="outcomes-headline"
            className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.02] font-semibold tracking-tight"
          >
            The more trust in,
            <br />
            <span className="text-[#5eead4]">the more growth out.</span>
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/65">
            Every new customer story feeds the flywheel: more trust, more
            referrals, more warm leads, sharper ad creative, better lookalikes.
            Growth that compounds every quarter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {OUTCOMES.map((o, i) => (
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
                {o.detail}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-[12px] text-white/40 max-w-2xl">
          Reference metrics from Uplaud pilot customers. Your baseline improves
          as more of your trust data flows into the engine.
        </p>
      </div>
    </section>
  );
}
