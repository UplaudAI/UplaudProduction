const OUTCOMES = [
  { value: "3x", label: "more reviews collected" },
  { value: "-38%", label: "cost per new customer" },
  { value: "71%", label: "of advocates refer a friend" },
];

export default function Outcomes() {
  return (
    <section
      id="results"
      data-testid="outcomes-section"
      className="relative py-24 md:py-32 bg-[#261c4d] text-white"
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
            04 / results
          </span>
          <h2
            data-testid="outcomes-headline"
            className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.02] font-semibold tracking-tight"
          >
            Growth that gets
            <br />
            <span className="text-[#5eead4]">cheaper every month.</span>
          </h2>
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
              <div className="mt-6 text-[13px] text-white/70">{o.label}</div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-[12px] text-white/45 max-w-xl">
          Averages across Uplaud pilot customers in education, healthcare,
          legal and pet care.
        </p>
      </div>
    </section>
  );
}
