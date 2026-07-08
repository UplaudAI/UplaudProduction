import { TrendingUp, Snowflake, Wallet } from "lucide-react";

const STATS = [
  {
    icon: TrendingUp,
    stat: "+60%",
    label: "Paid CAC over the last 5 years",
    detail: "The auction is more crowded than ever, and every vertical feels it.",
  },
  {
    icon: Snowflake,
    stat: "$2 : $1",
    label: "Spend-to-revenue ratio on cold acquisition",
    detail: "Cold ads start at zero trust. Every impression is a re-introduction.",
  },
  {
    icon: Wallet,
    stat: "-30%",
    label: "ROAS decline in the last 24 months",
    detail: "Attribution is fuzzier, iOS killed signal, and creatives fatigue fast.",
  },
];

export default function PainPoint() {
  return (
    <section
      data-testid="pain-point-section"
      className="relative py-24 md:py-32 bg-[#fdfdfb] border-b border-black/5"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <span className="section-label">01 / the problem</span>
            <h2
              data-testid="pain-headline"
              className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.02] font-medium tracking-tight"
            >
              Paid acquisition
              <br />
              is quietly
              <span className="italic font-normal"> breaking</span>.
            </h2>
            <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-[#525252]">
              You&apos;re paying more to reach people who trust you less. The old
              playbook — buy impressions, retarget, repeat — leaks money at every
              step. Meanwhile the highest converting channel you own is sitting
              dormant in your review data.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATS.map((s, idx) => (
              <div
                key={idx}
                data-testid={`pain-stat-${idx}`}
                className="border border-black/10 rounded-sm p-6 bg-[#fdfdfb] hover:bg-[#f4f4f0] transition-colors duration-200 group"
              >
                <s.icon
                  className="w-5 h-5 text-[#10b981] mb-8"
                  strokeWidth={1.5}
                />
                <div className="font-display text-[44px] leading-none tracking-tight">
                  {s.stat}
                </div>
                <div className="mt-3 text-[13px] font-medium text-[#0a0a0a]">
                  {s.label}
                </div>
                <div className="mt-2 text-[12px] leading-relaxed text-[#525252]">
                  {s.detail}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-black/5 flex flex-wrap items-center justify-between gap-4">
          <p className="font-display text-[22px] md:text-[26px] tracking-tight text-[#0a0a0a] max-w-2xl">
            &ldquo;I love spending more and more money on ads.&rdquo;
            <span className="text-[#525252]"> — No founder, ever.</span>
          </p>
          <span className="section-label">source: every board meeting</span>
        </div>
      </div>
    </section>
  );
}
