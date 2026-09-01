import { useEffect, useState } from "react";
import { Search, MessageSquareText, Sparkles } from "lucide-react";
import ReviewCard from "./ReviewCard";
import api from "@/lib/api";

export default function ReviewsSection({ slug, businessName, audience }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [sort, setSort] = useState("recent");
  const [q, setQ] = useState("");
  const [referredOnly, setReferredOnly] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (rating) params.set("rating", rating);
    if (sort) params.set("sort", sort);
    if (q) params.set("q", q);
    if (referredOnly) params.set("referred_only", "true");
    const t = setTimeout(() => {
      api
        .get(`/business/public/${slug}/reviews?${params.toString()}`)
        .then((res) => {
          if (!ignore) {
            setReviews(res.data.reviews || []);
            setLoading(false);
          }
        })
        .catch(() => !ignore && setLoading(false));
    }, 200);
    return () => {
      ignore = true;
      clearTimeout(t);
    };
  }, [slug, rating, sort, q, referredOnly]);

  return (
    <section id="reviews" className="max-w-[1320px] mx-auto px-6 lg:px-10 py-10 lg:py-14" data-testid="reviews-section">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <span className="u-pill"><span className="u-pill-dot" /> 02 · voices</span>
          <h2 className="font-display text-3xl lg:text-[2.75rem] font-semibold tracking-tight mt-3 max-w-2xl leading-[1.05]">
            Real words. <span className="font-serif-italic">Real</span> people.
          </h2>
        </div>
        <p className="text-sm text-[color:var(--u-muted)] max-w-xs">
          Every review captured from verified sources — no bots, no incentivized fluff.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="u-card p-3 lg:p-4 mb-6 flex flex-wrap items-center gap-2" data-testid="reviews-filters">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--u-muted)]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reviews by keyword..."
            data-testid="reviews-search"
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[color:var(--u-cream-2)] border border-transparent focus:border-[color:var(--u-ink)] focus:bg-white outline-none text-sm transition"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-full bg-[color:var(--u-cream-2)]">
          {[0, 5, 4, 3].map((r) => (
            <button
              key={r}
              data-testid={`filter-rating-${r}`}
              onClick={() => setRating(r)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                rating === r ? "bg-white shadow-sm text-[color:var(--u-ink)]" : "text-[color:var(--u-muted)] hover:text-[color:var(--u-ink)]"
              }`}
            >
              {r === 0 ? "All" : `${r}★`}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          data-testid="reviews-sort"
          className="px-4 py-2.5 rounded-full bg-[color:var(--u-cream-2)] border border-transparent focus:border-[color:var(--u-ink)] outline-none text-xs font-medium cursor-pointer"
        >
          <option value="recent">Most recent</option>
          <option value="top">Top rated</option>
          <option value="oldest">Oldest first</option>
        </select>

        <button
          data-testid="filter-referred"
          onClick={() => setReferredOnly((v) => !v)}
          className={`px-3.5 py-2 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition ${
            referredOnly
              ? "bg-[color:var(--u-violet)] text-white"
              : "bg-[color:var(--u-cream-2)] text-[color:var(--u-ink-2)] hover:bg-white border border-transparent hover:border-[color:var(--u-line-2)]"
          }`}
        >
          <Sparkles size={13} /> Referred by a friend
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="u-card p-12 text-center" data-testid="no-reviews">
          <MessageSquareText className="mx-auto mb-3 text-[color:var(--u-muted)]" size={28} />
          <p className="text-[color:var(--u-ink-2)] font-medium">No reviews match your filters</p>
          <p className="text-[color:var(--u-muted)] text-sm mt-1">Try clearing filters or searching a different keyword.</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="reviews-grid">
            {reviews.map((r, i) => (
              <ReviewCard key={r.id} review={r} businessName={businessName} audience={audience} delay={i * 0.04} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
