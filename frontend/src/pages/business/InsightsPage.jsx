import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Users,
  Mic,
  FileCheck,
  Megaphone,
  Ghost,
  MessageSquare,
  Target,
  DollarSign,
  Star,
  Zap,
  Radio,
} from "lucide-react";
import {
  BRAND,
  JOURNEY_STAGES,
  OPPORTUNITIES,
  KPIS,
  CHANNEL_ATTRIBUTION,
  TREND_30D,
} from "@/mocks/fintech";

const OPP_ICONS = {
  MessageSquare,
  FileCheck,
  Sparkles,
  TrendingUp,
  Ghost,
};

const KPI_CARDS = [
  { id: "interactionsCaptured", label: "Interactions captured", icon: Radio },
  { id: "storiesApproved", label: "Stories approved", icon: FileCheck },
  { id: "warmIntros", label: "Warm introductions", icon: Users },
  { id: "postsPublished", label: "Posts amplified", icon: Megaphone },
  { id: "attributedPipeline", label: "Attributed pipeline", icon: DollarSign },
  { id: "cacUplift", label: "CAC vs paid baseline", icon: Target },
];

export default function InsightsPage() {
  return (
    <div data-testid="insights-page" className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="chip">
            <span className="dot" />
            Growth Engine · {BRAND.company}
          </span>
          <h1 className="font-display text-[32px] leading-[1.05] font-semibold tracking-tight text-[#111827] mt-3 max-w-[720px]">
            Turn every meaningful interaction into the{" "}
            <span className="mint-underline">next growth opportunity</span>.
          </h1>
          <p className="text-[14px] text-[#4b5563] mt-3 max-w-[640px] leading-relaxed">
            Sitting on top of your paid acquisition — activating demo attendees,
            trial users, and happy customers into stories, warm intros and
            pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            data-testid="insights-timerange"
            className="h-10 px-4 rounded-full border border-[#eeeaf6] bg-white text-[13px] text-[#4b5563] focus:outline-none focus:border-[#d9d1ee]"
          >
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 90 days</option>
            <option>QTD</option>
          </select>
          <button
            data-testid="insights-share-btn"
            className="btn-secondary h-10 !py-0"
          >
            Share report
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* WHERE TO FOCUS NEXT — actionable opportunity cards */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#4b5563]">
            Where should I focus next
          </div>
          <div className="h-px flex-1 bg-[#eeeaf6]" />
          <span className="text-[11px] font-mono text-[#9ca3af]">
            {OPPORTUNITIES.length} opportunities
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

      {/* JOURNEY FUNNEL — the spine */}
      <section className="rounded-2xl border border-[#eeeaf6] bg-white p-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-[#6d46c6]" strokeWidth={1.75} />
          <div className="text-[13px] font-display font-semibold text-[#111827]">
            The PayRewards growth funnel
          </div>
          <span className="ml-auto text-[10.5px] font-mono text-[#9ca3af]">
            Meta + Google → Uplaud → Advocates
          </span>
        </div>
        <p className="text-[12.5px] text-[#4b5563] mb-6">
          Every stage is an activation opportunity, not just a metric.
        </p>

        <JourneyFunnel stages={JOURNEY_STAGES} />
      </section>

      {/* KPI GRID */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPI_CARDS.map((c) => (
          <KpiCard key={c.id} card={c} data={KPIS[c.id]} />
        ))}
      </section>

      {/* Trend + Attribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border border-[#eeeaf6] bg-white p-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#6d46c6]" strokeWidth={1.75} />
            <div className="text-[13px] font-display font-semibold text-[#111827]">
              Trust-driven pipeline · 30 days
            </div>
            <span className="ml-auto text-[11px] font-mono text-[#0f9b7c]">
              +42% vs prior 30d
            </span>
          </div>
          <p className="text-[12.5px] text-[#4b5563] mb-5">
            Daily prospects engaged after a review-sourced touchpoint.
          </p>
          <TrendChart data={TREND_30D} />
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-[#eeeaf6] bg-white p-6">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-[#6d46c6]" strokeWidth={1.75} />
            <div className="text-[13px] font-display font-semibold text-[#111827]">
              Channel attribution
            </div>
          </div>
          <p className="text-[12px] text-[#9ca3af] mb-4">
            Multi-touch model · Uplaud channels vs paid baseline
          </p>
          <div className="space-y-3">
            {CHANNEL_ATTRIBUTION.map((row, i) => (
              <ChannelRow key={row.channel} row={row} highlight={i < 4} />
            ))}
          </div>
        </div>
      </div>

      {/* Executive recommendation */}
      <div className="rounded-2xl bg-[#261c4d] text-white p-6 relative overflow-hidden noise">
        <div
          aria-hidden
          className="absolute -top-24 -right-16 w-[420px] h-[420px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(94,234,212,0.2), transparent 60%)",
          }}
        />
        <div className="relative flex items-start gap-6 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            <span className="chip chip-dark">
              <Sparkles className="w-3.5 h-3.5 text-[#5eead4]" strokeWidth={2} />
              Executive recommendation
            </span>
            <div className="mt-4 font-display text-[22px] leading-[1.15] font-semibold max-w-[620px]">
              Activation, not acquisition, is your{" "}
              <span className="text-[#5eead4]">biggest ROI lever</span> this quarter.
            </div>
            <p className="mt-3 text-[13px] text-white/70 max-w-[620px]">
              Your paid engine drives 48k clicks/mo. Activating just 40% of
              demo attendees who currently go silent projects <b className="text-white">$412k of new pipeline</b>{" "}
              at 1/6th the CAC of a Meta lookalike.
            </p>
          </div>
          <button
            data-testid="apply-recommendation-btn"
            className="btn-mint h-11 !py-0 self-center"
          >
            Activate demo attendees
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Opportunity Card ─────────────── */
function OpportunityCard({ op, large }) {
  const nav = useNavigate();
  const Icon = OPP_ICONS[op.icon] || Sparkles;
  const isHigh = op.priority === "high";
  const isMint = op.tone === "mint";

  return (
    <button
      data-testid={`opp-${op.id}`}
      onClick={() => nav(op.ctaPath)}
      className={`w-full text-left rounded-2xl border p-5 transition-all group ${
        large
          ? "hover:border-[#6d46c6] hover:bg-white"
          : "hover:border-[#d9d1ee]"
      } ${
        isHigh
          ? "border-[#e2d9f5] bg-white"
          : "border-[#eeeaf6] bg-white"
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
            className={`mt-1 font-display font-semibold text-[#111827] leading-tight ${
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

/* ─────────────── Journey Funnel ─────────────── */
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
        const pct = Math.max(4, (s.count / max) * 100);
        return (
          <div
            key={s.id}
            data-testid={`funnel-stage-${s.id}`}
            className="grid grid-cols-12 items-center gap-3"
          >
            {/* Phase pill */}
            <div className="col-span-2 flex items-center gap-1.5">
              <span
                className="w-1 h-6 rounded-full shrink-0"
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

            {/* Bar */}
            <div className="col-span-7">
              <div className="h-8 rounded-lg bg-[#faf9ff] relative overflow-hidden">
                <div
                  className="h-full rounded-lg flex items-center justify-end px-3 transition-all"
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

            {/* Delta */}
            <div className="col-span-1 text-[11px] font-mono text-[#0f9b7c] text-right">
              {s.delta}
            </div>

            {/* Opportunity CTA */}
            <div className="col-span-2 text-[11.5px] text-[#4b5563]">
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

/* ─────────────── KPI Card ─────────────── */
function KpiCard({ card, data }) {
  const isDown = data.trend?.startsWith("down");
  const TrendIcon = isDown ? TrendingDown : TrendingUp;
  const trendColor =
    data.trend === "down-good" || data.trend === "up"
      ? "text-[#0f9b7c]"
      : "text-[#b91c1c]";

  return (
    <div
      data-testid={`kpi-${card.id}`}
      className="rounded-2xl border border-[#eeeaf6] bg-white p-4"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] text-[#6d46c6] flex items-center justify-center">
          <card.icon className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#9ca3af] leading-tight">
          {card.label}
        </div>
      </div>
      <div className="mt-3 font-display text-[22px] font-semibold text-[#111827] leading-none">
        {data.value}
      </div>
      <div className={`mt-2 text-[11px] font-mono flex items-center gap-1 ${trendColor}`}>
        <TrendIcon className="w-3 h-3" strokeWidth={2} />
        {data.delta}
      </div>
    </div>
  );
}

/* ─────────────── Channel Row ─────────────── */
function ChannelRow({ row, highlight }) {
  return (
    <div className="rounded-xl border border-[#eeeaf6] bg-[#faf9ff] p-3">
      <div className="flex items-center gap-3">
        <div className="text-[12.5px] font-medium text-[#111827] flex-1 min-w-0">
          {row.channel}
        </div>
        <div className="text-[13px] font-display font-semibold text-[#111827]">
          {row.revenue}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px] font-mono text-[#4b5563]">
        <span>Touches {row.touches.toLocaleString()}</span>
        <span>Won {row.converted}</span>
        <span
          className={
            highlight ? "text-[#0f9b7c] font-semibold" : "text-[#9ca3af]"
          }
        >
          CAC {row.cac}
        </span>
      </div>
    </div>
  );
}

/* ─────────────── Trend chart (SVG) ─────────────── */
function TrendChart({ data }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 40;
  const step = width / (data.length - 1);

  const pts = data.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  const linePath = "M " + pts.join(" L ");
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-[180px]"
        data-testid="trend-chart"
      >
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6d46c6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6d46c6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#grad)" />
        <path
          d={linePath}
          fill="none"
          stroke="#6d46c6"
          strokeWidth="0.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#9ca3af]">
        <span>Jan 14</span>
        <span>Feb 12</span>
      </div>
    </div>
  );
}
