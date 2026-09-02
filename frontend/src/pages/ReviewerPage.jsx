import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquareText } from "lucide-react";
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
  const initials = (reviewer.name || "?").split(" ").slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const featured = [...reviews].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

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
            className="relative flex flex-col justify-between px-6 lg:px-9 pt-6 lg:pt-9 pb-16 lg:pb-20 min-h-[230px] lg:min-h-[250px]"
            style={{ background: "linear-gradient(135deg, #0B0B10 0%, #1A1A22 40%, #2E245C 100%)" }}
          >
            <div
              className="absolute -top-20 -right-16 w-80 h-80 rounded-full opacity-45 blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(closest-side, #7CE8C8, transparent 70%)" }}
            />
            <div
              className="absolute -bottom-28 -left-20 w-96 h-96 rounded-full opacity-35 blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(closest-side, #5B3EEE, transparent 70%)" }}
            />
            <span
              className="u-pill relative z-10 self-end"
              style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.18)", color: "white" }}
            >
              <span className="u-pill-dot" /> Verified reviewer
            </span>

            {featured && (
              <div className="relative z-10 max-w-lg mt-5" data-testid="reviewer-featured-quote">
                <p className="font-serif-italic text-white text-lg lg:text-[1.65rem] leading-snug line-clamp-3">
                  "{featured.text}"
                </p>
                <p className="mt-3 text-[10px] text-white/45 font-mono uppercase tracking-wider">on {business.name}</p>
              </div>
            )}
          </div>

          <div className="bg-white px-6 lg:px-9 pb-7 relative">
            <div className="flex flex-col md:flex-row gap-5 md:items-end -mt-12 md:-mt-14">
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
                <p className="text-sm text-[color:var(--u-ink-2)] mt-0.5" data-testid="reviewer-business">
                  Reviews for {business.name}
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

        <section className="mt-14">
          <span className="u-pill"><span className="u-pill-dot" /> Reviews</span>
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight mt-3 mb-6 leading-[1.05]">
            Every review from <span className="font-serif-italic mint-underline">{reviewer.name}</span>.
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
                  businessName={business.name}
                  audience={business.audience}
                  delay={index * 0.05}
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
