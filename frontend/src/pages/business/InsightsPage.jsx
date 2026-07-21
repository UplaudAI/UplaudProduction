import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowUpRight,
  MessageSquare,
  FileCheck,
  TrendingUp,
  Ghost,
  Target,
  ArrowRight,
} from "lucide-react";
import {
  PAGE_OUTCOMES,
  OPPORTUNITIES,
  JOURNEY_STAGES,
  CHANNEL_ATTRIBUTION,
} from "@/mocks/fintech";
import PageHero from "@/components/business/PageHero";

const OPP_ICONS = { MessageSquare, FileCheck, Sparkles, TrendingUp, Ghost };

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

      {/* Where should I focus next */}
      <section data-testid="opportunities" className="space-y-6">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-[#111827]">
            Where should you focus next
          </h2>
          <span className="text-[12px] text-[#9ca3af]">
            {OPPORTUNITIES.length} opportunities ranked by expected impact
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {OPPORTUNITIES.slice(0, 2).map((op) => (
            <OpportunityCard key={op.id} op={op} large />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {OPPORTUNITIES.slice(2).map((op) => (
            <OpportunityCard key={op.id} op={op} />
          ))}
        </div>
      </section>

      {/* PayRewards growth funnel */}
      <section
        data-testid="growth-funnel"
        className="rounded-2xl border border-[#eeeaf6] bg-white p-8"
      >
        <div className="flex items-baseline gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#6d46c6]" strokeWidth={1.75} />
            <h2 className="font-display text-[18px] font-semibold text-[#111827]">
              The PayRewards growth funnel
            </h2>
          </div>
          <span className="ml-auto text-[10.5px] font-mono text-[#9ca3af] uppercase tracking-[0.14em]">
            Meta + Google → Uplaud → Advocates
          </span>
        </div>
        <p className="text-[12.5px] text-[#4b5563] mb-8">
          Every stage is an activation opportunity — not just a metric. All
          counts pulled live from HubSpot + Uplaud activation logs.
        </p>

        <JourneyFunnel stages={JOURNEY_STAGES} />
      </section>

      {/* Channel attribution */}
      <section
        data-testid="channel-attribution"
        className="rounded-2xl border border-[#eeeaf6] bg-white p-8"
      >
        <div className="flex items-baseline gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#6d46c6]" strokeWidth={1.75} />
            <h2 className="font-display text-[18px] font-semibold text-[#111827]">
              Channel attribution
            </h2>
          </div>
          <span className="ml-auto text-[10.5px] font-mono text-[#9ca3af] uppercase tracking-[0.14em]">
            Multi-touch · attributed via UTM + HubSpot
          </span>
        </div>
        <p className="text-[12.5px] text-[#4b5563] mb-6">
          How Uplaud-sourced channels compare to your paid baseline. Every won
          deal is traceable to source records in HubSpot.
        </p>

        <div className="space-y-2">
          {CHANNEL_ATTRIBUTION.map((row, i) => (
            <AttributionRow key={row.channel} row={row} baseline={i === CHANNEL_ATTRIBUTION.length - 1} />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─────────────── Opportunity card ─────────────── */
function OpportunityCard({ op, large }) {
  const nav = useNavigate();
  const Icon = OPP_ICONS[op.icon] || Sparkles;
  const isHigh = op.priority === "high";
  const isMint = op.tone === "mint";

  return (
    <button
      data-testid={`opp-${op.id}`}
      onClick={() => op.ctaPath && nav(op.ctaPath)}
      className={`w-full text-left rounded-2xl border border-[#eeeaf6] bg-white p-6 hover:border-[#d9d1ee] transition-colors group ${
        large ? "min-h-[176px]" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isMint ? "bg-[#ecfdf7] text-[#0f9b7c]" : "bg-[#f5f3ff] text-[#6d46c6]"
          }`}
        >
          <Icon className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#9ca3af]">
              {op.stage}
            </span>
            {isHigh && (
              <span className="text-[9.5px] font-mono text-[#e35b3a] bg-[#fef3f0] border border-[#f5d5cc] rounded-full px-1.5 py-0.5 uppercase">
                high
              </span>
            )}
          </div>
          <div
            className={`mt-1.5 font-display font-semibold text-[#111827] leading-tight ${
              large ? "text-[17px]" : "text-[14px]"
            }`}
          >
            {op.title}
          </div>
          <p className="mt-1.5 text-[12.5px] text-[#4b5563] leading-relaxed">
            {op.subtitle}
          </p>
          {large && (
            <div className="mt-3 text-[11.5px] font-mono text-[#6d46c6]">
              {op.impact}
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#6d46c6] group-hover:text-[#261c4d] transition-colors">
          {op.cta}
        </span>
        <ArrowUpRight
          className="w-4 h-4 text-[#9ca3af] group-hover:text-[#6d46c6] transition-colors"
          strokeWidth={1.75}
        />
      </div>
    </button>
  );
}

/* ─────────────── Growth funnel ─────────────── */
function JourneyFunnel({ stages }) {
  const max = Math.max(...stages.map((s) => s.count));
  const phaseColors = {
    acquisition: "#d9c9f2",
    activation: "#8f66d8",
    pipeline: "#5b32b2",
    revenue: "#4a1f9a",
    advocacy: "#5eead4",
  };

  return (
    <div className="space-y-2.5">
      {stages.map((s, i) => {
        const pct = Math.max(6, (s.count / max) * 100);
        return (
          <div
            key={s.id}
            data-testid={`funnel-stage-${s.id}`}
            className="grid grid-cols-12 items-center gap-3"
          >
            <div className="col-span-3 flex items-center gap-2">
              <span
                className="w-1 h-8 rounded-full shrink-0"
                style={{ backgroundColor: phaseColors[s.phase] }}
              />
              <div>
                <div className="text-[12.5px] font-medium text-[#111827] leading-tight">
                  {s.label}
                </div>
                <div className="text-[10px] font-mono text-[#9ca3af] mt-0.5">
                  {s.hint}
                </div>
              </div>
            </div>

            <div className="col-span-6">
              <div className="h-8 rounded-lg bg-[#faf9ff] relative overflow-hidden">
                <div
                  className="h-full rounded-lg flex items-center px-3 transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: s.color,
                    color: i < 3 ? "#261c4d" : "#ffffff",
                  }}
                >
                  <span className="text-[12px] font-mono font-semibold">
                    {s.count.toLocaleString()}
                  </span>
                </div>
                {s.opportunity && (
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <span className="text-[10.5px] font-mono text-[#111827] bg-[#5eead4] rounded-full px-2 py-0.5">
                      opportunity
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-1 text-[11px] font-mono text-[#0f9b7c] text-right">
              {s.delta}
            </div>

            <div className="col-span-2 text-[11.5px] text-[#4b5563] leading-tight">
              {s.opportunity ? (
                <span className="text-[#6d46c6] font-medium">
                  {s.opportunityText}
                </span>
              ) : (
                <span className="text-[#9ca3af]">—</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────── Channel attribution row ─────────────── */
function AttributionRow({ row, baseline }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        baseline
          ? "border-[#eeeaf6] bg-[#faf9ff]"
          : "border-[#eeeaf6] bg-white hover:bg-[#faf9ff]"
      } transition-colors`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-[#111827]">
            {row.channel}
          </div>
          <div className="mt-1 text-[11px] font-mono text-[#4b5563]">
            Touches {row.touches.toLocaleString()} · Won {row.converted}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-[16px] font-semibold text-[#111827] leading-none">
            {row.revenue}
          </div>
          <div
            className={`mt-1 text-[11px] font-mono ${
              baseline ? "text-[#9ca3af]" : "text-[#0f9b7c]"
            }`}
          >
            CAC {row.cac}
          </div>
        </div>
      </div>
    </div>
  );
}
