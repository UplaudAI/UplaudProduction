import { useNavigate } from "react-router-dom";
import { ArrowUpRight, TrendingUp, Sparkles, ChevronRight } from "lucide-react";

/**
 * PageHero — outcome-first block that leads every business page.
 *
 * Layout:
 *   [Eyebrow]
 *   <H1 question>
 *   [Optional: short outcome subhead]
 *   Below (grid): [ValueChain or NorthStar]  ·  [Intelligent NBA]
 */
export default function PageHero({
  eyebrow,
  question,
  subhead,
  valueChain,       // optional — the horizontal chain viz
  northStar,        // {label, value, delta, trend, attribution}
  smartAction,      // {eyebrow, headline, reasoning:[{label,value}], outcome, cta, to}
  action,           // legacy simple action (backwards-compat)
  onAction,
}) {
  const nav = useNavigate();

  return (
    <section
      data-testid="page-hero"
      className="pb-8 border-b border-[#eeeaf6] mb-12"
    >
      <div
        data-testid="page-hero-eyebrow"
        className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#9ca3af]"
      >
        {eyebrow}
      </div>

      <h1
        data-testid="page-hero-question"
        className="mt-4 font-display font-semibold tracking-tight text-[#111827] text-[30px] md:text-[40px] leading-[1.08] max-w-[880px]"
      >
        {question}
      </h1>

      {subhead && (
        <p className="mt-4 text-[15px] leading-relaxed text-[#4b5563] max-w-[640px]">
          {subhead}
        </p>
      )}

      {/* Metric + Action grid */}
      {(valueChain || northStar || smartAction || action) && (
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left — metric or value chain */}
          <div className="lg:col-span-7 space-y-6">
            {valueChain && <ValueChain data={valueChain} />}
            {!valueChain && northStar && <NorthStarBlock data={northStar} />}
          </div>

          {/* Right — intelligent NBA */}
          {(smartAction || action) && (
            <SmartActionCard
              data={smartAction || null}
              legacy={!smartAction ? action : null}
              onAction={onAction}
              nav={nav}
            />
          )}
        </div>
      )}
    </section>
  );
}

/* ────── Value Chain ────── */
function ValueChain({ data }) {
  return (
    <div data-testid="value-chain" className="space-y-3">
      <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
        The Uplaud value chain · this month
      </div>
      <div className="rounded-2xl border border-[#eeeaf6] bg-white overflow-hidden">
        {/* Chain rail */}
        <div className="relative px-6 pt-8 pb-6">
          {/* Connector line */}
          <div
            className="absolute left-6 right-6 top-[54px] h-[2px] bg-gradient-to-r from-[#e2d9f5] via-[#8f66d8] to-[#5eead4] rounded-full"
            aria-hidden
          />
          <div className="relative grid grid-cols-6 gap-2">
            {data.stages.map((s, i) => (
              <button
                key={s.id}
                data-testid={`chain-${s.id}`}
                className="group flex flex-col items-center text-center focus:outline-none"
              >
                {/* Node */}
                <div className="relative z-10">
                  <div
                    className="w-8 h-8 rounded-full bg-white border-[2px] flex items-center justify-center font-mono text-[10px] font-semibold group-hover:scale-110 transition-transform"
                    style={{
                      borderColor:
                        i <= 2
                          ? "#8f66d8"
                          : i <= 4
                            ? "#6d46c6"
                            : "#5eead4",
                      color:
                        i <= 2
                          ? "#8f66d8"
                          : i <= 4
                            ? "#6d46c6"
                            : "#0f9b7c",
                    }}
                  >
                    {i + 1}
                  </div>
                </div>
                {/* Value */}
                <div className="mt-4 font-display font-semibold text-[28px] leading-none text-[#111827]">
                  {s.value}
                </div>
                <div className="mt-2 text-[11px] font-semibold text-[#111827] leading-tight px-1">
                  {s.label}
                </div>
                <div className="mt-1 text-[10px] font-mono text-[#9ca3af] leading-tight px-1">
                  {s.subline}
                </div>
                {/* Conversion badge */}
                {i > 0 && s.conversionFromPrev && s.conversionFromPrev !== "—" && (
                  <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-mono text-[#6d46c6] bg-[#f5f3ff] border border-[#e2d9f5] rounded-full px-2 py-0.5">
                    <span aria-hidden>↳</span>
                    {s.conversionFromPrev}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Outcome bar */}
        <div className="px-6 py-5 bg-[#faf9ff] border-t border-[#eeeaf6] flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
              {data.outcome.label}
            </div>
            <div className="mt-1 flex items-baseline gap-3">
              <div className="font-display font-semibold text-[32px] leading-none text-[#111827]">
                {data.outcome.value}
              </div>
              <div className="text-[12px] text-[#4b5563]">
                {data.outcome.subline}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
              Blended CAC
            </div>
            <div className="mt-1 flex items-baseline gap-2 justify-end">
              <span className="font-display font-semibold text-[22px] leading-none text-[#0f9b7c]">
                {data.outcome.cac}
              </span>
              <span className="text-[11px] font-mono text-[#9ca3af] line-through">
                {data.outcome.cacBaseline}
              </span>
            </div>
            <div className="mt-1 text-[10.5px] font-mono text-[#0f9b7c]">
              {data.outcome.cacDelta}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────── North Star fallback ────── */
function NorthStarBlock({ data }) {
  const isDown = data.trend?.startsWith("down");
  const trendColor = "text-[#0f9b7c]";
  return (
    <div data-testid="page-hero-northstar">
      <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
        {data.label}
      </div>
      <div className="mt-3 flex items-baseline gap-4 flex-wrap">
        <div
          data-testid="page-hero-northstar-value"
          className="font-display font-semibold text-[#111827] text-[60px] md:text-[72px] leading-[0.95] tracking-tight"
        >
          {data.value}
        </div>
        {data.delta && (
          <div className={`inline-flex items-center gap-1.5 text-[13px] font-mono ${trendColor}`}>
            <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
            {data.delta}
          </div>
        )}
      </div>
      {data.attribution && (
        <p className="mt-5 text-[14px] leading-relaxed text-[#4b5563] max-w-[520px]">
          {data.attribution}
        </p>
      )}
    </div>
  );
}

/* ────── Intelligent NBA card ────── */
function SmartActionCard({ data, legacy, onAction, nav }) {
  if (!data && !legacy) return null;

  const handle = () => {
    if (onAction) return onAction();
    if (data?.to) nav(data.to);
    if (legacy?.to) nav(legacy.to);
  };

  return (
    <aside
      data-testid="page-hero-action"
      className="lg:col-span-5 rounded-2xl bg-[#faf9ff] border border-[#eeeaf6] p-6"
    >
      <div className="flex items-center gap-2">
        <Sparkles
          className="w-3.5 h-3.5 text-[#6d46c6]"
          strokeWidth={1.75}
        />
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#6d46c6]">
          {data?.eyebrow || "Next best action"}
        </div>
      </div>

      <div
        data-testid="page-hero-action-title"
        className="mt-3 font-display text-[16px] leading-[1.3] font-semibold text-[#111827]"
      >
        {data?.headline || legacy?.title}
      </div>

      {data?.reasoning && (
        <ul className="mt-4 space-y-2">
          {data.reasoning.map((r, i) => (
            <li
              key={i}
              data-testid={`nba-reason-${i}`}
              className="flex items-start gap-2 text-[12px] leading-snug"
            >
              <ChevronRight
                className="w-3 h-3 text-[#6d46c6] mt-1 shrink-0"
                strokeWidth={2}
              />
              <div>
                <span className="text-[#111827] font-medium">{r.label}:</span>{" "}
                <span className="text-[#4b5563]">{r.value}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(data?.outcome || legacy?.impact) && (
        <p className="mt-4 pt-4 border-t border-[#eeeaf6] text-[12.5px] leading-relaxed text-[#4b5563]">
          {data?.outcome || legacy?.impact}
        </p>
      )}

      <button
        data-testid="page-hero-action-cta"
        onClick={handle}
        className="btn-primary mt-5 h-10 !py-0"
      >
        {data?.cta || legacy?.cta}
        <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
      </button>
    </aside>
  );
}
