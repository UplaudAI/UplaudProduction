import { useState } from "react";
import {
  Sparkles,
  Linkedin,
  Twitter,
  Instagram,
  Copy,
  RefreshCcw,
  CalendarClock,
  Send,
  CheckCircle2,
  Clock,
  Pencil,
  ArrowUpRight,
  Zap,
} from "lucide-react";
import { SOCIAL_POSTS, REVIEWS, PAGE_OUTCOMES } from "@/mocks/fintech";
import { toast } from "sonner";
import PageHero from "@/components/business/PageHero";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0a66c2" },
  { id: "x", label: "X (Twitter)", icon: Twitter, color: "#111827" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#e1306c" },
];

const TONES = ["professional", "punchy", "founder-story", "data-forward", "warm"];

const STATUS_META = {
  draft: { label: "Draft", color: "text-[#6d46c6]", bg: "bg-[#f5f3ff]", icon: Pencil },
  scheduled: { label: "Scheduled", color: "text-[#a16207]", bg: "bg-[#fef9c3]", icon: Clock },
  published: { label: "Published", color: "text-[#0f9b7c]", bg: "bg-[#ecfdf7]", icon: CheckCircle2 },
};

export default function SocialAgentPage() {
  const [selectedReviewId, setSelectedReviewId] = useState("rv_001");
  const [platform, setPlatform] = useState("linkedin");
  const [tone, setTone] = useState("professional");
  const [drafts, setDrafts] = useState(SOCIAL_POSTS);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(null);

  const review = REVIEWS.find((r) => r.id === selectedReviewId);

  const generate = () => {
    setGenerating(true);
    setPreview(null);
    setTimeout(() => {
      const body = draftFor(review, platform, tone);
      const newPost = {
        id: `sp_${Date.now()}`,
        reviewId: review.id,
        platform,
        tone,
        status: "draft",
        scheduled: null,
        body,
        hashtags: ["#feeonly", "#trustengine"],
        predictedReach: `${(8 + Math.random() * 30).toFixed(1)}k`,
        predictedEngagement: `${(2 + Math.random() * 4).toFixed(1)}%`,
      };
      setDrafts([newPost, ...drafts]);
      setPreview(newPost);
      setGenerating(false);
    }, 900);
  };

  return (
    <div data-testid="social-agent-page" className="space-y-10">
      <PageHero
        eyebrow={PAGE_OUTCOMES.social.eyebrow}
        question={PAGE_OUTCOMES.social.question}
        northStar={PAGE_OUTCOMES.social.northStar}
        action={PAGE_OUTCOMES.social.action}
        onAction={() =>
          toast.success("Marcus B.'s story amplified", {
            description: "Scheduled for LinkedIn 9am + X 11am ET.",
          })
        }
      />

      {/* Section header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-[#111827]">
            Compose from a customer story
          </h2>
          <p className="text-[12.5px] text-[#9ca3af] mt-1">
            Every post is anchored to a real, approved story.
          </p>
        </div>
        <button
          data-testid="social-connect-accounts-btn"
          className="btn-secondary h-10 !py-0"
        >
          Connect accounts
          <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-2xl border border-[#eeeaf6] bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#6d46c6]" strokeWidth={1.75} />
            <div className="text-[13px] font-display font-semibold text-[#111827]">
              Compose from a review
            </div>
          </div>

          {/* Source review picker */}
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#4b5563]">
                Source review
              </label>
              <select
                data-testid="social-review-select"
                value={selectedReviewId}
                onChange={(e) => setSelectedReviewId(e.target.value)}
                className="mt-2 w-full h-11 px-4 rounded-xl border border-[#eeeaf6] bg-white text-[13px] focus:outline-none focus:border-[#d9d1ee]"
              >
                {REVIEWS.filter((r) => r.rating >= 4).map((r) => {
                  const label = r.customer + " · " + r.title;
                  return <option key={r.id} value={r.id} label={label}>{label}</option>;
                })}
              </select>
            </div>

            {/* Selected review preview */}
            {review && (
              <div
                data-testid="social-review-preview"
                className="rounded-xl bg-[#faf9ff] border border-[#eeeaf6] p-4"
              >
                <div className="text-[12.5px] font-medium text-[#111827] leading-tight">
                  {review.title}
                </div>
                <p className="text-[12.5px] text-[#4b5563] mt-1.5 leading-relaxed">
                  &ldquo;{review.body}&rdquo;
                </p>
                <div className="mt-2 text-[10.5px] font-mono text-[#9ca3af]">
                  {review.customer} · {review.rating}★ · {review.source}
                </div>
              </div>
            )}

            {/* Platform */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#4b5563]">
                Platform
              </label>
              <div className="mt-2 flex gap-2">
                {PLATFORMS.map((p) => {
                  const active = platform === p.id;
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      data-testid={`platform-${p.id}`}
                      onClick={() => setPlatform(p.id)}
                      className={`flex-1 h-11 px-4 rounded-xl border text-[13px] font-medium flex items-center justify-center gap-2 transition-all ${
                        active
                          ? "border-[#6d46c6] bg-[#f5f3ff] text-[#261c4d]"
                          : "border-[#eeeaf6] bg-white text-[#4b5563] hover:border-[#d9d1ee]"
                      }`}
                    >
                      <Icon
                        className="w-4 h-4"
                        strokeWidth={1.75}
                        style={{ color: active ? p.color : undefined }}
                      />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tone */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#4b5563]">
                Tone
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t}
                    data-testid={`tone-${t}`}
                    onClick={() => setTone(t)}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                      tone === t
                        ? "bg-[#111827] text-white border-[#111827]"
                        : "bg-white text-[#4b5563] border-[#eeeaf6] hover:border-[#d9d1ee]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              data-testid="social-generate-btn"
              onClick={generate}
              disabled={generating}
              className="btn-primary w-full justify-center h-12"
            >
              {generating ? (
                <>
                  <RefreshCcw
                    className="w-4 h-4 animate-spin"
                    strokeWidth={2}
                  />
                  Drafting...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" strokeWidth={2} />
                  Generate draft
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview / Predicted metrics */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#4b5563]">
            Live preview
          </div>
          <PostPreview
            data={
              preview ||
              drafts.find((d) => d.platform === platform && d.status === "draft") ||
              drafts[0]
            }
            review={review}
          />
        </div>
      </div>

      {/* Queue */}
      <div className="rounded-2xl border border-[#eeeaf6] bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#eeeaf6] flex items-center justify-between">
          <div className="text-[14px] font-display font-semibold text-[#111827]">
            Post queue
          </div>
          <div className="text-[11.5px] font-mono text-[#9ca3af]">
            {drafts.length} posts
          </div>
        </div>
        <div className="divide-y divide-[#f2eefa]">
          {drafts.map((d) => (
            <PostRow key={d.id} data={d} review={REVIEWS.find((r) => r.id === d.reviewId)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PostPreview({ data, review }) {
  if (!data) return null;
  const platform = PLATFORMS.find((p) => p.id === data.platform);
  const Icon = platform.icon;

  return (
    <div
      data-testid="social-preview-card"
      className="rounded-2xl border border-[#eeeaf6] bg-white overflow-hidden shadow-[0_10px_40px_-30px_rgba(38,28,77,0.35)]"
    >
      <div className="px-4 py-3 border-b border-[#eeeaf6] flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${platform.color}18` }}
        >
          <Icon
            className="w-4 h-4"
            strokeWidth={1.75}
            style={{ color: platform.color }}
          />
        </div>
        <div>
          <div className="text-[12.5px] font-semibold text-[#111827] leading-tight">
            Westgate Wealth
          </div>
          <div className="text-[10.5px] font-mono text-[#9ca3af]">
            westgate.finance · {platform.label}
          </div>
        </div>
        <span className="ml-auto text-[10px] font-mono text-[#6d46c6]">
          drafted by uplaud
        </span>
      </div>

      <div className="p-4">
        <p className="text-[13px] leading-relaxed text-[#111827] whitespace-pre-line">
          {data.body}
        </p>
        {data.hashtags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.hashtags.map((h) => (
              <span
                key={h}
                className="text-[11px] font-mono text-[#6d46c6]"
              >
                {h}
              </span>
            ))}
          </div>
        )}
        {review && (
          <div className="mt-4 rounded-lg bg-[#faf9ff] border border-[#eeeaf6] p-3">
            <div className="text-[10.5px] font-mono text-[#9ca3af]">
              Sourced from
            </div>
            <div className="text-[12px] font-medium text-[#111827] mt-0.5">
              {review.customer} · {review.rating}★
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-[#faf9ff] border-t border-[#eeeaf6] flex items-center gap-4 text-[11px] font-mono text-[#4b5563]">
        <span>
          Reach <b className="text-[#111827]">{data.predictedReach}</b>
        </span>
        <span>
          Eng <b className="text-[#111827]">{data.predictedEngagement}</b>
        </span>
        <button
          data-testid="preview-copy-btn"
          className="ml-auto text-[#6d46c6] hover:underline flex items-center gap-1"
          onClick={() => toast.success("Copied to clipboard")}
        >
          <Copy className="w-3.5 h-3.5" strokeWidth={1.75} /> Copy
        </button>
      </div>

      <div className="p-4 border-t border-[#eeeaf6] flex gap-2">
        <button
          data-testid="preview-schedule-btn"
          onClick={() => toast.success("Scheduled for Feb 14, 9:00 AM")}
          className="btn-secondary flex-1 justify-center h-10"
        >
          <CalendarClock className="w-4 h-4" strokeWidth={1.75} />
          Schedule
        </button>
        <button
          data-testid="preview-publish-btn"
          onClick={() => toast.success("Published to " + platform.label)}
          className="btn-primary flex-1 justify-center h-10"
        >
          <Send className="w-4 h-4" strokeWidth={1.75} />
          Publish now
        </button>
      </div>
    </div>
  );
}

function PostRow({ data, review }) {
  const platform = PLATFORMS.find((p) => p.id === data.platform);
  const status = STATUS_META[data.status];
  const Icon = platform.icon;
  const StatusIcon = status.icon;

  return (
    <div
      data-testid={`post-row-${data.id}`}
      className="px-6 py-4 flex items-center gap-4 hover:bg-[#faf9ff] transition-colors"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${platform.color}18` }}
      >
        <Icon
          className="w-4 h-4"
          strokeWidth={1.75}
          style={{ color: platform.color }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-[#111827] line-clamp-1">
          {data.body.split("\n")[0]}
        </div>
        <div className="text-[11px] font-mono text-[#9ca3af] mt-0.5">
          {review?.customer || "—"} · {data.tone} ·{" "}
          {data.scheduled
            ? new Date(data.scheduled).toLocaleDateString()
            : "unscheduled"}
        </div>
      </div>
      <div className="hidden md:flex items-center gap-4 text-[11px] font-mono text-[#4b5563]">
        <span>reach {data.predictedReach}</span>
        <span>eng {data.predictedEngagement}</span>
      </div>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${status.bg} ${status.color}`}
      >
        <StatusIcon className="w-3 h-3" strokeWidth={2} />
        {status.label}
      </span>
    </div>
  );
}

function draftFor(review, platform, tone) {
  if (!review) return "";
  const attrib = `${review.customer.split(" ")[0]} ${review.customer.split(" ")[1]?.[0] || ""}.`;
  if (platform === "linkedin")
    return `"${trim(review.body, 90)}"\n\n— ${attrib}, ${review.location}\n\nAt Westgate, we don't sell products. We rebuild plans.\n\nWant to see what fee-only really looks like? →`;
  if (platform === "x")
    return `"${trim(review.body, 140)}"\n\n— ${attrib}\n\nFee-only. Flat rate. Zero product pushing.`;
  return `${attrib}'s story ↓\n\n"${trim(review.body, 110)}"\n\nWhat a real plan looks like. Link in bio.`;
}

function trim(str, n) {
  if (str.length <= n) return str;
  return str.slice(0, n).trim() + "…";
}
