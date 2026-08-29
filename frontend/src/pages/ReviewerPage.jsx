import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Instagram, Linkedin, UserPlus, UserCheck, ArrowUpRight, MessageSquareText } from "lucide-react";
import Nav from "@/components/business/Nav";
import Footer from "@/components/business/Footer";
import ReviewCard from "@/components/business/ReviewCard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
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
  const colorIdx = (profile.reviewer_name?.charCodeAt(0) || 0) % 3;
  const avatarGrad = [
    "linear-gradient(135deg, #5B3EEE, #7CE8C8)",
    "linear-gradient(135deg, #FF7A66, #F5B14E)",
    "linear-gradient(135deg, #5DDCBA, #5B3EEE)",
  ][colorIdx];

  return (
    <div className="min-h-screen bg-grain" data-testid="reviewer-profile-page">
      <Nav businessName="Uplaud" />

      <div className="max-w-[1080px] mx-auto px-6 lg:px-10 py-10 lg:py-14">
        <Link to="/" data-testid="reviewer-back-link" className="inline-flex items-center gap-2 text-sm text-[color:var(--u-muted)] hover:text-[color:var(--u-ink)] transition mb-6 group">
          <ArrowLeft size={15} className="transition group-hover:-translate-x-0.5" /> Back to Uplaud
        </Link>

        {/* Cover + header */}
        <div className="relative rounded-[28px] overflow-hidden reveal" data-testid="reviewer-header">
          <div
            className="h-32 lg:h-40 relative"
            style={{ background: "linear-gradient(135deg, #0B0B10 0%, #1A1A22 45%, #2E245C 100%)" }}
          >
            <div
              className="absolute -top-16 -right-10 w-72 h-72 rounded-full opacity-40 blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(closest-side, #7CE8C8, transparent 70%)" }}
            />
            <div
              className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full opacity-35 blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(closest-side, #5B3EEE, transparent 70%)" }}
            />
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)",
                backgroundSize: "26px 26px",
              }}
            />
            <span
              className="absolute top-4 right-5 u-pill"
              style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.18)", color: "white" }}
            >
              <span className="u-pill-dot" /> Verified reviewer
            </span>
          </div>

          <div className="bg-white px-6 lg:px-9 pb-7 relative">
            <div className="flex flex-col md:flex-row gap-5 md:items-end -mt-12 md:-mt-14">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center text-white font-display text-3xl font-bold shrink-0 shadow-xl"
                style={{ background: avatarGrad, border: "4px solid white" }}
                data-testid="reviewer-avatar"
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h1 className="font-display text-2xl lg:text-[2rem] font-semibold tracking-tight leading-tight" data-testid="reviewer-name">
                  {profile.reviewer_name}
                </h1>
                {profile.reviewer_title && (
                  <p className="text-sm text-[color:var(--u-ink-2)] mt-0.5" data-testid="reviewer-title">{profile.reviewer_title}</p>
                )}
              </div>
              <div className="flex flex-col items-start md:items-end gap-2 shrink-0 pb-1">
                <button
                  onClick={toggleFollow}
                  data-testid="reviewer-follow-btn"
                  className="u-btn u-btn-dark"
                >
                  {following ? (<><UserCheck size={15} /> Following</>) : (<><UserPlus size={15} /> Follow</>)}
                </button>
                <span className="text-xs text-[color:var(--u-muted)] font-mono" data-testid="reviewer-follower-count">
                  {followerCount.toLocaleString()} followers
                </span>
              </div>
            </div>

            {profile.bio && (
              <p className="mt-4 text-[15px] text-[color:var(--u-ink-2)] leading-relaxed max-w-xl" data-testid="reviewer-bio">
                {profile.bio}
              </p>
            )}

            <div className="mt-4 flex items-center gap-4">
              {profile.instagram_url && (
                <a
                  href={profile.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="reviewer-instagram-link"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--u-ink-2)] hover:text-[color:var(--u-violet)] transition"
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
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--u-ink-2)] hover:text-[color:var(--u-violet)] transition"
                >
                  <Linkedin size={14} /> LinkedIn
                </a>
              )}
            </div>

            {/* stat strip, hero-style */}
            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[color:var(--u-line)] pt-5" data-testid="reviewer-metrics">
              <StatBit label="Reviews written" value={profile.total_reviews} accent testid="reviewer-metric-total" />
              <StatBit label="Avg rating given" value={profile.avg_rating_given.toFixed(1)} suffix="★" starColor testid="reviewer-metric-avg-rating" />
              <StatBit label="Referrals made" value={profile.total_referrals} testid="reviewer-metric-referrals" />
              <StatBit label="Verified demos" value={profile.verified_demo_count} testid="reviewer-metric-demos" />
              <StatBit label="Member since" value={formatDate(profile.member_since)} testid="reviewer-metric-since" />
            </div>
          </div>
        </div>

        {/* Businesses reviewed */}
        {profile.businesses_reviewed?.length > 0 && (
          <div className="mt-12" data-testid="reviewer-businesses">
            <span className="u-pill"><span className="u-pill-dot" /> 01 · trusted by</span>
            <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight mt-3 mb-6 leading-[1.05]">
              Where <span className="font-serif-italic">{profile.reviewer_name?.split(" ")[0]}</span> shows up.
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {profile.businesses_reviewed.map((b, i) => (
                <Link
                  key={b.slug}
                  to={`/business/${b.slug}`}
                  data-testid={`reviewer-business-chip-${b.slug}`}
                  className="u-card p-4 flex items-center gap-3 reveal group"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, #0B0B10 0%, #2A2545 45%, #5B3EEE 100%)" }}
                  >
                    {b.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{b.name}</div>
                    <div className="text-[11px] text-[color:var(--u-muted)] truncate">{b.category}</div>
                  </div>
                  <ArrowUpRight size={16} className="text-[color:var(--u-muted)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[color:var(--u-violet)] shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All reviews */}
        <div className="mt-14">
          <span className="u-pill"><span className="u-pill-dot" /> 02 · the receipts</span>
          <h2 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight mt-3 mb-6 leading-[1.05]">
            Every word, <span className="font-serif-italic mint-underline">on record</span>.
          </h2>

          {profile.reviews?.length === 0 ? (
            <div className="u-card p-12 text-center">
              <MessageSquareText className="mx-auto mb-3 text-[color:var(--u-muted)]" size={28} />
              <p className="text-[color:var(--u-ink-2)] font-medium">No reviews yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5" data-testid="reviewer-reviews-list">
              {profile.reviews.map((r, i) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  businessName={r.business_name}
                  audience={r.business_audience}
                  delay={i * 0.05}
                  showBusinessTag
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
