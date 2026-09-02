import { BadgeCheck, Sparkles, MessageCircle, Share2, Video, ShieldCheck } from "lucide-react";

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
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return iso; }
}

const AVATAR_COLORS = [
  ["#5B3EEE", "#7CE8C8"],
  ["#0B0B10", "#5B3EEE"],
  ["#7CE8C8", "#F5B14E"],
  ["#FF7A66", "#F5B14E"],
  ["#5DDCBA", "#5B3EEE"],
  ["#F5B14E", "#FF7A66"],
];

function buildReferralUrl(review, businessName) {
  const name = businessName || "this business";
  const slug = review.business_slug || "";
  const url = `https://www.uplaud.ai/business/public/${slug}`;
  return `https://wa.me/?text=${encodeURIComponent(`Check out ${name} on Uplaud: ${url}`)}`;
}

export function displayReviewSource(source) {
  return (source || "").trim() || "WA";
}

export function normalizeReviewRating(rating) {
  const parsed = Number.parseInt(rating, 10);
  if (!Number.isFinite(parsed)) return 5;
  return Math.max(1, Math.min(5, parsed));
}

function isDisplayEmoji(value) {
  return /\p{Extended_Pictographic}/u.test(value || "");
}

export default function ReviewCard({ review, businessName, audience, delay = 0 }) {
  const isB2B = audience === "b2b";
  const isDemo = review.verification_type === "demo";
  const initials = (review.reviewer_name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const colorIdx = (review.reviewer_name?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  const [c1, c2] = AVATAR_COLORS[colorIdx];
  const rating = normalizeReviewRating(review.rating);
  const isFiveStar = rating >= 5;
  const sourceLabel = displayReviewSource(review.channel || review.source);

  return (
    <article
      className="u-card p-5 flex flex-col reveal group relative"
      style={{ animationDelay: `${delay}s` }}
      data-testid={`review-card-${review.id}`}
    >
      {isFiveStar && (
        <span
          className="absolute -top-2 -right-2 inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-2 py-1 rounded-full"
          style={{ background: "var(--u-mint)", color: "var(--u-ink)" }}
        >
          <Sparkles size={9} /> 5★
        </span>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0"
          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm truncate">{review.reviewer_name}</span>
            {review.verified && <BadgeCheck size={13} className="text-[color:var(--u-violet)] shrink-0" />}
          </div>
          {review.reviewer_title && (
            <div className="text-[11px] text-[color:var(--u-ink-2)] truncate">{review.reviewer_title}</div>
          )}
          <div className="text-[10px] text-[color:var(--u-muted)] font-mono uppercase tracking-wider flex items-center gap-1.5">
            <span>{formatDate(review.date)}</span>
            <span>·</span>
            <MessageCircle size={9} /> {sourceLabel}
          </div>
        </div>
        {isDisplayEmoji(review.emoji) && <div className="text-xl leading-none">{review.emoji}</div>}
      </div>

      <div className="flex items-center justify-between mb-2.5">
        <Stars n={rating} />
        {review.referred && (
          <span className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full text-[color:var(--u-violet)]" style={{ background: "var(--u-violet-soft)" }}>
            <Sparkles size={9} /> referred
          </span>
        )}
      </div>

      <p className="text-[color:var(--u-ink-2)] text-[14px] leading-relaxed flex-1">
        {review.text}
      </p>

      <div className="mt-4 pt-3 border-t border-[color:var(--u-line)] flex items-center justify-between">
        {isDemo ? (
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider"
            style={{ color: "var(--u-violet)" }}
            data-testid={`verification-badge-${review.id}`}
          >
            <Video size={11} />
            Verified demo
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 text-[10px] text-[color:var(--u-muted)] font-mono uppercase tracking-wider"
            data-testid={`verification-badge-${review.id}`}
          >
            <ShieldCheck size={11} className="text-[color:var(--u-mint-2)]" />
            {isB2B ? "Verified subscriber" : "Verified purchase"}
          </span>
        )}

        {isFiveStar ? (
          <a
            href={buildReferralUrl(review, businessName)}
            target="_blank"
            rel="noreferrer"
            data-testid={`referral-btn-${review.id}`}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full transition group/refer"
            style={{ background: "#0B0B10", color: "white" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#25D366")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0B0B10")}
          >
            <Share2 size={11} /> Refer via WhatsApp
          </a>
        ) : (
          <span className="text-[10px] text-[color:var(--u-muted)] opacity-0 group-hover:opacity-100 transition">
            Share →
          </span>
        )}
      </div>
    </article>
  );
}
