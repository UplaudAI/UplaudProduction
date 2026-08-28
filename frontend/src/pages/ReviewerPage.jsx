import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Instagram, Linkedin, UserPlus, UserCheck, Sparkles } from "lucide-react";
import Nav from "@/components/business/Nav";
import Footer from "@/components/business/Footer";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function Stars({ n }) {
  return (
    <div className="inline-flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-[13px] leading-none" style={{ color: i < n ? "var(--u-star)" : "var(--u-line-2)" }}>★</span>
      ))}
    </div>
  );
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}

function Metric({ label, value, suffix, small, testid }) {
  return (
    <div className="u-card p-4 text-center" data-testid={testid}>
      <div className={`font-display font-semibold ${small ? "text-base" : "text-2xl"}`}>
        {value}
        {suffix && <span className="text-sm text-[color:var(--u-muted)] ml-0.5">{suffix}</span>}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--u-muted)] font-mono mt-1">{label}</div>
    </div>
  );
}

export default function ReviewerPage() {
  const { reviewerSlug } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    axios.get(`${API}/reviewer/${reviewerSlug}`)
      .then((res) => {
        if (ignore) return;
        setProfile(res.data);
        setFollowerCount(res.data.follower_count || 0);
        setFollowing(localStorage.getItem(`uplaud_follow_${reviewerSlug}`) === "1");
      })
      .catch(() => !ignore && setError(true));
    return () => { ignore = true; };
  }, [reviewerSlug]);

  const toggleFollow = async () => {
    const next = !following;
    setFollowing(next);
    setFollowerCount((c) => c + (next ? 1 : -1));
    localStorage.setItem(`uplaud_follow_${reviewerSlug}`, next ? "1" : "0");
    try {
      const res = await axios.post(`${API}/reviewer/${reviewerSlug}/${next ? "follow" : "unfollow"}`);
      setFollowerCount(res.data.follower_count);
    } catch {
      /* optimistic state already applied */
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="reviewer-not-found">
        <div className="text-center max-w-md px-6">
          <h1 className="font-display text-3xl font-semibold mb-3">Reviewer not found</h1>
          <p className="text-[color:var(--u-muted)]">No reviewer profile for <span className="font-mono">{reviewerSlug}</span>.</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="reviewer-loading">
        <div className="font-display text-lg text-[color:var(--u-muted)] animate-pulse">Loading…</div>
      </div>
    );
  }

  const initials = (profile.reviewer_name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-grain" data-testid="reviewer-profile-page">
      <Nav businessName="Uplaud" />

      <div className="max-w-[980px] mx-auto px-6 lg:px-10 py-12 lg:py-16">
        <Link to="/business/the-solved-skin" data-testid="reviewer-back-link" className="inline-flex items-center gap-2 text-sm text-[color:var(--u-muted)] hover:text-[color:var(--u-ink)] mb-8">
          <ArrowLeft size={15} /> Back to Uplaud
        </Link>

        <div className="u-card p-7 lg:p-9 flex flex-col md:flex-row gap-6 md:items-center" data-testid="reviewer-header">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-display text-2xl font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #5B3EEE, #7CE8C8)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight" data-testid="reviewer-name">
                {profile.reviewer_name}
              </h1>
              <span className="u-pill text-[10px]"><span className="u-pill-dot" /> Verified reviewer</span>
            </div>
            {profile.reviewer_title && (
              <p className="text-sm text-[color:var(--u-ink-2)] mt-1" data-testid="reviewer-title">{profile.reviewer_title}</p>
            )}
            {profile.bio && (
              <p className="text-sm text-[color:var(--u-muted)] mt-2 max-w-lg leading-relaxed" data-testid="reviewer-bio">
                {profile.bio}
              </p>
            )}
            <div className="mt-3 flex items-center gap-4">
              {profile.instagram_url && (
                <a
                  href={profile.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="reviewer-instagram-link"
                  className="inline-flex items-center gap-1 text-xs text-[color:var(--u-muted)] hover:text-[color:var(--u-violet)] transition"
                >
                  <Instagram size={14} /> Instagram
                </a>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="reviewer-linkedin-link"
                  className="inline-flex items-center gap-1 text-xs text-[color:var(--u-muted)] hover:text-[color:var(--u-violet)] transition"
                >
                  <Linkedin size={14} /> LinkedIn
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
            <button
              onClick={toggleFollow}
              data-testid="reviewer-follow-btn"
              className={`u-btn ${following ? "u-btn-ghost" : "u-btn-dark"}`}
            >
              {following ? (<><UserCheck size={15} /> Following</>) : (<><UserPlus size={15} /> Follow</>)}
            </button>
            <span className="text-xs text-[color:var(--u-muted)]" data-testid="reviewer-follower-count">
              {followerCount.toLocaleString()} followers
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="reviewer-metrics">
          <Metric label="Reviews written" value={profile.total_reviews} testid="reviewer-metric-total" />
          <Metric label="Avg rating given" value={profile.avg_rating_given} suffix="★" testid="reviewer-metric-avg-rating" />
          <Metric label="Referrals made" value={profile.total_referrals} testid="reviewer-metric-referrals" />
          <Metric label="Member since" value={formatDate(profile.member_since)} small testid="reviewer-metric-since" />
        </div>

        {profile.businesses_reviewed?.length > 0 && (
          <div className="mt-8" data-testid="reviewer-businesses">
            <h2 className="text-xs uppercase tracking-[0.15em] font-mono text-[color:var(--u-muted)] mb-3">Businesses reviewed</h2>
            <div className="flex flex-wrap gap-2">
              {profile.businesses_reviewed.map((b) => (
                <Link
                  key={b.slug}
                  to={`/business/${b.slug}`}
                  data-testid={`reviewer-business-chip-${b.slug}`}
                  className="u-pill hover:bg-white transition"
                >
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight mb-5">All reviews</h2>
          <div className="grid gap-4" data-testid="reviewer-reviews-list">
            {profile.reviews.map((r) => (
              <Link
                key={r.id}
                to={`/business/${r.business_slug}#reviews`}
                data-testid={`reviewer-review-card-${r.id}`}
                className="u-card p-5 block reveal"
              >
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <span className="font-medium text-sm">{r.business_name}</span>
                  <div className="flex items-center gap-2">
                    <Stars n={r.rating} />
                    <span className="text-[10px] text-[color:var(--u-muted)] font-mono">{formatDate(r.date)}</span>
                  </div>
                </div>
                <p className="text-[14px] text-[color:var(--u-ink-2)] leading-relaxed">{r.text}</p>
                <div className="mt-3 flex items-center gap-3 text-[10px] text-[color:var(--u-muted)] font-mono uppercase tracking-wider">
                  {r.verification_type === "demo" ? (
                    <span className="text-[color:var(--u-violet)]">Verified demo</span>
                  ) : (
                    <span>Verified purchase</span>
                  )}
                  {r.referred && (
                    <span className="inline-flex items-center gap-1 text-[color:var(--u-violet)]">
                      <Sparkles size={10} /> referred
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
