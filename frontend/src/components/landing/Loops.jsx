import { Users, Zap, ArrowRight } from "lucide-react";

const LOOPS = [
  {
    key: "organic",
    icon: Users,
    label: "loop 01",
    title: "Organic referral loop",
    subtitle: "Direct CAC reduction",
    bullets: [
      "Happy customers turn into personalized, one-click referrers",
      "AI agents warm the referral before your sales team sees it",
      "Referred buyers arrive pre-sold — with the highest LTV",
    ],
    metric: "-38%",
    metricLabel: "blended CAC",
  },
  {
    key: "paid",
    icon: Zap,
    label: "loop 02",
    title: "Smarter paid growth loop",
    subtitle: "Paid CAC efficiency",
    bullets: [
      "Retarget the friends and lookalikes surfaced by the Trust Graph",
      "Ship ad creative built from real, high-converting customer stories",
      "Attribute paid conversions back to the trust signals that drove them",
    ],
    metric: "+2.6x",
    metricLabel: "creative lift",
    accent: true,
  },
];

export default function Loops() {
  return (
    <section
      data-testid="loops-section"
      className="relative py-24 md:py-32 bg-[#0a0a0a] text-[#fdfdfb] border-b border-white/5"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="max-w-2xl mb-14">
          <span className="section-label section-label-dark">
            03 / the two loops
          </span>
          <h2
            data-testid="loops-headline"
            className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.05] font-medium tracking-tight"
          >
            One trust graph.
            <br />
            Two acquisition loops.
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-white/60">
            Uplaud drives growth in parallel — through the customers who love
            you, and through the ad platforms you already spend on.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {LOOPS.map((l) => (
            <div
              key={l.key}
              data-testid={`loop-${l.key}`}
              className={`relative overflow-hidden rounded-sm border p-8 ${
                l.accent
                  ? "border-[#10b981]/40 bg-gradient-to-br from-[#10b981]/[0.08] to-transparent"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 border rounded-sm flex items-center justify-center ${
                      l.accent
                        ? "border-[#10b981]/50 text-[#10b981]"
                        : "border-white/15 text-white"
                    }`}
                  >
                    <l.icon className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <span className="font-mono text-[11px] text-white/50 uppercase tracking-widest">
                    {l.label}
                  </span>
                </div>
                <div className="text-right">
                  <div
                    className={`font-display text-[30px] leading-none tracking-tight ${
                      l.accent ? "text-[#10b981]" : "text-[#fdfdfb]"
                    }`}
                  >
                    {l.metric}
                  </div>
                  <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/50">
                    {l.metricLabel}
                  </div>
                </div>
              </div>

              <h3 className="mt-10 font-display text-[28px] tracking-tight">
                {l.title}
              </h3>
              <div className="mt-1 text-[13px] text-white/50">{l.subtitle}</div>

              <ul className="mt-6 space-y-3">
                {l.bullets.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-[14px] leading-relaxed text-white/75"
                  >
                    <ArrowRight
                      className={`w-4 h-4 mt-1 shrink-0 ${
                        l.accent ? "text-[#10b981]" : "text-white/40"
                      }`}
                      strokeWidth={1.75}
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
