import { useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  Linkedin,
  Twitter,
  Instagram,
  RefreshCcw,
  ArrowUpRight,
  Loader2,
  Copy,
} from "lucide-react";
import PageHero from "@/components/business/PageHero";
import { getAuth } from "@/lib/business-storage";
import { toast } from "sonner";
import SocialAssetStudio from "@/components/business/SocialAssets";
import api, { formatApiError } from "@/lib/api";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "#0a66c2" },
  { id: "x", label: "X (Twitter)", icon: Twitter, color: "#111827" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "#e1306c" },
];

const TONES = ["professional", "punchy", "founder-testimonial", "data-forward", "warm"];

export default function SocialAgentPage() {
  const user = getAuth();
  const businessName = user?.workspace || user?.company || "My Company";
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [selectedReviewId, setSelectedReviewId] = useState("");
  const [platform, setPlatform] = useState("linkedin");
  const [tone, setTone] = useState("professional");
  const [generating, setGenerating] = useState(false);
  const [channelContent, setChannelContent] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const review = testimonials.find((r) => r.id === selectedReviewId);

  useEffect(() => {
    let alive = true;
    api
      .get("/testimonials")
      .then((res) => {
        if (!alive) return;
        const list = res.data || [];
        setTestimonials(list);
        if (list.length > 0) setSelectedReviewId(list[0].id);
      })
      .catch(() => {
        if (alive) toast.error("Couldn't load testimonials from Uplaud");
      })
      .finally(() => alive && setLoadingTestimonials(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!review) return;
    let alive = true;
    setPreviewLoading(true);
    api
      .post("/social/generate", {
        testimonial: review.body,
        attribution: review.customer,
        company: businessName,
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
      const { data } = await api.post("/social/generate", {
        testimonial: review.body,
        attribution: review.customer,
        company: businessName,
        pov: "company",
        channels: [platform],
        tone,
      });
      const gen = data?.channels?.[platform];
      if (!gen) throw new Error("No content returned");
      const tags = (gen.hashtags || []).map((h) => `#${h}`).join(" ");
      const text = [gen.eyebrow, gen.headline, gen.caption, tags, gen.cta].filter(Boolean).join("\n\n");
      await navigator.clipboard.writeText(text);
      toast.success(`${PLATFORMS.find((p) => p.id === platform).label} draft copied — ready to paste`, {
        description: "PayRewards voice, grounded in this testimonial.",
      });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Couldn't generate that draft — try again");
    } finally {
      setGenerating(false);
    }
  };

  const northStar = useMemo(() => {
    if (testimonials.length === 0) {
      return {
        label: "Approved testimonials ready to amplify",
        value: "0",
        delta: "Approve a testimonial in Growth Signals to unlock amplification",
        attribution:
          "Every post here is drafted in PayRewards' brand voice and grounded in a real, approved customer testimonial — nothing goes out until you connect an account.",
      };
    }
    return {
      label: "Approved testimonials ready to amplify",
      value: `${testimonials.length}`,
      delta: "across LinkedIn, Instagram and X",
      attribution:
        "Sourced live from your Uplaud testimonials — draft channel-native posts below, then connect an account to publish.",
    };
  }, [testimonials]);

  const smartAction = useMemo(() => {
    if (testimonials.length === 0) {
      return {
        eyebrow: "Intelligent action",
        headline: "No approved testimonials yet",
        reasoning: [],
        outcome: "Approve a testimonial in Growth Signals to unlock a personalized amplification plan here.",
        cta: "Go to Growth Signals",
      };
    }
    const top = testimonials[0];
    return {
      eyebrow: "Intelligent action",
      headline: `${top.customer}'s testimonial is ready to amplify`,
      reasoning: [
        { label: "Source", value: top.source || "Uplaud" },
        top.sentiment ? { label: "Sentiment", value: top.sentiment } : null,
        top.date_added ? { label: "Captured", value: top.date_added } : null,
      ].filter(Boolean),
      outcome: "Draft channel-native posts for LinkedIn, Instagram and X in PayRewards' voice below.",
      cta: "Generate drafts for this testimonial",
    };
  }, [testimonials]);

  const handleIntelligentAction = () => {
    if (testimonials.length === 0) {
      toast.info("Head to Growth Signals to approve a testimonial first");
      return;
    }
    setSelectedReviewId(testimonials[0].id);
    toast.success("Loaded top testimonial into the composer");
  };

  return (
    <div data-testid="social-agent-page" className="space-y-10">
      <PageHero
        eyebrow={`Growth Amplification · ${businessName}`}
        question="Which testimonial should you amplify next?"
        northStar={northStar}
        smartAction={smartAction}
        onAction={handleIntelligentAction}
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
                Source testimonial (from Uplaud · {businessName})
              </label>
              {loadingTestimonials ? (
                <div className="mt-2 h-11 rounded-xl border border-[#eeeaf6] bg-[#faf9ff] animate-pulse" />
              ) : testimonials.length === 0 ? (
                <div
                  data-testid="social-no-testimonials"
                  className="mt-2 rounded-xl border border-[#eeeaf6] bg-[#faf9ff] p-4 text-[12.5px] text-[#9ca3af]"
                >
                  No approved testimonials yet for {businessName} in Uplaud — import & approve a customer source first.
                </div>
              ) : (
                <select
                  data-testid="social-review-select"
                  value={selectedReviewId}
                  onChange={(e) => setSelectedReviewId(e.target.value)}
                  className="mt-2 w-full h-11 px-4 rounded-xl border border-[#eeeaf6] bg-white text-[13px] focus:outline-none focus:border-[#d9d1ee]"
                >
                  {testimonials.map((r) => {
                    const label = `${r.customer} · ${trimLabel(r.body, 60)}`;
                    return (
                      <option key={r.id} value={r.id} label={label}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Selected review preview */}
            {review && (
              <div
                data-testid="social-review-preview"
                className="rounded-xl bg-[#faf9ff] border border-[#eeeaf6] p-4"
              >
                <p className="text-[12.5px] text-[#4b5563] leading-relaxed">
                  &ldquo;{review.body}&rdquo;
                </p>
                <div className="mt-2 text-[10.5px] font-mono text-[#9ca3af]">
                  {review.customer} · {review.rating ? `${review.rating}★ · ` : ""}
                  {review.source}
                  {review.sentiment && ` · ${review.sentiment} sentiment`}
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
              disabled={generating || !review}
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
                  <Copy className="w-4 h-4" strokeWidth={2} />
                  Generate & copy draft
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
          <LinkedInPreview businessName={businessName} content={channelContent?.linkedin} loading={previewLoading} />
          <InstagramPreview businessName={businessName} content={channelContent?.instagram} loading={previewLoading} />
          <XPreview businessName={businessName} content={channelContent?.x} loading={previewLoading} />
        </div>
      </div>

      {/* Branded visual assets — reuses the same engine as the customer approval page */}
      {review && (
        <div className="pt-2">
          <SocialAssetStudio
            quote={review.body}
            attribution={review.customer}
            company={businessName}
            pov="company"
            heading="Branded visual assets"
            subheading="Polished, PayRewards-voice posts your marketing team can publish — a different tone and design for each channel."
            testId="social-branded-assets"
            publicUrl={typeof window !== "undefined" ? window.location.origin : ""}
          />
        </div>
      )}
    </div>
  );
}

function trimLabel(str, n) {
  const s = (str || "").trim();
  if (s.length <= n) return s;
  return s.slice(0, n).trim() + "…";
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
function LinkedInPreview({ content, loading, businessName = "PayRewards" }) {
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
            {businessName}
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
function InstagramPreview({ content, loading, businessName = "PayRewards" }) {
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
            {businessName.toLowerCase().replace(/[^a-z0-9]+/g, "")}
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
        className="relative aspect-[4/5] flex flex-col p-6"
        style={{
          background: "linear-gradient(150deg, #0E2354 0%, #1F49A8 55%, #3066C9 100%)",
        }}
      >
        {loading || !content ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white/70 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5" style={{ color: "#fff" }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: "#8FB3F5", color: "#0E2354", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 10 }}>
                  {businessName.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-[12px] tracking-tight">{businessName}</span>
              </div>
              {content.eyebrow && (
                <span className="text-[9.5px] font-mono text-white/70 uppercase tracking-[0.22em]">
                  {content.eyebrow}
                </span>
              )}
            </div>
            <div className="flex-1 flex items-center py-4">
              <div className="font-display text-white text-[21px] leading-[1.22] font-semibold">
                &ldquo;{content.quote}&rdquo;
              </div>
            </div>
            {content.headline && (
              <div className="text-[11px] font-mono text-white/60 uppercase tracking-[0.1em]">
                {content.headline}
              </div>
            )}
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
function XPreview({ content, loading, businessName = "PayRewards" }) {
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
            {businessName}
            <span className="w-3.5 h-3.5 rounded-full bg-[#1d9bf0] text-white text-[8px] flex items-center justify-center font-bold">
              ✓
            </span>
          </div>
          <div className="text-[10.5px] font-mono text-[#9ca3af]">
            @{businessName.toLowerCase().replace(/[^a-z0-9]+/g, "")} · 12,204 followers
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
