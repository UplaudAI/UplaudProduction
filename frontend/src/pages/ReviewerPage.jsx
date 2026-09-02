import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, MessageSquareText } from "lucide-react";
import api from "@/lib/api";
import Nav from "@/components/business/Nav";
import Footer from "@/components/business/Footer";
import ReviewCard from "@/components/business/ReviewCard";

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function StatBit({ label, value, suffix, accent, starColor, testid }) {
  return (
    <div className="flex flex-col" data-testid={testid}>
      <span className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--u-muted)] font-mono">{label}</span>
      <span className="font-display text-2xl md:text-3xl font-semibold tabular-nums leading-tight">
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

export default function ReviewerPage() {
  const { slug, reviewerSlug } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let ignore = false;
    setError(false);
    setProfile(null);
    api
      .get(`/business/public/${slug}/reviewers/${reviewerSlug}`)
      .then(({ data }) => {
        if (!ignore) setProfile(data);
      })
      .catch(() => {
        if (!ignore) setError(true);
      });
    return () => { ignore = true; };
  }, [slug, reviewerSlug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="reviewer-not-found">
        <div className="text-center max-w-md px-6">
          <h1 className="font-display text-3xl font-semibold mb-3">Reviewer not found</h1>
          <p className="text-[color:var(--u-muted)]">No reviews found for <span className="font-mono">{reviewerSlug}</span>.</p>
          <Link to={`/business/public/${slug}`} className="u-btn u-btn-dark mt-5 inline-flex">Back to business</Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="reviewer-loading">
        <div className="font-display text-lg text-[color:var(--u-muted)] animate-pulse">Loading...</div>
      </div>
    );
  }

  const business = profile.business || {};
  const reviewer = profile.reviewer || {};
  const stats = profile.stats || {};
  const reviews = profile.reviews || [];
  const businessesReviewed = profile.businesses_reviewed || [];
  const visibleBusinesses = businessesReviewed.slice(0, 6);
  const hiddenBusinessCount = Math.max(businessesReviewed.length - visibleBusinesses.length, 0);
  const initials = (reviewer.name || "?").split(" ").slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const firstName = (reviewer.name || "this reviewer").split(" ")[0];

  return (
    <div className="min-h-screen bg-grain" data-testid="reviewer-profile-page">
      <Nav businessName={business.name} audience={business.audience} slug={business.slug || slug} />

      <main className="max-w-[1080px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
        <Link
          to={`/business/public/${slug}`}
          data-testid="reviewer-back-link"
          className="inline-flex items-center gap-2 text-sm text-[color:var(--u-muted)] hover:text-[color:var(--u-ink)] transition mb-6 group"
        >
          <ArrowLeft size={15} className="transition group-hover:-translate-x-0.5" /> Back to {business.name}
        </Link>

        <section className="relative rounded-[28px] overflow-hidden reveal" data-testid="reviewer-header">
          <div
            className="relative h-14 md:h-16"
            style={{ background: "linear-gradient(135deg, #0B0B10 0%, #1A1A22 40%, #2E245C 100%)" }}
          >
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_78%_8%,rgba(124,232,200,0.35),transparent_34%)]" />
          </div>

          <div className="bg-white px-6 lg:px-9 pt-8 pb-7 relative">
            <div className="flex flex-col md:flex-row gap-5 md:items-center">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center text-white font-display text-3xl font-bold shrink-0"
                style={{
                  background: "linear-gradient(135deg, #5B3EEE, #7CE8C8)",
                  border: "4px solid white",
                  boxShadow: "0 18px 40px -14px rgba(11,11,16,0.4)",
                }}
                data-testid="reviewer-avatar"
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h1 className="font-display text-2xl lg:text-[2rem] font-semibold tracking-tight leading-tight" data-testid="reviewer-name">
                  {reviewer.name}
                </h1>
                <p className="text-sm text-[color:var(--u-ink-2)] mt-0.5" data-testid="reviewer-status">
                  Verified Uplaud reviewer
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[color:var(--u-line)] pt-5" data-testid="reviewer-metrics">
              <StatBit label="Reviews written" value={stats.total_reviews || 0} accent testid="reviewer-metric-total" />
              <StatBit label="Avg rating given" value={(stats.avg_rating || 0).toFixed(1)} suffix="★" starColor testid="reviewer-metric-avg-rating" />
              <StatBit label="Referred reviews" value={stats.total_referrals || 0} testid="reviewer-metric-referrals" />
              {reviewer.member_since && <StatBit label="Member since" value={formatDate(reviewer.member_since)} testid="reviewer-metric-since" />}
            </div>
          </div>
        </section>

        {businessesReviewed.length > 0 && (
          <section className="mt-12" data-testid="reviewer-businesses">
            <span className="u-pill"><span className="u-pill-dot" /> 01 · trusted by</span>
            <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight mt-3 mb-6 leading-[1.05]">
              Where <span className="font-serif-italic">{firstName}</span> shows up.
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {visibleBusinesses.map((item, index) => (
                <Link
                  key={item.slug}
                  to={`/business/public/${item.slug}`}
                  data-testid={`reviewer-business-chip-${item.slug}`}
                  className="u-card p-4 flex items-center gap-3 reveal group"
                  style={{ animationDelay: `${index * 0.06}s` }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, #0B0B10 0%, #2A2545 45%, #5B3EEE 100%)" }}
                  >
                    {(item.name || "?").split(" ").slice(0, 2).map((word) => word[0]).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{item.name}</div>
                    <div className="text-[11px] text-[color:var(--u-muted)] truncate">{item.category}</div>
                  </div>
                  <ArrowUpRight size={16} className="text-[color:var(--u-muted)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[color:var(--u-violet)] shrink-0" />
                </Link>
              ))}
              {hiddenBusinessCount > 0 && (
                <div
                  className="u-card p-4 flex items-center gap-3 reveal"
                  data-testid="reviewer-business-more"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, #0B0B10 0%, #2A2545 45%, #5B3EEE 100%)" }}
                  >
                    +{hiddenBusinessCount}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm">more</div>
                    <div className="text-[11px] text-[color:var(--u-muted)]">Verified businesses</div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mt-14">
          <span className="u-pill"><span className="u-pill-dot" /> 02 · the receipts</span>
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight mt-3 mb-6 leading-[1.05]">
            Every word, <span className="font-serif-italic">on record.</span>
          </h2>

          {reviews.length === 0 ? (
            <div className="u-card p-12 text-center">
              <MessageSquareText className="mx-auto mb-3 text-[color:var(--u-muted)]" size={28} />
              <p className="text-[color:var(--u-ink-2)] font-medium">No reviews yet.</p>
            </div>
          ) : (
            <div className={`grid gap-5 ${reviews.length > 1 ? "md:grid-cols-2" : "max-w-xl"}`} data-testid="reviewer-reviews-list">
              {reviews.map((review, index) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  businessName={review.business_name || business.name}
                  audience={business.audience}
                  delay={index * 0.05}
                  showBusinessTag={reviews.length > 1}
                  reviewerProfile
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
