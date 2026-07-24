import { useEffect, useState } from "react";
import {
  Sparkles,
  Linkedin,
  Twitter,
  Instagram,
  RefreshCcw,
  CheckCircle2,
  Clock,
  Pencil,
  ArrowUpRight,
  Zap,
  Loader2,
} from "lucide-react";
import PageHero from "@/components/business/PageHero";
import { toast } from "sonner";
import { SOCIAL_POSTS, REVIEWS, PAGE_OUTCOMES, SMART_NBA, SIGNAL_THEMES } from "@/mocks/fintech";
import SocialAssetStudio from "@/components/business/SocialAssets";
import api, { formatApiError } from "@/lib/api";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0a66c2" },
  { id: "x", label: "X (Twitter)", icon: Twitter, color: "#111827" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#e1306c" },
];

const TONES = ["professional", "punchy", "founder-testimonial", "data-forward", "warm"];

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
  const [channelContent, setChannelContent] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const review = REVIEWS.find((r) => r.id === selectedReviewId);

  useEffect(() => {
    if (!review) return;
    let alive = true;
    setPreviewLoading(true);
    api
      .post("/social/generate", {
        testimonial: review.body,
        attribution: `${review.customer}${review.role ? ", " + review.role : review.location ? ", " + review.location : ""}`,
        company: "PayRewards",
        pov: "company",
        channels: ["linkedin", "instagram", "x"],
        tone,
      })
      .then((res) => {
        if (alive) setChannelContent(res.data?.channels || null);
      })
      .catch(() => {
        if (alive) setChannelContent(null);
      })
      .finally(() => alive && setPreviewLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReviewId, tone]);

  const generate = async () => {
    if (!review) return;
    setGenerating(true);
    try {
      const attribution = `${review.customer}${review.role ? ", " + review.role : review.location ? ", " + review.location : ""}`;
      const { data } = await api.post("/social/generate", {
        testimonial: review.body,
        attribution,
        company: "PayRewards",
        pov: "company",
        channels: [platform],
        tone,
      });
      const gen = data?.channels?.[platform];
      if (!gen) throw new Error("No content returned");
      const caption = [gen.eyebrow ? `${gen.eyebrow}\n` : "", gen.headline ? `${gen.headline}\n\n` : "", gen.caption].join("");
      const newPost = {
        id: `sp_${Date.now()}`,
        reviewId: review.id,
        platform,
        tone,
        status: "draft",
        scheduled: null,
        body: caption,
        cta: gen.cta || "",
        hashtags: (gen.hashtags || []).map((h) => `#${h}`),
        predictedReach: `${(8 + Math.random() * 30).toFixed(1)}k`,
        predictedEngagement: `${(2 + Math.random() * 4).toFixed(1)}%`,
      };
      setDrafts([newPost, ...drafts]);
      toast.success(`${PLATFORMS.find((p) => p.id === platform).label} draft generated — PayRewards voice`);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Couldn't generate that draft — try again");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div data-testid="social-agent-page" className="space-y-10">
      <PageHero
        eyebrow={PAGE_OUTCOMES.social.eyebrow}
        question={PAGE_OUTCOMES.social.question}
        northStar={PAGE_OUTCOMES.social.northStar}
        smartAction={SMART_NBA.social}
        onAction={() =>
          toast.success("Marcus B.'s testimonial amplified", {
            description: "Scheduled for LinkedIn 9am + X 11am ET.",
          })
        }
      />

      {/* Section header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-[#111827]">
            Compose from a customer testimonial
          </h2>
          <p className="text-[12.5px] text-[#9ca3af] mt-1">
            Every post is anchored to a real, approved testimonial.
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

        {/* Preview / Predicted metrics — all three platforms side-by-side */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-[#4b5563]">
            Live previews · LinkedIn · Instagram · X
            {previewLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6d46c6]" />}
          </div>
          <LinkedInPreview review={review} content={channelContent?.linkedin} loading={previewLoading} />
          <InstagramPreview review={review} content={channelContent?.instagram} loading={previewLoading} />
          <XPreview review={review} content={channelContent?.x} loading={previewLoading} />
        </div>
      </div>

      {/* Branded visual assets — reuses the same engine as the customer approval page */}
      {review && (
        <div className="pt-2">
          <SocialAssetStudio
            quote={review.body}
            attribution={`${review.customer}${review.role ? ", " + review.role : review.location ? ", " + review.location : ""}`}
            company="PayRewards"
            pov="company"
            heading="Branded visual assets"
            subheading="Polished, PayRewards-voice posts your marketing team can publish — a different tone and design for each channel."
            testId="social-branded-assets"
            publicUrl={typeof window !== "undefined" ? window.location.origin : ""}
          />
        </div>
      )}

      {/* Themes ready to move acquisition — moved here from Growth Signals */}
      <section data-testid="signal-themes" className="space-y-4 pt-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-[#111827]">
            Themes ready to move acquisition
          </h2>
          <span className="text-[12px] text-[#9ca3af]">
            Buyer language · ready to become ads and posts
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SIGNAL_THEMES.map((t) => (
            <div
              key={t.id}
              data-testid={`theme-${t.id}`}
              className="rounded-2xl border border-[#eeeaf6] bg-white p-5 hover:border-[#d9d1ee] transition-colors"
            >
              <div className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
                {t.category}
              </div>
              <div className="mt-2 font-display text-[18px] font-semibold leading-tight text-[#111827]">
                {t.theme}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <div className="font-display text-[24px] font-semibold text-[#0f9b7c] leading-none">
                  {t.lift}
                </div>
                <div className="text-[11px] text-[#4b5563]">{t.liftLabel}</div>
              </div>
              <div className="mt-3 rounded-lg bg-[#faf9ff] border border-[#eeeaf6] p-2.5">
                <p className="text-[12px] leading-relaxed text-[#111827] italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-1 text-[10.5px] font-mono text-[#6d46c6]">
                  — {t.quoteAttribution}
                </div>
              </div>
              <button
                data-testid={`theme-action-${t.id}`}
                onClick={() => toast.success(`Queued: ${t.action}`)}
                className="mt-3 text-[11.5px] font-medium text-[#6d46c6] hover:underline"
              >
                {t.action} →
              </button>
            </div>
          ))}
        </div>
      </section>

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

function copyChannelCaption(content, label) {
  if (!content) return;
  const tags = (content.hashtags || []).join(" ");
  const text = [content.eyebrow, content.headline, content.caption, tags, content.cta]
    .filter(Boolean)
    .join("\n\n");
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(`Copied ${label} draft`))
    .catch(() => toast.info("Copy not available"));
}

/* ─────────────── LinkedIn preview ─────────────── */
function LinkedInPreview({ content, loading }) {
  return (
    <div
      data-testid="preview-linkedin"
      className="rounded-2xl border border-[#eeeaf6] bg-white overflow-hidden shadow-[0_10px_40px_-30px_rgba(38,28,77,0.35)]"
    >
      <div className="px-4 py-3 border-b border-[#eeeaf6] flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#0a66c2]/15 flex items-center justify-center">
          <Linkedin className="w-4 h-4 text-[#0a66c2]" strokeWidth={1.75} />
        </div>
        <div>
          <div className="text-[12.5px] font-semibold text-[#111827] leading-tight">
            PayRewards
          </div>
          <div className="text-[10.5px] font-mono text-[#9ca3af]">
            LinkedIn · 8,412 followers
          </div>
        </div>
        <span className="ml-auto text-[10px] font-mono text-[#6d46c6]">
          drafted by uplaud
        </span>
      </div>
      <div className="p-4">
        {loading || !content ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 w-2/3 rounded bg-[#f2eefa]" />
            <div className="h-3 w-full rounded bg-[#f2eefa]" />
            <div className="h-3 w-5/6 rounded bg-[#f2eefa]" />
          </div>
        ) : (
          <>
            {content.eyebrow && (
              <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#6d46c6] mb-2">
                {content.eyebrow}
              </div>
            )}
            {content.headline && (
              <div className="font-display text-[15px] font-semibold text-[#111827] mb-1.5 leading-snug">
                {content.headline}
              </div>
            )}
            <p className="text-[13px] leading-relaxed text-[#111827] whitespace-pre-line">
              {content.caption}
            </p>
            {content.hashtags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {content.hashtags.map((h) => (
                  <span key={h} className="text-[11px] font-mono text-[#6d46c6]">
                    #{h}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <div className="px-4 py-3 bg-[#faf9ff] border-t border-[#eeeaf6] flex items-center gap-4 text-[11px] font-mono text-[#4b5563]">
        <span>Reach <b className="text-[#111827]">18.4k</b></span>
        <span>Eng <b className="text-[#111827]">4.6%</b></span>
        {content?.cta && <span className="text-[#6d46c6]">CTA: {content.cta}</span>}
        <button
          data-testid="preview-linkedin-copy"
          className="ml-auto text-[#6d46c6] hover:underline"
          onClick={() => copyChannelCaption(content, "LinkedIn")}
        >
          Copy
        </button>
      </div>
    </div>
  );
}

/* ─────────────── Instagram preview ─────────────── */
function InstagramPreview({ content, loading }) {
  return (
    <div
      data-testid="preview-instagram"
      className="rounded-2xl overflow-hidden bg-white border border-[#eeeaf6] shadow-[0_10px_40px_-30px_rgba(38,28,77,0.35)]"
    >
      <div className="px-4 py-3 border-b border-[#eeeaf6] flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background:
              "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
          }}
        >
          <Instagram className="w-4 h-4 text-white" strokeWidth={1.75} />
        </div>
        <div>
          <div className="text-[12.5px] font-semibold text-[#111827] leading-tight">
            payrewards
          </div>
          <div className="text-[10.5px] font-mono text-[#9ca3af]">
            Instagram · Post
          </div>
        </div>
        <span className="ml-auto text-[10px] font-mono text-[#6d46c6]">
          drafted by uplaud
        </span>
      </div>
      {/* Visual card */}
      <div
        className="relative aspect-[4/5] flex flex-col justify-between p-5"
        style={{
          background: "linear-gradient(135deg, #261c4d 0%, #6d46c6 55%, #5eead4 130%)",
        }}
      >
        {loading || !content ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white/70 animate-spin" />
          </div>
        ) : (
          <>
            <div className="text-[10px] font-mono text-white/70 uppercase tracking-[0.22em]">
              {content.headline || "Customer story"}
            </div>
            <div className="space-y-2">
              <div className="font-display text-white text-[20px] leading-[1.18] font-semibold">
                &ldquo;{content.quote}&rdquo;
              </div>
            </div>
          </>
        )}
      </div>
      <div className="p-4">
        {!loading && content && (
          <>
            <p className="text-[13px] leading-relaxed text-[#111827] whitespace-pre-line">
              {content.caption}
            </p>
            {content.hashtags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {content.hashtags.map((h) => (
                  <span key={h} className="text-[11px] font-mono text-[#6d46c6]">
                    #{h}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <div className="px-4 py-3 bg-[#faf9ff] border-t border-[#eeeaf6] flex items-center gap-4 text-[11px] font-mono text-[#4b5563]">
        <span>Est. reach <b className="text-[#111827]">22.8k</b></span>
        <span>Eng <b className="text-[#111827]">5.9%</b></span>
        <button
          data-testid="preview-instagram-copy"
          className="ml-auto text-[#6d46c6] hover:underline"
          onClick={() => copyChannelCaption(content, "Instagram")}
        >
          Copy
        </button>
      </div>
    </div>
  );
}

/* ─────────────── X (Twitter) preview ─────────────── */
function XPreview({ content, loading }) {
  return (
    <div
      data-testid="preview-x"
      className="rounded-2xl border border-[#eeeaf6] bg-white overflow-hidden shadow-[0_10px_40px_-30px_rgba(38,28,77,0.35)]"
    >
      <div className="px-4 py-3 border-b border-[#eeeaf6] flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
          <Twitter className="w-4 h-4 text-white" strokeWidth={1.75} />
        </div>
        <div>
          <div className="text-[12.5px] font-semibold text-[#111827] leading-tight flex items-center gap-1">
            PayRewards
            <span className="w-3.5 h-3.5 rounded-full bg-[#1d9bf0] text-white text-[8px] flex items-center justify-center font-bold">
              ✓
            </span>
          </div>
          <div className="text-[10.5px] font-mono text-[#9ca3af]">
            @payrewards · 12,204 followers
          </div>
        </div>
        <span className="ml-auto text-[10px] font-mono text-[#6d46c6]">
          drafted by uplaud
        </span>
      </div>
      <div className="p-4">
        {loading || !content ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 w-full rounded bg-[#f2eefa]" />
            <div className="h-3 w-3/4 rounded bg-[#f2eefa]" />
          </div>
        ) : (
          <>
            {content.headline && (
              <div className="font-display text-[14px] font-semibold text-[#111827] mb-1">
                {content.headline}
              </div>
            )}
            <p className="text-[14px] leading-[1.4] text-[#111827] whitespace-pre-line">
              {content.caption}
            </p>
            {content.hashtags?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {content.hashtags.map((h) => (
                  <span key={h} className="text-[12px] font-mono text-[#1d9bf0]">
                    #{h}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <div className="px-4 py-3 bg-[#faf9ff] border-t border-[#eeeaf6] flex items-center gap-4 text-[11px] font-mono text-[#4b5563]">
        <span>Impr <b className="text-[#111827]">42.1k</b></span>
        <span>Eng <b className="text-[#111827]">3.1%</b></span>
        <button
          data-testid="preview-x-copy"
          className="ml-auto text-[#6d46c6] hover:underline"
          onClick={() => copyChannelCaption(content, "X")}
        >
          Copy
        </button>
      </div>
    </div>
  );
}
