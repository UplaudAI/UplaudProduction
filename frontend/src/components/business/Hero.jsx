import { ShieldCheck, MapPin, Globe, BadgeCheck, ArrowUpRight, Sparkles } from "lucide-react";

const VERTICAL_LABEL = {
  "health-wellness": "Health & Wellness",
  "education": "Education",
  "legal": "Legal",
  "fintech": "Financial Services",
  "other": "Consumer",
};

export default function Hero({ business, stats }) {
  const initials = (business?.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <section className="relative overflow-hidden" data-testid="business-hero">
      {/* Decorative gradient blobs */}
      <div
        className="absolute -top-40 -right-24 w-[520px] h-[520px] rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(closest-side, #DFF7EE, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-32 -left-16 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(closest-side, #EEE9FF, transparent 70%)" }}
      />

      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 pt-12 lg:pt-20 pb-10 lg:pb-14 relative">
        <div className="reveal">
          <span className="u-pill" data-testid="hero-vertical-pill">
            <span className="u-pill-dot" />
            {VERTICAL_LABEL[business?.vertical] || "Consumer"} · Verified on Uplaud
          </span>
        </div>

        <div className="mt-8 grid lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          <div className="lg:col-span-8 reveal" style={{ animationDelay: "0.05s" }}>
            <div className="flex items-center gap-5 mb-6">
              <div
                className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl flex items-center justify-center text-white font-display text-3xl lg:text-4xl font-bold shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, #0B0B10 0%, #2A2545 45%, #5B3EEE 100%)",
                  boxShadow: "0 20px 50px -18px rgba(11,11,16,0.4)",
                }}
                data-testid="hero-logo"
              >
                {initials}
              </div>
              <div className="flex flex-col gap-2">
                {business?.verified && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--u-violet)]">
                    <BadgeCheck size={16} /> Verified business
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[color:var(--u-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} /> {business?.location || "—"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Globe size={14} /> {business?.website || "—"}
                  </span>
                  <span>Founded {business?.founded || "—"}</span>
                </div>
              </div>
            </div>

            <h1
              className="font-display font-semibold tracking-tight leading-[0.95] text-[3rem] md:text-[4rem] lg:text-[5.25rem]"
              data-testid="hero-title"
            >
              {business?.name}
              <span className="block text-[color:var(--u-muted)] font-normal text-[1.75rem] md:text-[2.25rem] lg:text-[2.75rem] mt-3 leading-[1.1]">
                <span className="font-serif-italic text-[color:var(--u-ink)]">trusted</span> by <span className="mint-underline">{stats?.unique_reviewers?.toLocaleString() || "612"}</span> real people.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-[color:var(--u-ink-2)]" data-testid="hero-about">
              {business?.about}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#share" className="u-btn u-btn-primary" data-testid="hero-cta-share">
                <Sparkles size={16} /> Share your experience
              </a>
              <a href="#reviews" className="u-btn u-btn-ghost" data-testid="hero-cta-reviews">
                Read reviews <ArrowUpRight size={16} />
              </a>
              <span className="hidden md:inline-flex items-center gap-2 text-xs text-[color:var(--u-muted)] ml-2">
                <ShieldCheck size={14} className="text-[color:var(--u-violet)]" />
                Reviews captured via WhatsApp — no fake accounts
              </span>
            </div>
          </div>

          {/* Trust card floating */}
          <div className="lg:col-span-4 reveal" style={{ animationDelay: "0.15s" }}>
            <TrustCard stats={stats} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustCard({ stats }) {
  const rating = stats?.avg_rating || 0;
  const trust = stats?.trust_score || 90;

  return (
    <div className="u-card p-6 relative overflow-hidden" data-testid="hero-trust-card">
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-70"
        style={{ background: "radial-gradient(closest-side, #DFF7EE, transparent 70%)" }}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--u-muted)]">
            Uplaud Trust Score
          </span>
          <span className="u-pill text-[10px]">
            <span className="u-pill-dot" /> Live
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-6xl font-semibold tracking-tighter">{trust}</span>
          <span className="text-[color:var(--u-muted)] text-sm">/100</span>
        </div>

        <div className="mt-3 h-2 rounded-full bg-[color:var(--u-cream-2)] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${trust}%`,
              background: "linear-gradient(90deg, #7CE8C8 0%, #5B3EEE 100%)",
            }}
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <MiniStat label="Avg. rating" value={rating.toFixed(1)} suffix="★" />
          <MiniStat label="Reviews" value={(stats?.total_reviews || 0).toLocaleString()} />
          <MiniStat label="Unique reviewers" value={(stats?.unique_reviewers || 0).toLocaleString()} />
          <MiniStat label="Referrals" value={(stats?.total_referrals || 0).toLocaleString()} />
        </div>

        <p className="mt-4 pt-4 text-[11px] leading-relaxed text-[color:var(--u-muted)] border-t border-[color:var(--u-line)]">
          Trust Score blends review volume, sentiment, reviewer uniqueness and referral velocity. Updated in real time.
        </p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, suffix }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--u-muted)] mb-1">
        {label}
      </div>
      <div className="font-display text-xl font-semibold">
        {value}
        {suffix && <span className="text-[color:var(--u-star)] ml-1">{suffix}</span>}
      </div>
    </div>
  );
}
