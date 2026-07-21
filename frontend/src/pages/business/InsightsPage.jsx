import { ArrowRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { PAGE_OUTCOMES, GROWTH_LOOPS } from "@/mocks/fintech";
import PageHero from "@/components/business/PageHero";

export default function InsightsPage() {
  const outcome = PAGE_OUTCOMES.overview;

  return (
    <div data-testid="insights-page" className="space-y-16">
      <PageHero
        eyebrow={outcome.eyebrow}
        question={outcome.question}
        northStar={outcome.northStar}
        action={outcome.action}
      />

      {/* Two growth loops */}
      <section className="space-y-6" data-testid="growth-loops">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[22px] font-semibold tracking-tight text-[#111827]">
            Two connected growth loops
          </h2>
          <span className="text-[12px] text-[#9ca3af]">
            One continuous flywheel
          </span>
        </div>

        <LoopCard
          testId="loop-pre-customer"
          data={GROWTH_LOOPS.preCustomer}
          accent="#6d46c6"
        />
        <LoopCard
          testId="loop-post-customer"
          data={GROWTH_LOOPS.postCustomer}
          accent="#5eead4"
          dark
        />
      </section>

      {/* Subtle explore link */}
      <div className="pt-4 border-t border-[#eeeaf6]">
        <a
          href="#"
          className="inline-flex items-center gap-2 text-[13px] text-[#4b5563] hover:text-[#6d46c6] transition-colors"
        >
          Explore attribution, channels & trends
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        </a>
      </div>
    </div>
  );
}

/* ─────────────── Loop Card ─────────────── */
function LoopCard({ data, accent, dark, testId }) {
  const bg = dark ? "bg-[#261c4d]" : "bg-white";
  const border = dark ? "border-white/10" : "border-[#eeeaf6]";
  const textPrimary = dark ? "text-white" : "text-[#111827]";
  const textSecondary = dark ? "text-white/60" : "text-[#4b5563]";
  const textMuted = dark ? "text-white/40" : "text-[#9ca3af]";
  const stageBg = dark ? "bg-white/[0.04]" : "bg-[#faf9ff]";
  const stageBorder = dark ? "border-white/10" : "border-[#eeeaf6]";

  return (
    <article
      data-testid={testId}
      className={`relative overflow-hidden rounded-3xl border ${border} ${bg} p-10 md:p-12 ${
        dark ? "noise" : ""
      }`}
    >
      {dark && (
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-[540px] h-[540px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(94,234,212,0.22), transparent 60%)",
          }}
        />
      )}

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left — title + revenue */}
        <div className="lg:col-span-5">
          <div
            className={`text-[11px] font-mono uppercase tracking-[0.22em] ${textMuted}`}
          >
            {data.title}
          </div>
          <p className={`mt-3 text-[14px] leading-relaxed ${textSecondary} max-w-[380px]`}>
            {data.subtitle}
          </p>

          <div className="mt-8">
            <div className={`text-[11px] font-mono uppercase tracking-[0.18em] ${textMuted}`}>
              {data.revenueLabel}
            </div>
            <div
              className={`mt-2 font-display font-semibold text-[52px] md:text-[64px] leading-[0.95] tracking-tight ${textPrimary}`}
            >
              {data.revenue}
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className={`text-[13px] font-mono ${textSecondary}`}>
                CAC <span className={textPrimary + " font-semibold"}>{data.cac}</span>
              </div>
              <div
                className="inline-flex items-center gap-1.5 text-[12px] font-mono text-[#5eead4]"
              >
                <TrendingUp className="w-3 h-3" strokeWidth={2} />
                {data.cacDelta}
              </div>
            </div>
          </div>
        </div>

        {/* Right — stage flow */}
        <div className="lg:col-span-7">
          <div
            className={`text-[11px] font-mono uppercase tracking-[0.18em] ${textMuted} mb-4`}
          >
            The loop
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {data.stages.map((s, i) => (
              <div
                key={s.label}
                className={`relative rounded-xl border ${stageBorder} ${stageBg} p-4`}
              >
                {/* Step number */}
                <div
                  className={`text-[10px] font-mono ${textMuted}`}
                >
                  0{i + 1}
                </div>
                <div
                  className={`mt-1 font-display font-semibold text-[22px] leading-none ${textPrimary}`}
                >
                  {s.value}
                </div>
                <div
                  className={`mt-2 text-[12px] leading-tight ${textPrimary} font-medium`}
                >
                  {s.label}
                </div>
                <div className={`mt-1 text-[10.5px] font-mono ${textMuted}`}>
                  {s.hint}
                </div>

                {/* Connector arrow — subtle */}
                {i < data.stages.length - 1 && i % 3 !== 2 && (
                  <div
                    className="hidden md:block absolute top-1/2 -translate-y-1/2 -right-2 z-10"
                    aria-hidden
                  >
                    <ArrowRight
                      className={`w-3 h-3 ${textMuted}`}
                      strokeWidth={1.75}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
