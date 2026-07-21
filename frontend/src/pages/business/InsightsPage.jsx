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
