import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowUpRight,
  MessageSquare,
  FileCheck,
  TrendingUp,
  Ghost,
} from "lucide-react";
import {
  PAGE_OUTCOMES,
  OPPORTUNITIES,
  VALUE_CHAIN,
  SMART_NBA,
  JOURNEY_STAGES,
} from "@/mocks/fintech";
import PageHero from "@/components/business/PageHero";

const OPP_ICONS = { MessageSquare, FileCheck, Sparkles, TrendingUp, Ghost };

export default function InsightsPage() {
  const outcome = PAGE_OUTCOMES.overview;

  return (
    <div data-testid="insights-page" className="space-y-14">
      <PageHero
        eyebrow={outcome.eyebrow}
        question="Where is Uplaud creating warm pipeline you weren't getting from paid?"
        subhead="Uplaud converts your existing demos, trials and customers into a compounding referral + amplification engine. Every stage below is a real, named person tracked in HubSpot."
        valueChain={VALUE_CHAIN}
        smartAction={SMART_NBA.overview}
      />

      {/* Where should I focus next */}
      <section data-testid="opportunities" className="space-y-6">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-[#111827]">
            Where should you focus next
          </h2>
          <span className="text-[12px] text-[#9ca3af]">
            Ranked by expected pipeline impact
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
      <section data-testid="growth-funnel" className="space-y-6">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-[#111827]">
            The PayRewards growth funnel
          </h2>
          <span className="text-[12px] text-[#9ca3af]">
            Meta + Google → Uplaud → Advocates · live from HubSpot
          </span>
        </div>
        <FunnelViz stages={JOURNEY_STAGES} />
      </section>
    </div>
  );
}

/* ─────────────── Sophisticated funnel viz ─────────────── */
function FunnelViz({ stages }) {
  const max = Math.max(...stages.map((s) => s.count));
  const minWidth = 30; // percent — never taper below this

  const phaseColor = {
    acquisition: "#c9b3ee",
    activation: "#8f66d8",
    pipeline: "#6d46c6",
    revenue: "#4a1f9a",
    advocacy: "#5eead4",
  };

  return (
    <div className="rounded-2xl border border-[#eeeaf6] bg-white p-8">
      <div className="grid grid-cols-12 gap-3 mb-3 text-[10px] font-mono uppercase tracking-[0.14em] text-[#9ca3af]">
        <div className="col-span-3">Stage</div>
        <div className="col-span-6 text-center">People at this stage</div>
        <div className="col-span-1 text-right">Δ</div>
        <div className="col-span-2">Opportunity</div>
      </div>
      <div className="space-y-2">
        {stages.map((s, i) => {
          const w = Math.max(minWidth, (s.count / max) * 100);
          const conversion =
            i > 0
              ? Math.round((s.count / stages[i - 1].count) * 100)
              : null;
          return (
            <div
              key={s.id}
              data-testid={`funnel-stage-${s.id}`}
              className="grid grid-cols-12 items-center gap-3 group"
            >
              {/* Stage label */}
              <div className="col-span-3 flex items-center gap-2">
                <div
                  className="w-1.5 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: phaseColor[s.phase] }}
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

              {/* Funnel bar — trapezoid via centered flex */}
              <div className="col-span-6">
                <div className="relative h-10 flex items-center justify-center">
                  <div
                    className="h-full rounded-md flex items-center justify-between px-4 transition-all"
                    style={{
                      width: `${w}%`,
                      backgroundColor: s.color,
                      color: i < 3 ? "#261c4d" : "#ffffff",
                    }}
                  >
                    <span className="text-[13px] font-mono font-semibold">
                      {s.count.toLocaleString()}
                    </span>
                    {conversion !== null && (
                      <span
                        className="text-[10px] font-mono opacity-70"
                        title="Conversion from previous stage"
                      >
                        {conversion}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Delta */}
              <div className="col-span-1 text-[11px] font-mono text-[#0f9b7c] text-right">
                {s.delta}
              </div>

              {/* Opportunity */}
              <div className="col-span-2 text-[11.5px] leading-tight">
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

      {/* Footer legend */}
      <div className="mt-6 pt-4 border-t border-[#eeeaf6] flex flex-wrap items-center gap-4 text-[11px] font-mono text-[#9ca3af]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#c9b3ee]" /> Acquisition
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#8f66d8]" /> Activation
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#6d46c6]" /> Pipeline
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#4a1f9a]" /> Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#5eead4]" /> Advocacy
        </span>
      </div>
    </div>
  );
}

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
            isMint
              ? "bg-[#ecfdf7] text-[#0f9b7c]"
              : "bg-[#f5f3ff] text-[#6d46c6]"
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
