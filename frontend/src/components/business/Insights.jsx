import { TrendingUp } from "lucide-react";

export default function Insights({ stats }) {
  const dist = stats?.rating_distribution || {};
  const total = Object.values(dist).reduce((s, v) => s + v, 0) || 1;
  const senti = stats?.sentiment || { positive: 0, neutral: 0, negative: 0 };
  const keywords = (stats?.keywords || []).slice(0, 12);

  return (
    <section id="insights" className="max-w-[1320px] mx-auto px-6 lg:px-10 py-14 lg:py-20" data-testid="insights-section">
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <div>
          <span className="u-pill mb-4"><span className="u-pill-dot" /> 02 · what the data says</span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold tracking-tight mt-3 max-w-2xl leading-[1.05]">
            The <span className="font-serif-italic">signal</span> inside <span className="mint-underline">{stats?.total_reviews?.toLocaleString() || 0}</span> reviews.
          </h2>
        </div>
        <p className="text-sm text-[color:var(--u-muted)] max-w-sm">
          Every review is read, tagged and clustered by Uplaud AI — so a business can see what actually drives a 5-star.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Rating distribution */}
        <div className="lg:col-span-5 u-card p-7" data-testid="rating-distribution">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-lg font-semibold">Rating distribution</h3>
            <span className="u-pill text-[10px]"><span className="u-pill-dot" /> live</span>
          </div>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = dist[stars] || 0;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={stars} className="flex items-center gap-3 text-sm">
                  <div className="w-14 flex items-center gap-1 text-[color:var(--u-ink-2)] font-medium">
                    {stars} <span className="text-[color:var(--u-star)]">★</span>
                  </div>
                  <div className="flex-1 h-2.5 rounded-full bg-[color:var(--u-cream-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: stars >= 4 ? "linear-gradient(90deg, #7CE8C8, #5DDCBA)" : stars === 3 ? "#F5B14E" : "#FF7A66",
                      }}
                    />
                  </div>
                  <span className="w-16 text-right text-[color:var(--u-muted)] tabular-nums text-xs">{count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sentiment */}
        <div className="lg:col-span-4 u-card p-7" data-testid="sentiment-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-lg font-semibold">Overall sentiment</h3>
            <TrendingUp size={16} className="text-[color:var(--u-mint-2)]" />
          </div>

          <div className="h-4 rounded-full overflow-hidden flex" style={{ background: "var(--u-cream-2)" }}>
            <div style={{ width: `${senti.positive}%`, background: "linear-gradient(90deg,#7CE8C8,#5DDCBA)" }} />
            <div style={{ width: `${senti.neutral}%`, background: "#F5B14E" }} />
            <div style={{ width: `${senti.negative}%`, background: "#FF7A66" }} />
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <SentimentRow color="#5DDCBA" label="Positive" value={senti.positive} />
            <SentimentRow color="#F5B14E" label="Neutral"  value={senti.neutral} />
            <SentimentRow color="#FF7A66" label="Critical" value={senti.negative} />
          </div>

          <p className="mt-6 pt-5 border-t border-[color:var(--u-line)] text-xs text-[color:var(--u-muted)] leading-relaxed">
            <span className="font-medium text-[color:var(--u-ink-2)]">Top praise:</span> effectiveness on active acne, gentle formula, dermatologist-level results at a D2C price.
          </p>
        </div>

        {/* Keyword cluster */}
        <div className="lg:col-span-3 u-card p-7 relative overflow-hidden" data-testid="keywords-card">
          <h3 className="font-display text-lg font-semibold mb-5">What customers say</h3>
          <div className="flex flex-wrap gap-2">
            {keywords.map((k, i) => {
              const size = Math.min(1.35, 0.75 + (k.count / (keywords[0]?.count || 1)) * 0.6);
              return (
                <span
                  key={i}
                  data-testid={`keyword-${i}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition hover:scale-105 cursor-default"
                  style={{
                    fontSize: `${size}rem`,
                    background: k.sentiment === "mixed" ? "#FDECE3" : "var(--u-mint-soft)",
                    color: k.sentiment === "mixed" ? "#B85D2D" : "#1A5F4A",
                    border: "1px solid",
                    borderColor: k.sentiment === "mixed" ? "#F5D0BC" : "#B9E9D5",
                  }}
                >
                  {k.word}
                  <span className="text-[10px] opacity-60">{k.count}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function SentimentRow({ color, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="inline-flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        <span className="text-[color:var(--u-ink-2)]">{label}</span>
      </div>
      <span className="tabular-nums font-medium">{value}%</span>
    </div>
  );
}
