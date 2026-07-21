import { useState } from "react";
import {
  Star,
  Filter,
  Download,
  Search,
  MapPin,
  Sparkles,
  Megaphone,
  Users,
  Ghost,
  LineChart as LineChartIcon,
  X,
  Zap,
  ArrowUpRight,
  ThumbsUp,
  Meh,
  ThumbsDown,
} from "lucide-react";
import PageHero from "@/components/business/PageHero";
import { toast } from "sonner";
import { REVIEWS, AGENT_RECOMMENDATIONS, PAGE_OUTCOMES, SMART_NBA } from "@/mocks/fintech";

const AGENT_META = {
  social: { icon: Megaphone, color: "#6d46c6", label: "Social Post Agent" },
  referral: { icon: Users, color: "#5eead4", label: "Referral Agent" },
  reddit: { icon: Ghost, color: "#ff4500", label: "Reddit Agent" },
  attribution: { icon: LineChartIcon, color: "#111827", label: "Attribution" },
};

const SENTIMENT_META = {
  positive: { icon: ThumbsUp, color: "text-[#0f9b7c]", bg: "bg-[#ecfdf7]", label: "Positive" },
  neutral: { icon: Meh, color: "text-[#a16207]", bg: "bg-[#fef9c3]", label: "Neutral" },
  negative: { icon: ThumbsDown, color: "text-[#b91c1c]", bg: "bg-[#fee2e2]", label: "Negative" },
};

export default function ReviewsPage() {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const filtered = REVIEWS.filter((r) => {
    if (query && !`${r.customer} ${r.title} ${r.body}`.toLowerCase().includes(query.toLowerCase()))
      return false;
    if (ratingFilter !== "all" && r.rating !== Number(ratingFilter)) return false;
    if (sourceFilter !== "all" && r.source !== sourceFilter) return false;
    return true;
  });

  return (
    <div data-testid="reviews-page" className="space-y-10">
      <PageHero
        eyebrow={PAGE_OUTCOMES.reviews.eyebrow}
        question={PAGE_OUTCOMES.reviews.question}
        northStar={PAGE_OUTCOMES.reviews.northStar}
        smartAction={SMART_NBA.reviews}
      />

      {/* Section header */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-[#111827]">
            All captured trust
          </h2>
          <p className="text-[12.5px] text-[#9ca3af] mt-1">
            {filtered.length} of {REVIEWS.length} reviews
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button data-testid="reviews-filter-btn" className="btn-secondary h-10 !py-0">
            <Filter className="w-4 h-4" strokeWidth={1.75} />
            More filters
          </button>
          <button data-testid="reviews-export-btn" className="btn-secondary h-10 !py-0">
            <Download className="w-4 h-4" strokeWidth={1.75} />
            Export
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-[420px]">
          <Search className="w-4 h-4 text-[#9ca3af] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            data-testid="reviews-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, keyword..."
            className="w-full h-10 pl-10 pr-4 rounded-full border border-[#eeeaf6] bg-white text-[13px] focus:outline-none focus:border-[#d9d1ee] transition-all"
          />
        </div>
        <select
          data-testid="reviews-rating-filter"
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="h-10 px-4 rounded-full border border-[#eeeaf6] bg-white text-[13px] text-[#4b5563] focus:outline-none focus:border-[#d9d1ee]"
        >
          <option value="all">All ratings</option>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
        <select
          data-testid="reviews-source-filter"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="h-10 px-4 rounded-full border border-[#eeeaf6] bg-white text-[13px] text-[#4b5563] focus:outline-none focus:border-[#d9d1ee]"
        >
          <option value="all">All sources</option>
          <option value="Google">Google</option>
          <option value="Trustpilot">Trustpilot</option>
          <option value="CSV">CSV</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#eeeaf6] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table data-testid="reviews-table" className="w-full text-[13px]">
            <thead className="bg-[#faf9ff] border-b border-[#eeeaf6]">
              <tr className="text-left text-[11px] font-mono uppercase tracking-[0.14em] text-[#4b5563]">
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-5">Rating</th>
                <th className="py-3 px-5">Review</th>
                <th className="py-3 px-5">Sentiment</th>
                <th className="py-3 px-5">Source</th>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Agents</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const sm = SENTIMENT_META[r.sentiment];
                const recs = AGENT_RECOMMENDATIONS[r.id] || [];
                return (
                  <tr
                    key={r.id}
                    data-testid={`review-row-${r.id}`}
                    onClick={() => setSelected(r)}
                    className="border-b border-[#f2eefa] hover:bg-[#faf9ff] cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f5f3ff] text-[#6d46c6] flex items-center justify-center text-[11px] font-semibold">
                          {r.customer.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-[#111827] leading-tight">
                            {r.customer}
                          </div>
                          <div className="text-[11px] font-mono text-[#9ca3af]">
                            {r.handle}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < r.rating
                                ? "fill-[#5eead4] text-[#5eead4]"
                                : "text-[#eeeaf6]"
                            }`}
                            strokeWidth={0}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-5 max-w-[380px]">
                      <div className="text-[13px] font-medium text-[#111827] leading-tight">
                        {r.title}
                      </div>
                      <div className="text-[12px] text-[#4b5563] mt-1 line-clamp-1">
                        {r.body}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${sm.bg} ${sm.color}`}
                      >
                        <sm.icon className="w-3 h-3" strokeWidth={2} />
                        {sm.label}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-[12px] text-[#4b5563]">
                      {r.source}
                    </td>
                    <td className="py-4 px-5 text-[12px] font-mono text-[#4b5563]">
                      {r.date}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1">
                        {recs.slice(0, 3).map((rec) => {
                          const Meta = AGENT_META[rec.agent];
                          const Icon = Meta.icon;
                          return (
                            <span
                              key={rec.id}
                              title={Meta.label}
                              className="w-6 h-6 rounded-full border border-[#eeeaf6] flex items-center justify-center bg-white"
                            >
                              <Icon
                                className="w-3 h-3"
                                strokeWidth={1.75}
                                style={{ color: Meta.color }}
                              />
                            </span>
                          );
                        })}
                        {recs.length === 0 && (
                          <span className="text-[11px] text-[#9ca3af] font-mono">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ReviewDrawer
          review={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function ReviewDrawer({ review, onClose }) {
  const sm = SENTIMENT_META[review.sentiment];
  const recs = AGENT_RECOMMENDATIONS[review.id] || [
    { id: "r1", agent: "social", label: "Generate a social post draft", confidence: 0.72 },
    { id: "r2", agent: "referral", label: "Add to referral campaign", confidence: 0.65 },
  ];

  return (
    <div
      data-testid="review-drawer"
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div
        className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-[560px] h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 bg-white border-b border-[#eeeaf6] px-6 h-14 flex items-center justify-between z-10">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
            Review · {review.id}
          </div>
          <button
            data-testid="review-drawer-close"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[#eeeaf6] hover:border-[#d9d1ee] flex items-center justify-center"
          >
            <X className="w-4 h-4 text-[#4b5563]" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#f5f3ff] text-[#6d46c6] flex items-center justify-center text-[15px] font-semibold shrink-0">
              {review.customer.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-[16px] font-display font-semibold text-[#111827]">
                  {review.customer}
                </div>
                {review.verified && (
                  <span className="text-[10px] font-mono text-[#0f9b7c] bg-[#ecfdf7] border border-[#c8f0e4] rounded-full px-1.5 py-0.5">
                    verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[12px] text-[#4b5563]">
                <MapPin className="w-3 h-3" strokeWidth={1.75} />
                {review.location}
                <span>·</span>
                <span className="font-mono">{review.ltv}</span>
              </div>
              <div className="flex items-center gap-0.5 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < review.rating
                        ? "fill-[#5eead4] text-[#5eead4]"
                        : "text-[#eeeaf6]"
                    }`}
                    strokeWidth={0}
                  />
                ))}
                <span className="ml-2 text-[11px] font-mono text-[#9ca3af]">
                  {review.source} · {review.date}
                </span>
              </div>
            </div>
          </div>

          {/* Review body */}
          <div className="rounded-2xl border border-[#eeeaf6] bg-[#faf9ff] p-5">
            <div className="text-[15px] font-display font-semibold text-[#111827]">
              {review.title}
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[#4b5563]">
              &ldquo;{review.body}&rdquo;
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${sm.bg} ${sm.color}`}
              >
                <sm.icon className="w-3 h-3" strokeWidth={2} />
                {sm.label}
              </span>
              {review.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-white border border-[#eeeaf6] text-[#4b5563]"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* Agentic recommendations */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#6d46c6]" strokeWidth={1.75} />
              <div className="text-[13px] font-display font-semibold text-[#111827]">
                Agentic recommendations
              </div>
              <span className="ml-auto text-[10.5px] font-mono text-[#9ca3af]">
                Ranked by expected impact
              </span>
            </div>
            <div className="space-y-2">
              {recs.map((rec) => {
                const Meta = AGENT_META[rec.agent];
                const Icon = Meta.icon;
                return (
                  <div
                    key={rec.id}
                    data-testid={`rec-${rec.id}`}
                    className="rounded-xl border border-[#eeeaf6] bg-white hover:border-[#d9d1ee] p-4 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${Meta.color}18`,
                        }}
                      >
                        <Icon
                          className="w-4 h-4"
                          strokeWidth={1.75}
                          style={{ color: Meta.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-[#111827] leading-tight">
                          {rec.label}
                        </div>
                        <div className="text-[11px] font-mono text-[#9ca3af] mt-1">
                          {Meta.label} · confidence {Math.round(rec.confidence * 100)}%
                        </div>
                      </div>
                      <button
                        data-testid={`rec-run-${rec.id}`}
                        onClick={() =>
                          toast.success(`Queued: ${rec.label}`, {
                            description: "Agent will draft in the background.",
                          })
                        }
                        className="opacity-0 group-hover:opacity-100 transition-opacity btn-secondary h-9 !py-0 !px-3 !text-[12px]"
                      >
                        <Zap className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Run
                      </button>
                    </div>
                    {/* Confidence bar */}
                    <div className="mt-3 h-1 rounded-full bg-[#eeeaf6] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${rec.confidence * 100}%`,
                          backgroundColor: Meta.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              data-testid="review-thank-btn"
              onClick={() =>
                toast.success("Thank-you reply queued", {
                  description: "Will be sent via original review channel.",
                })
              }
              className="btn-secondary flex-1 justify-center h-11"
            >
              Send thank-you
            </button>
            <button
              data-testid="review-action-btn"
              onClick={() =>
                toast.success("All agents activated for this review", {
                  description: "Draft posts + referral in queue.",
                })
              }
              className="btn-primary flex-1 justify-center h-11"
            >
              Activate all agents
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
