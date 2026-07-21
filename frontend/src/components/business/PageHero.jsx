import { useNavigate } from "react-router-dom";
import { ArrowUpRight, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

/**
 * PageHero — the outcome-first block that leads every business page.
 *
 * <PageHero
 *   eyebrow="Untapped Opportunities"
 *   question="Which people are your biggest untapped growth opportunities?"
 *   northStar={{ label, value, delta, trend: 'up'|'down-good', attribution }}
 *   action={{ title, impact, cta, to }}
 *   onAction={() => ...}     // optional override
 * />
 */
export default function PageHero({ eyebrow, question, northStar, action, onAction }) {
  const nav = useNavigate();
  const isDown = northStar?.trend?.startsWith("down");
  const TrendIcon = isDown ? TrendingDown : TrendingUp;

  return (
    <section
      data-testid="page-hero"
      className="pb-10 border-b border-[#eeeaf6] mb-12"
    >
      {/* Eyebrow */}
      <div
        data-testid="page-hero-eyebrow"
        className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#9ca3af]"
      >
        {eyebrow}
      </div>

      {/* Executive question — H1 */}
      <h1
        data-testid="page-hero-question"
        className="mt-4 font-display font-semibold tracking-tight text-[#111827] text-[32px] md:text-[44px] leading-[1.08] max-w-[880px]"
      >
        {question}
      </h1>

      {/* North Star + Action — side by side on desktop */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* North Star */}
        {northStar && (
          <div
            data-testid="page-hero-northstar"
            className="lg:col-span-7"
          >
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
              {northStar.label}
            </div>
            <div className="mt-3 flex items-baseline gap-4 flex-wrap">
              <div
                data-testid="page-hero-northstar-value"
                className="font-display font-semibold text-[#111827] text-[64px] md:text-[76px] leading-[0.95] tracking-tight"
              >
                {northStar.value}
              </div>
              {northStar.delta && (
                <div
                  className={`inline-flex items-center gap-1.5 text-[13px] font-mono ${
                    isDown || northStar.trend === "down-good"
                      ? "text-[#0f9b7c]"
                      : "text-[#0f9b7c]"
                  }`}
                >
                  <TrendIcon className="w-3.5 h-3.5" strokeWidth={2} />
                  {northStar.delta}
                </div>
              )}
            </div>
            {northStar.attribution && (
              <p className="mt-5 text-[15px] leading-relaxed text-[#4b5563] max-w-[520px]">
                {northStar.attribution}
              </p>
            )}
          </div>
        )}

        {/* Recommended action */}
        {action && (
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
                Next best action
              </div>
            </div>
            <div
              data-testid="page-hero-action-title"
              className="mt-3 font-display text-[17px] leading-[1.25] font-semibold text-[#111827]"
            >
              {action.title}
            </div>
            {action.impact && (
              <p className="mt-3 text-[12.5px] leading-relaxed text-[#4b5563]">
                {action.impact}
              </p>
            )}
            <button
              data-testid="page-hero-action-cta"
              onClick={() => {
                if (onAction) return onAction();
                if (action.to) nav(action.to);
              }}
              className="btn-primary mt-5 h-10 !py-0"
            >
              {action.cta}
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </aside>
        )}
      </div>
    </section>
  );
}
