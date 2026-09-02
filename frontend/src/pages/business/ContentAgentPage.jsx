import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowUpRight,
  BookOpenText,
  CheckCircle2,
  FileText,
  Globe2,
  Loader2,
  RefreshCcw,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import PageHero from "@/components/business/PageHero";
import api, { formatApiError } from "@/lib/api";
import { getAuth } from "@/lib/business-storage";

const CONTENT_TYPES = ["Buyer Guide", "Case Study", "Comparison", "FAQ"];

function scoreTone(score) {
  if ((score || 0) >= 80) return "text-[#059669]";
  if ((score || 0) >= 60) return "text-[#b45309]";
  return "text-[#dc2626]";
}

function firstSentence(text) {
  if (!text) return "";
  return text.split(/(?<=[.!?])\s+/)[0] || text;
}

export default function ContentAgentPage() {
  const user = getAuth();
  const businessName = user?.workspace || user?.company || "My Company";
  const [posts, setPosts] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingSlug, setSavingSlug] = useState("");
  const [contentType, setContentType] = useState("Buyer Guide");
  const [buyerQuestion, setBuyerQuestion] = useState("");

  const selectedPost = useMemo(
    () => posts.find((post) => post.slug === selectedSlug) || posts[0],
    [posts, selectedSlug]
  );

  const refreshPosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/business/content");
      const list = data?.posts || [];
      setPosts(list);
      setSelectedSlug((current) => current || list[0]?.slug || "");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not load content posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generatePost = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post("/business/content/generate", {
        content_type: contentType,
        buyer_question: buyerQuestion,
      });
      const next = [data, ...posts.filter((post) => post.slug !== data.slug)];
      setPosts(next);
      setSelectedSlug(data.slug);
      toast.success("Draft generated for review", {
        description: data.quality_score >= 80 ? "Passed the content quality gate." : "Needs edits before publishing.",
      });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not generate content");
    } finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (slug, action) => {
    setSavingSlug(slug);
    try {
      const { data } = await api.post(`/business/content/${slug}/${action}`);
      setPosts((current) => current.map((post) => (post.slug === slug ? data : post)));
      toast.success(action === "publish" ? "Published to the public business page" : "Content updated");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not update content");
    } finally {
      setSavingSlug("");
    }
  };

  const northStar = {
    label: "Content drafts",
    value: loading ? "..." : `${posts.length}`,
    delta: "research-backed posts from reviews and Growth Signals",
    attribution:
      "The agent combines public research with verified Uplaud reviews, then runs an editor review before anything can be published.",
  };

  const smartAction = {
    eyebrow: "Paid module",
    headline: selectedPost ? firstSentence(selectedPost.buyer_question || selectedPost.title) : "Generate your first buyer-ready article",
    reasoning: [
      { label: "Quality gate", value: selectedPost?.quality_score ? `${selectedPost.quality_score}/100` : "Required" },
      { label: "Status", value: selectedPost?.status || "No posts yet" },
      { label: "Research", value: selectedPost?.research_packet?.sources?.length ? `${selectedPost.research_packet.sources.length} sources` : "Public web" },
    ],
    outcome: "Publish only after the reviewer agent clears SEO, AEO, evidence, and usefulness checks.",
    cta: "Start a draft",
  };

  return (
    <div data-testid="content-agent-page" className="space-y-10">
      <PageHero
        eyebrow={`Content Agent · ${businessName}`}
        question="What should buyers understand before they choose you?"
        northStar={northStar}
        smartAction={smartAction}
        onAction={() => document.getElementById("content-agent-question")?.focus()}
      />

      <section className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
        <div className="rounded-2xl border border-[#eee5d5] bg-white/80 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-[20px] font-semibold text-[#111827]">Generate content</h2>
              <p className="text-[12.5px] text-[#7c7469] mt-1">Research first, reviews second, editor gate before publish.</p>
            </div>
            <Sparkles className="w-5 h-5 text-[#6442ff]" />
          </div>

          <label className="block text-[11px] font-mono uppercase tracking-[0.18em] text-[#7c7469] mb-2">
            Content type
          </label>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setContentType(type)}
                className={`rounded-lg border px-3 py-2 text-[13px] font-medium transition ${
                  contentType === type
                    ? "border-[#6442ff] bg-[#f4f1ff] text-[#261c4d]"
                    : "border-[#eee5d5] bg-white text-[#554f48] hover:border-[#d9cdb9]"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <label htmlFor="content-agent-question" className="block text-[11px] font-mono uppercase tracking-[0.18em] text-[#7c7469] mb-2">
            Buyer question
          </label>
          <textarea
            id="content-agent-question"
            value={buyerQuestion}
            onChange={(event) => setBuyerQuestion(event.target.value)}
            placeholder="Example: Is AI Fiesta worth it for teams comparing AI models?"
            className="min-h-[112px] w-full rounded-xl border border-[#ded3bf] bg-white px-4 py-3 text-[14px] leading-relaxed text-[#111827] outline-none focus:border-[#6442ff] focus:ring-4 focus:ring-[#6442ff]/10"
          />

          <button
            type="button"
            onClick={generatePost}
            disabled={generating}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#09090d] px-4 py-3 text-[14px] font-semibold text-white disabled:opacity-60"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate draft
          </button>
        </div>

        <div className="rounded-2xl border border-[#eee5d5] bg-white/80 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-[20px] font-semibold text-[#111827]">Content pipeline</h2>
              <p className="text-[12.5px] text-[#7c7469] mt-1">Draft, approve, publish, or archive paid content assets.</p>
            </div>
            <button
              type="button"
              onClick={refreshPosts}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#eee5d5] bg-white text-[#554f48]"
              aria-label="Refresh content"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center text-[#7c7469]">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading content
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#ded3bf] p-8 text-center">
              <BookOpenText className="mx-auto mb-3 h-8 w-8 text-[#6442ff]" />
              <p className="font-semibold text-[#111827]">No content posts yet</p>
              <p className="mt-1 text-[13px] text-[#7c7469]">Ask a buyer question to create a research-backed draft.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <button
                  key={post.slug}
                  type="button"
                  onClick={() => setSelectedSlug(post.slug)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedPost?.slug === post.slug ? "border-[#6442ff] bg-[#f8f6ff]" : "border-[#eee5d5] bg-white hover:border-[#d9cdb9]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#ded3bf] px-2 py-1 text-[11px] font-mono uppercase tracking-[0.12em] text-[#7c7469]">
                          {post.status}
                        </span>
                        <span className={`text-[12px] font-semibold ${scoreTone(post.quality_score)}`}>
                          {post.quality_score || 0}/100
                        </span>
                      </div>
                      <h3 className="mt-3 line-clamp-2 font-display text-[18px] font-semibold text-[#111827]">{post.title}</h3>
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#6b6258]">{post.excerpt || post.meta_description}</p>
                    </div>
                    <FileText className="mt-1 h-5 w-5 shrink-0 text-[#9f968b]" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedPost && (
        <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6">
          <article className="rounded-2xl border border-[#eee5d5] bg-white/85 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee5d5] pb-5">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#7c7469]">
                  {selectedPost.content_type || "Content"}
                </div>
                <h2 className="mt-2 font-display text-[28px] font-semibold leading-tight text-[#111827]">{selectedPost.title}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedPost.status !== "published" && (
                  <button
                    type="button"
                    disabled={savingSlug === selectedPost.slug}
                    onClick={() => updateStatus(selectedPost.slug, "publish")}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#09090d] px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
                  >
                    {savingSlug === selectedPost.slug ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Publish
                  </button>
                )}
                {selectedPost.status === "published" && (
                  <a
                    href={`/business/public/${selectedPost.business_slug}/blog/${selectedPost.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#ded3bf] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#111827]"
                  >
                    View live <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
                <button
                  type="button"
                  disabled={savingSlug === selectedPost.slug}
                  onClick={() => updateStatus(selectedPost.slug, "archive")}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#ded3bf] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#554f48] disabled:opacity-60"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </button>
              </div>
            </div>

            <div
              className="prose prose-neutral mt-6 max-w-none prose-headings:font-display prose-p:leading-relaxed prose-blockquote:border-l-[#6442ff] prose-blockquote:bg-[#f8f6ff] prose-blockquote:py-2 prose-blockquote:not-italic"
              dangerouslySetInnerHTML={{ __html: selectedPost.content_html || "<p>No article body yet.</p>" }}
            />
          </article>

          <aside className="space-y-4">
            <Panel title="Quality" icon={CheckCircle2}>
              <Metric label="Overall" value={`${selectedPost.quality_score || 0}/100`} tone={scoreTone(selectedPost.quality_score)} />
              <Metric label="SEO" value={`${selectedPost.seo_score || 0}/100`} tone={scoreTone(selectedPost.seo_score)} />
              <Metric label="AEO" value={`${selectedPost.aeo_score || 0}/100`} tone={scoreTone(selectedPost.aeo_score)} />
              {selectedPost.reviewer_notes && <p className="mt-3 text-[13px] leading-relaxed text-[#6b6258]">{selectedPost.reviewer_notes}</p>}
            </Panel>

            <Panel title="Research" icon={Search}>
              {(selectedPost.research_packet?.sources || []).slice(0, 5).map((source, index) => (
                <a
                  key={`${source.url || source.name}-${index}`}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-3 block rounded-lg border border-[#eee5d5] bg-white p-3 text-[13px] text-[#111827]"
                >
                  <span className="font-semibold">{source.name || "Source"}</span>
                  {source.claim && <span className="mt-1 block text-[#7c7469]">{source.claim}</span>}
                </a>
              ))}
              {(selectedPost.research_packet?.sources || []).length === 0 && (
                <p className="text-[13px] text-[#7c7469]">No research sources stored yet.</p>
              )}
            </Panel>

            <Panel title="Public asset" icon={Globe2}>
              <p className="break-all text-[13px] text-[#6b6258]">
                /business/public/{selectedPost.business_slug}/blog/{selectedPost.slug}
              </p>
              <p className="mt-3 text-[13px] text-[#6b6258]">
                Schema is stored with the post and rendered server-side when published.
              </p>
            </Panel>
          </aside>
        </section>
      )}
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-[#eee5d5] bg-white/85 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#6442ff]" />
        <h3 className="font-display text-[16px] font-semibold text-[#111827]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-4 border-b border-[#f1eadf] pb-2 last:border-0">
      <span className="text-[12px] font-mono uppercase tracking-[0.14em] text-[#7c7469]">{label}</span>
      <span className={`font-display text-[18px] font-semibold ${tone}`}>{value}</span>
    </div>
  );
}
