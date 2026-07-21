import { useState } from "react";
import {
  Search,
  Ghost,
  MessageSquare,
  ArrowUpFromLine,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  Send,
  RefreshCcw,
  Copy,
  ArrowUp,
} from "lucide-react";
import { REDDIT_THREADS, REVIEWS, PAGE_OUTCOMES } from "@/mocks/fintech";
import { toast } from "sonner";
import PageHero from "@/components/business/PageHero";

const PRESET_QUERIES = [
  "fee-only advisor",
  "retirement planning",
  "QSBS + Roth",
  "US-UK cross border",
  "post-divorce finances",
];

export default function RedditAgentPage() {
  const [query, setQuery] = useState("fee-only advisor");
  const [selectedId, setSelectedId] = useState(REDDIT_THREADS[0].id);
  const [refreshing, setRefreshing] = useState(false);

  const thread = REDDIT_THREADS.find((t) => t.id === selectedId);
  const sourceReview = REVIEWS.find((r) => r.id === thread.suggestedReply.reviewId);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success("Reddit index refreshed", {
        description: "4 new opportunity threads found.",
      });
    }, 900);
  };

  return (
    <div data-testid="reddit-agent-page" className="space-y-10">
      <PageHero
        eyebrow={PAGE_OUTCOMES.reddit.eyebrow}
        question={PAGE_OUTCOMES.reddit.question}
        northStar={PAGE_OUTCOMES.reddit.northStar}
        action={PAGE_OUTCOMES.reddit.action}
      />

      {/* Section header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-[#111827]">
            High-intent threads worth answering
          </h2>
          <p className="text-[12.5px] text-[#9ca3af] mt-1">
            Every reply anchors to a real customer review.
          </p>
        </div>
        <button
          data-testid="reddit-refresh-btn"
          onClick={refresh}
          className="btn-secondary h-10 !py-0"
        >
          <RefreshCcw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            strokeWidth={1.75}
          />
          Refresh index
        </button>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-[#eeeaf6] bg-white p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9ca3af] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              data-testid="reddit-query-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Try "wealth manager for tech employees"...'
              className="w-full h-11 pl-10 pr-4 rounded-full border border-[#eeeaf6] bg-white text-[13px] focus:outline-none focus:border-[#d9d1ee] transition-all"
            />
          </div>
          <button
            data-testid="reddit-search-btn"
            className="btn-primary h-11 !py-0 justify-center"
          >
            <Sparkles className="w-4 h-4" strokeWidth={2} />
            Find opportunities
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-[#9ca3af] mr-1">
            Presets:
          </span>
          {PRESET_QUERIES.map((q) => (
            <button
              key={q}
              data-testid={`preset-${q.replace(/\s+/g, "-")}`}
              onClick={() => setQuery(q)}
              className={`px-3 py-1 rounded-full text-[11.5px] font-medium border transition-all ${
                query === q
                  ? "bg-[#111827] text-white border-[#111827]"
                  : "bg-white text-[#4b5563] border-[#eeeaf6] hover:border-[#d9d1ee]"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Threads + reply composer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Thread list */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#4b5563]">
            {REDDIT_THREADS.length} opportunity threads
          </div>
          {REDDIT_THREADS.map((t) => (
            <button
              key={t.id}
              data-testid={`thread-card-${t.id}`}
              onClick={() => setSelectedId(t.id)}
              className={`w-full text-left rounded-2xl border p-4 transition-all ${
                selectedId === t.id
                  ? "border-[#6d46c6] bg-[#f5f3ff]"
                  : "border-[#eeeaf6] bg-white hover:border-[#d9d1ee]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#ff4500] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  r/
                </div>
                <div className="text-[11.5px] font-mono text-[#4b5563] truncate">
                  {t.subreddit}
                </div>
                <span className="ml-auto text-[10px] font-mono text-[#0f9b7c] bg-[#ecfdf7] border border-[#c8f0e4] rounded-full px-2 py-0.5">
                  {Math.round(t.matchScore * 100)}% match
                </span>
              </div>
              <div className="mt-2 text-[13px] font-medium text-[#111827] leading-tight line-clamp-2">
                {t.title}
              </div>
              <p className="mt-1.5 text-[12px] text-[#4b5563] line-clamp-2 leading-relaxed">
                {t.excerpt}
              </p>
              <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-[#9ca3af]">
                <span className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" strokeWidth={2} />
                  {t.upvotes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" strokeWidth={1.75} />
                  {t.comments}
                </span>
                <span>·</span>
                <span>{t.author}</span>
                <span className="ml-auto text-[#4b5563]">{t.posted}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Reply composer */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-[#eeeaf6] bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <Ghost className="w-4 h-4 text-[#ff4500]" strokeWidth={1.75} />
              <div className="text-[13px] font-display font-semibold text-[#111827]">
                Suggested reply · drafted by Uplaud
              </div>
            </div>

            {/* Original thread quote */}
            <div className="rounded-xl bg-[#faf9ff] border border-[#eeeaf6] p-4">
              <div className="text-[11.5px] font-mono text-[#4b5563]">
                {thread.subreddit} · {thread.author}
              </div>
              <div className="mt-1 text-[13.5px] font-medium text-[#111827] leading-snug">
                {thread.title}
              </div>
              <p className="mt-2 text-[12.5px] text-[#4b5563] leading-relaxed">
                {thread.excerpt}
              </p>
            </div>

            {/* Sourced review */}
            {sourceReview && (
              <div className="mt-4 rounded-xl border border-[#c8f0e4] bg-[#ecfdf7] p-4">
                <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#0f9b7c]">
                  Reply anchored to real review
                </div>
                <div className="mt-1 text-[12.5px] font-medium text-[#111827]">
                  {sourceReview.customer} · {sourceReview.rating}★
                </div>
                <p className="mt-1 text-[12.5px] text-[#4b5563] leading-relaxed line-clamp-2">
                  &ldquo;{sourceReview.body}&rdquo;
                </p>
              </div>
            )}

            {/* Draft */}
            <div className="mt-4">
              <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#4b5563]">
                Reply draft · tone: {thread.suggestedReply.tone}
              </div>
              <textarea
                data-testid="reddit-reply-textarea"
                defaultValue={thread.suggestedReply.body}
                rows={5}
                className="mt-2 w-full p-4 rounded-xl border border-[#eeeaf6] bg-white text-[13.5px] leading-relaxed focus:outline-none focus:border-[#d9d1ee] resize-none"
              />
              <div className="mt-2 flex items-center gap-3 text-[11px] font-mono text-[#9ca3af]">
                <ShieldCheck
                  className="w-3.5 h-3.5 text-[#0f9b7c]"
                  strokeWidth={1.75}
                />
                <span>
                  Policy check passed · <b className="text-[#111827]">no promo language</b> · <b className="text-[#111827]">discloses source</b>
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                data-testid="reddit-regenerate-btn"
                onClick={() => toast.success("Draft regenerated")}
                className="btn-secondary h-10 !py-0"
              >
                <RefreshCcw className="w-4 h-4" strokeWidth={1.75} />
                Regenerate
              </button>
              <button
                data-testid="reddit-copy-btn"
                onClick={() => toast.success("Copied to clipboard")}
                className="btn-secondary h-10 !py-0"
              >
                <Copy className="w-4 h-4" strokeWidth={1.75} />
                Copy
              </button>
              <button
                data-testid="reddit-open-thread-btn"
                onClick={() =>
                  toast.info("Would open the Reddit thread in a new tab")
                }
                className="btn-secondary h-10 !py-0"
              >
                Open thread
                <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
              </button>
              <button
                data-testid="reddit-schedule-btn"
                onClick={() =>
                  toast.success("Queued for tomorrow 10:00 AM ET", {
                    description: "Cadence-safe: 1 reply per 24h in this sub.",
                  })
                }
                className="ml-auto btn-secondary h-10 !py-0"
              >
                Schedule
              </button>
              <button
                data-testid="reddit-post-btn"
                onClick={() =>
                  toast.success(`Reply posted to ${thread.subreddit}`, {
                    description: "Tracked in Attribution → Reddit channel.",
                  })
                }
                className="btn-primary h-10 !py-0"
              >
                <Send className="w-4 h-4" strokeWidth={1.75} />
                Post reply
              </button>
            </div>
          </div>

          {/* Guardrails card */}
          <div className="rounded-2xl bg-[#261c4d] text-white p-5 relative overflow-hidden noise">
            <div
              aria-hidden
              className="absolute -top-16 -right-8 w-[280px] h-[280px] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(94,234,212,0.22), transparent 60%)",
              }}
            />
            <div className="relative flex items-center gap-3">
              <ShieldCheck
                className="w-5 h-5 text-[#5eead4]"
                strokeWidth={1.75}
              />
              <div>
                <div className="text-[13px] font-display font-semibold">
                  Reddit guardrails are on
                </div>
                <p className="text-[12px] text-white/60 mt-0.5">
                  Rate-limited per subreddit · sourced-only claims · always
                  discloses affiliation when relevant.
                </p>
              </div>
              <ArrowUpFromLine
                className="ml-auto w-4 h-4 text-white/60"
                strokeWidth={1.75}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
