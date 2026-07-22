import { Users, Zap, ArrowRight } from "lucide-react";

const LOOPS = [
  {
    key: "organic",
    icon: Users,
    label: "loop 01",
    title: "Organic referral loop",
    subtitle: "Direct CAC reduction",
    bullets: [
      "Happy customers turn into personalized, one-click referrers on WhatsApp",
      "AI agents warm the referral before your sales team ever sees it",
      "Referred buyers arrive pre-sold, with the highest LTV in your book",
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
      className="relative py-24 md:py-32 bg-[#14092a] text-[#fdfbff] border-b border-violet-500/10"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.12),transparent_60%)] pointer-events-none" />
      <div className="relative max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="max-w-2xl mb-14">
          <span className="section-label section-label-dark">
            04 &nbsp;/&nbsp; the two loops
          </span>
          <h2
            data-testid="loops-headline"
            className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.05] font-semibold tracking-tight"
          >
            One trust graph.
            <br />
            <span className="text-violet-shine">Two acquisition loops.</span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-white/60">
            Uplaud drives growth in parallel, through the customers who love
            you and through the ad platforms you already spend on.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {LOOPS.map((l) => (
            <div
              key={l.key}
              data-testid={`loop-${l.key}`}
              className={`relative overflow-hidden rounded-2xl border p-8 ${
                l.accent
                  ? "border-[#7c3aed]/50 bg-gradient-to-br from-[#7c3aed]/[0.12] via-[#7c3aed]/[0.04] to-transparent"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 border rounded-full flex items-center justify-center ${
                      l.accent
                        ? "border-[#a78bfa]/50 text-[#c4b5fd] bg-[#7c3aed]/20"
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
                    className={`font-display text-[32px] leading-none tracking-tight font-semibold ${
                      l.accent ? "text-violet-shine" : "text-[#fdfbff]"
                    }`}
                  >
                    {l.metric}
                  </div>
                  <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/50">
                    {l.metricLabel}
                  </div>
                </div>
              </div>

              <h3 className="mt-10 font-display text-[28px] tracking-tight font-semibold">
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
                        l.accent ? "text-[#a78bfa]" : "text-white/40"
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
