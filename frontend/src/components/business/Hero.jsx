import { Link } from "react-router-dom";
import { ShieldCheck, MapPin, ArrowUpRight, Star } from "lucide-react";
import { displayReviewSource, normalizeReviewRating, reviewerProfilePath } from "./ReviewCard";

export default function Hero({ business, stats, topReviews = [] }) {
  const isB2B = business?.audience === "b2b";
  const displayName = formatBusinessName(business?.name);
  const detailItems = [business?.location, business?.website, business?.founded ? `Est. ${business.founded}` : ""].filter(Boolean);
  const initials = (displayName || "?")
    .split(" ").slice(0, 2).map((w) => w[0]).join("");

  return (
    <section className="relative overflow-hidden" data-testid="business-hero">
      {/* Ambient glow */}
      <div
        className="absolute -top-40 -right-32 w-[560px] h-[560px] rounded-full opacity-50 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(closest-side, #DFF7EE, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-40 -left-32 w-[520px] h-[520px] rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(closest-side, #EEE9FF, transparent 70%)" }}
      />

      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 pt-8 lg:pt-12 pb-8 lg:pb-10 relative">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* LEFT: editorial column */}
          <div className="lg:col-span-7 reveal">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-display text-xl font-bold shrink-0"
                style={{
                  background: "linear-gradient(135deg, #0B0B10 0%, #2A2545 45%, #5B3EEE 100%)",
                  boxShadow: "0 12px 32px -14px rgba(11,11,16,0.4)",
                }}
                data-testid="hero-logo"
              >
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[color:var(--u-muted)]">
                  {detailItems.length > 0 ? (
                    <>
                      <span className="inline-flex items-center gap-1"><MapPin size={12} />{detailItems[0]}</span>
                      {detailItems.slice(1).map((item) => (
                        <span key={item} className="inline-flex items-center gap-3">
                          <span>·</span>
                          <span>{item}</span>
                        </span>
                      ))}
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1"><MapPin size={12} />Verified on Uplaud</span>
                  )}
                </div>
                <div className="text-[11px] text-[color:var(--u-violet)] font-medium mt-0.5 inline-flex items-center gap-1">
                  <ShieldCheck size={12} /> {isB2B ? "Verified vendor · Claimed" : "Verified business · Claimed"}
                </div>
              </div>
            </div>

            <h1
              className="font-display font-semibold tracking-tight leading-[0.95] text-[2.75rem] md:text-[3.5rem] lg:text-[4.25rem] mt-6 text-[color:var(--u-ink)]"
              data-testid="hero-title"
            >
              <span className="block">{displayName}<span className="text-[color:var(--u-muted)]">.</span></span>
              <span className="block text-[1.6rem] md:text-[2rem] lg:text-[2.4rem] mt-2 leading-[1.05] font-normal text-[color:var(--u-ink-2)]">
                <span className="font-serif-italic text-[color:var(--u-ink)]">Trusted</span>. Reviewed. <span className="mint-underline">Referred</span>.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[color:var(--u-ink-2)]" data-testid="hero-about">
              {business?.about}
            </p>

            {/* Inline stat strip */}
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-b border-[color:var(--u-line)] py-4" data-testid="hero-stats-strip">
              <StatBit label={isB2B ? "Vendor Trust Score" : "Trust Score"} value={`${stats?.trust_score || 0}`} suffix="/100" accent />
              <StatBit label="Rating" value={(stats?.avg_rating || 0).toFixed(1)} suffix="★" starColor />
              <StatBit label="Reviews" value={(stats?.total_reviews || 0).toLocaleString()} />
              <StatBit label={isB2B ? "Verified accounts" : "Unique reviewers"} value={(stats?.unique_reviewers || 0).toLocaleString()} />
              <StatBit label={isB2B ? "Team referrals" : "Referrals"} value={(stats?.total_referrals || 0).toLocaleString()} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="#reviews" className="u-btn u-btn-dark" data-testid="hero-cta-reviews">
                Read all reviews <ArrowUpRight size={16} />
              </a>
            </div>
          </div>

          {/* RIGHT: floating preview stack */}
          <div className="lg:col-span-5 relative reveal" style={{ animationDelay: "0.15s" }} data-testid="hero-preview-stack">
            <FloatingPreview reviews={topReviews} business={business} stats={stats} />
          </div>
        </div>
      </div>
    </section>
  );
}

function formatBusinessName(name) {
  const clean = (name || "").trim();
  if (!clean) return "";
  return clean
    .replace(/^AI(?=[A-Z][a-z])/g, "AI ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ");
}

function StatBit({ label, value, suffix, accent, starColor }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--u-muted)] font-mono">{label}</span>
      <span className="font-display text-2xl font-semibold tabular-nums leading-tight">
        <span className={accent ? "text-[color:var(--u-violet)]" : ""}>{value}</span>
        {suffix && (
          <span className={`ml-0.5 text-sm font-medium ${starColor ? "text-[color:var(--u-star)]" : "text-[color:var(--u-muted)]"}`}>
            {suffix}
          </span>
        )}
      </span>
    </div>
  );
}

function FloatingPreview({ reviews, business, stats }) {
  const top5 = reviews.filter((r) => r.rating === 5).slice(0, 2);
  const items = top5.length >= 2 ? top5 : reviews.slice(0, 2);
  const referredReview = reviews.find((review) => review.referred);

  return (
    <div className="relative h-[440px] lg:h-[500px]">
      {/* Backdrop grid card */}
      <div
        className="absolute inset-0 rounded-3xl border border-[color:var(--u-line)] bg-white/40 backdrop-blur-sm"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(11,11,16,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,11,16,0.04) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Live review count tag top-right */}
      <div className="absolute top-4 right-4 u-pill" style={{ background: "white" }}>
        <span className="u-pill-dot" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-[color:var(--u-muted)]">Live</span>
        <span className="font-display font-semibold ml-1">{(stats?.total_reviews || 0).toLocaleString()}</span>
      </div>

      {/* Uplaud watermark badge */}
      <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[color:var(--u-muted)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--u-mint-2)] animate-pulse" />
        Surfaced by uplaud
      </div>

      {/* Card 1 */}
      {items[0] && <PreviewCard review={items[0]} position="top" business={business} />}
      {/* Card 2 */}
      {items[1] && <PreviewCard review={items[1]} position="bottom" business={business} />}

      {referredReview && (
        <div
          className="absolute bottom-5 right-5 rounded-xl p-3 pr-4 max-w-[220px]"
          style={{
            background: "white",
            border: "1px solid var(--u-line-2)",
            boxShadow: "0 16px 40px -20px rgba(11,11,16,0.25)",
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: "#25D366" }}>
              {referredReview.reviewer_name?.[0]?.toUpperCase() || "R"}
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[color:var(--u-muted)]">
              Referred
            </span>
          </div>
          <p className="text-[12px] leading-snug text-[color:var(--u-ink-2)]">
            "{referredReview.reviewer_name} referred {business?.name} on Uplaud."
          </p>
        </div>
      )}
    </div>
  );
}

function PreviewCard({ review, position, business }) {
  const isTop = position === "top";
  const isB2B = business?.audience === "b2b";
  const isDemo = review.verification_type === "demo";
  const initials = (review.reviewer_name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const rating = normalizeReviewRating(review.rating);
  const sourceLabel = displayReviewSource(review.channel || review.source);

  return (
    <div
      className="absolute rounded-2xl p-5 max-w-[340px]"
      style={{
        background: "white",
        border: "1px solid var(--u-line-2)",
        boxShadow: "0 24px 60px -30px rgba(11,11,16,0.35)",
        top: isTop ? "56px" : "auto",
        bottom: isTop ? "auto" : "110px",
        left: isTop ? "24px" : "auto",
        right: isTop ? "auto" : "36px",
        transform: isTop ? "rotate(-1.5deg)" : "rotate(1.5deg)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold"
               style={{ background: "linear-gradient(135deg,#5B3EEE,#7CE8C8)" }}>
            {initials}
          </div>
          <div>
            <Link
              to={reviewerProfilePath(review)}
              className="text-xs font-medium hover:underline"
              data-testid={`preview-reviewer-link-${review.id}`}
            >
              {review.reviewer_name}{review.reviewer_title ? `, ${review.reviewer_title}` : ""}
            </Link>
            <div className="text-[10px] text-[color:var(--u-muted)]">
              {isDemo ? "verified demo" : isB2B ? "verified subscriber" : "verified"} · {sourceLabel}
            </div>
          </div>
        </div>
        <div className="inline-flex" aria-label={`${rating} stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={11} className="fill-current" style={{ color: i < rating ? "var(--u-star)" : "var(--u-line-2)" }} />
          ))}
        </div>
      </div>
      <p className="text-[13px] leading-snug text-[color:var(--u-ink-2)] line-clamp-4">
        "{review.text}"
      </p>
      <div className="mt-3 pt-3 border-t border-[color:var(--u-line)] flex items-center justify-between text-[10px] text-[color:var(--u-muted)]">
        <span className="uppercase tracking-wider font-mono">{business?.category?.split("·")[0]?.trim() || "Trusted"}</span>
        {review.referred && <span className="text-[color:var(--u-violet)] font-medium">Referred</span>}
      </div>
    </div>
  );
}
