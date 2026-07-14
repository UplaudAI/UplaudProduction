import { BadgeCheck, Sparkles, MessageCircle } from "lucide-react";

function Stars({ n }) {
  return (
    <div className="inline-flex" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-base leading-none" style={{ color: i < n ? "var(--u-star)" : "var(--u-line-2)" }}>★</span>
      ))}
    </div>
  );
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

const AVATAR_COLORS = [
  ["#5B3EEE", "#7CE8C8"],
  ["#0B0B10", "#5B3EEE"],
  ["#7CE8C8", "#F5B14E"],
  ["#FF7A66", "#F5B14E"],
  ["#5DDCBA", "#5B3EEE"],
  ["#F5B14E", "#FF7A66"],
];

export default function ReviewCard({ review, delay = 0 }) {
  const initials = (review.reviewer_name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const colorIdx = (review.reviewer_name?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  const [c1, c2] = AVATAR_COLORS[colorIdx];

  return (
    <article
      className="u-card p-6 flex flex-col reveal group"
      style={{ animationDelay: `${delay}s` }}
      data-testid={`review-card-${review.id}`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-medium truncate">{review.reviewer_name}</span>
            {review.verified && <BadgeCheck size={14} className="text-[color:var(--u-violet)] shrink-0" />}
          </div>
          <div className="text-[11px] text-[color:var(--u-muted)] flex items-center gap-2">
            <span>{formatDate(review.date)}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={10} /> {review.channel === "whatsapp" ? "via WhatsApp" : review.channel}
            </span>
          </div>
        </div>
        <div className="text-2xl">{review.emoji}</div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <Stars n={review.rating} />
        {review.referred && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full text-[color:var(--u-violet)]" style={{ background: "var(--u-violet-soft)" }}>
            <Sparkles size={10} /> Referred a friend
          </span>
        )}
      </div>

      <p className="text-[color:var(--u-ink-2)] text-[15px] leading-relaxed">
        {review.text}
      </p>

      <div className="mt-5 pt-4 border-t border-[color:var(--u-line)] flex items-center justify-between text-xs text-[color:var(--u-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--u-mint-2)]" />
          Verified purchase
        </span>
        <span className="opacity-0 group-hover:opacity-100 transition text-[color:var(--u-ink-2)] font-medium">
          Share →
        </span>
      </div>
    </article>
  );
}
