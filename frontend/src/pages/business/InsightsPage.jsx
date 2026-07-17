import {
  Star,
  Megaphone,
  Users,
  Ghost,
  DollarSign,
  Target,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { KPIS, FUNNEL, CHANNEL_ATTRIBUTION, TREND_30D } from "@/mocks/fintech";

const KPI_CARDS = [
  { id: "reviewsImported", label: "Reviews imported", icon: Star, tone: "purple" },
  { id: "postsPublished", label: "Posts published", icon: Megaphone, tone: "purple" },
  { id: "referralsSent", label: "Referrals sent", icon: Users, tone: "mint" },
  { id: "redditReplies", label: "Reddit replies", icon: Ghost, tone: "purple" },
  { id: "attributedRevenue", label: "Attributed revenue", icon: DollarSign, tone: "mint" },
  { id: "cac", label: "Blended CAC", icon: Target, tone: "ink" },
];

export default function InsightsPage() {
  return (
    <div data-testid="insights-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-[#111827]">
            Insights
          </h1>
          <p className="text-[13px] text-[#4b5563] mt-1">
            Last 30 days · Westgate Wealth · <span className="font-mono text-[#6d46c6]">live</span>
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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {KPI_CARDS.map((c) => (
          <KpiCard key={c.id} card={c} data={KPIS[c.id]} />
        ))}
      </div>

      {/* Trend + Funnel */}
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
            Daily prospects engaged after a review-sourced touchpoint (post, referral,
            Reddit or paid).
          </p>
          <TrendChart data={TREND_30D} />
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-[#eeeaf6] bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-[#6d46c6]" strokeWidth={1.75} />
            <div className="text-[13px] font-display font-semibold text-[#111827]">
              Trust → revenue funnel
            </div>
          </div>
          <div className="space-y-3">
            {FUNNEL.map((f, i) => (
              <FunnelRow key={f.stage} row={f} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Channel attribution */}
      <div className="rounded-2xl border border-[#eeeaf6] bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#eeeaf6] flex items-center justify-between">
          <div>
            <div className="text-[14px] font-display font-semibold text-[#111827]">
              Channel attribution
            </div>
            <div className="text-[11.5px] font-mono text-[#9ca3af] mt-0.5">
              Multi-touch, first-touch weighted 40%, last-touch 40%, assist 20%
            </div>
          </div>
          <button
            data-testid="attribution-details-btn"
            className="text-[12.5px] text-[#6d46c6] hover:underline flex items-center gap-1"
          >
            Model settings
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table data-testid="attribution-table" className="w-full text-[13px]">
            <thead className="bg-[#faf9ff]">
              <tr className="text-left text-[11px] font-mono uppercase tracking-[0.14em] text-[#4b5563]">
                <th className="py-3 px-5">Channel</th>
                <th className="py-3 px-5">Touches</th>
                <th className="py-3 px-5">Converted</th>
                <th className="py-3 px-5">Revenue</th>
                <th className="py-3 px-5">CAC</th>
                <th className="py-3 px-5">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {CHANNEL_ATTRIBUTION.map((row, i) => {
                const efficiency = 100 - (parseInt(row.cac.replace(/[$,]/g, "")) / 1600) * 100;
                return (
                  <tr
                    key={row.channel}
                    className="border-b border-[#f2eefa] hover:bg-[#faf9ff] transition-colors"
                  >
                    <td className="py-4 px-5 font-medium text-[#111827]">
                      {row.channel}
                    </td>
                    <td className="py-4 px-5 font-mono text-[#4b5563]">
                      {row.touches.toLocaleString()}
                    </td>
                    <td className="py-4 px-5 font-mono text-[#4b5563]">
                      {row.converted}
                    </td>
                    <td className="py-4 px-5 font-display font-semibold text-[#111827]">
                      {row.revenue}
                    </td>
                    <td className="py-4 px-5 font-mono text-[#4b5563]">
                      {row.cac}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 rounded-full bg-[#eeeaf6] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              i < 3 ? "bg-[#5eead4]" : "bg-[#eeeaf6]"
                            }`}
                            style={{ width: `${Math.max(10, efficiency)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-[#9ca3af]">
                          {i < 3 ? "high" : "low"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations strip */}
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
              Uplaud recommends
            </span>
            <div className="mt-4 font-display text-[22px] leading-[1.15] font-semibold max-w-[560px]">
              Shift <span className="text-[#5eead4]">$18k/mo</span> from paid search to Reddit + Referral. Projected CAC drop: <span className="text-[#5eead4]">−34%</span>.
            </div>
            <p className="mt-3 text-[13px] text-white/70 max-w-[560px]">
              Paid search has 12× the touches but 1/3 the conversions of your
              review-anchored channels. Redistribute and hit the same pipeline
              at half the CAC.
            </p>
          </div>
          <button
            data-testid="apply-recommendation-btn"
            className="btn-mint h-11 !py-0 self-center"
          >
            Apply recommendation
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ card, data }) {
  const isDown = data.trend?.startsWith("down");
  const TrendIcon = isDown ? TrendingDown : TrendingUp;
  const trendColor = data.trend === "down-good" || data.trend === "up" ? "text-[#0f9b7c]" : "text-[#b91c1c]";

  const iconBg = {
    purple: "bg-[#f5f3ff] text-[#6d46c6]",
    mint: "bg-[#ecfdf7] text-[#0f9b7c]",
    ink: "bg-[#f5f3ff] text-[#111827]",
  }[card.tone];

  return (
    <div
      data-testid={`kpi-${card.id}`}
      className="rounded-2xl border border-[#eeeaf6] bg-white p-4"
    >
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          <card.icon className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#9ca3af] leading-tight">
          {card.label}
        </div>
      </div>
      <div className="mt-3 font-display text-[24px] font-semibold text-[#111827] leading-none">
        {data.value}
      </div>
      <div className={`mt-2 text-[11px] font-mono flex items-center gap-1 ${trendColor}`}>
        <TrendIcon className="w-3 h-3" strokeWidth={2} />
        {data.delta}
      </div>
    </div>
  );
}

function FunnelRow({ row, index }) {
  const isTop = index === 0;
  return (
    <div>
      <div className="flex items-center gap-3 text-[12.5px]">
        <div className="w-40 text-[#4b5563]">{row.stage}</div>
        <div className="flex-1 h-6 rounded-md bg-[#faf9ff] overflow-hidden relative">
          <div
            className={`h-full ${
              isTop
                ? "bg-gradient-to-r from-[#6d46c6] to-[#5eead4]"
                : "bg-gradient-to-r from-[#ece5f4] to-[#c9f2e6]"
            }`}
            style={{ width: `${row.pct}%` }}
          />
          <div className="absolute inset-0 flex items-center px-2 text-[11px] font-mono font-semibold text-[#261c4d]">
            {row.count.toLocaleString()}
          </div>
        </div>
        <div className="w-14 text-right text-[11.5px] font-mono text-[#9ca3af]">
          {row.pct}%
        </div>
      </div>
    </div>
  );
}

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
        {pts.map((p, i) => {
          if (i !== pts.length - 1) return null;
          const [x, y] = p.split(",").map(Number);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="0.9" fill="#5eead4" />
              <circle
                cx={x}
                cy={y}
                r="1.8"
                fill="#5eead4"
                fillOpacity="0.25"
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#9ca3af]">
        <span>Jan 14</span>
        <span>Feb 12</span>
      </div>
    </div>
  );
}
