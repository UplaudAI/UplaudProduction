import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  Search,
  Sparkles,
  Target,
  AlertCircle,
  Zap,
  Quote,
  MessageSquare,
  HelpCircle,
  Send,
  CheckCircle2,
  Clock,
  FileCheck,
  Copy,
  Edit3,
  RefreshCcw,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Plus,
  X,
  Paperclip,
  Gift,
  Linkedin,
  Award,
} from "lucide-react";
import PageHero from "@/components/business/PageHero";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";

function toConversation(s, loggedInBusinessName = "") {
  const ins = s.insights || {};
  const company = ins.company_name || s.client_name;
  const businessName = loggedInBusinessName || s.brand || "";
  const attribution = [ins.speaker_name, ins.speaker_role, company].filter(Boolean).join(", ");
  const tStatus = s.testimonial_status || "draft";
  const storyStatusMap = { draft: "draft", sent: "awaiting_approval", approved: "approved" };
  const cardStatus =
    tStatus === "approved" ? "approved" : tStatus === "sent" ? "awaiting_approval" : "signals_extracted";
  return {
    id: s.id,
    code: s.conversation_code || "CV_001",
    _sourceId: s.id,
    shareId: s.share_id,
    businessName,
    title: `${company} · ${ins.call_type || "Demo"}`,
    person: ins.speaker_name || "Customer",
    role: ins.speaker_role || "—",
    company,
    aeName: ins.ae_name || "—",
    source: s.source_name || "Upload",
    duration: `${s.duration_min || 0} min`,
    date: (s.created_at || "").slice(0, 10),
    status: cardStatus,
    sentiment: ins.sentiment_label || "Positive",
    signalScore: (ins.signal_score || 0) / 100,
    type: ins.call_type || "Demo",
    signals: {
      motivations: ins.motivations || [],
      painPoints: ins.pain_points || [],
      buyingSignals: ins.buying_signals || [],
      objections: ins.objections || [],
      customerLanguage: ins.customer_language || [],
      productFeedback: ins.product_feedback || [],
      faqs: ins.faqs || [],
    },
    draftedStory: s.testimonial_draft
      ? {
          status: storyStatusMap[tStatus] || "draft",
          body: s.testimonial_draft,
          attribution,
          approvalRequestedAt: s.approval_requested_at || null,
          approvedAt: s.approved_at || null,
        }
      : null,
  };
}

const SOURCE_META = {
  Gong: { color: "#8236f7" },
  "Zoom AI": { color: "#2d8cff" },
  "Fireflies.ai": { color: "#f97316" },
  Fathom: { color: "#0ea5e9" },
  HubSpot: { color: "#ff7a59" },
};

const STATUS_META = {
  signals_extracted: {
    label: "Signals extracted",
    icon: Sparkles,
    tone: "purple",
  },
  awaiting_approval: {
    label: "Awaiting approval",
    icon: Clock,
    tone: "amber",
  },
  approved: { label: "Approved", icon: CheckCircle2, tone: "mint" },
  amplified: { label: "Amplified", icon: Zap, tone: "mint" },
};

const TONE_STYLES = {
  purple: "bg-[#f5f3ff] text-[#6d46c6] border-[#e2d9f5]",
  mint: "bg-[#ecfdf7] text-[#0f9b7c] border-[#c8f0e4]",
  amber: "bg-[#fef9c3] text-[#a16207] border-[#f4e08a]",
};

export default function ConversationsPage() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [{ data }, profileResult] = await Promise.all([
        api.get("/sources"),
        api.get("/business/profile").catch(() => ({ data: null })),
      ]);
      const profileBusinessName = (profileResult.data?.company_name || "").trim();
      const list = data.map((source) => toConversation(source, profileBusinessName));
      setConversations(list);
      setSelectedId((prev) =>
        prev && list.some((c) => c.id === prev) ? prev : list[0]?.id ?? null
      );
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = conversations.filter((c) => {
    if (
      query &&
      !`${c.person} ${c.company} ${c.title}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
      return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  const selected = conversations.find((c) => c.id === selectedId) || filtered[0];

  const signalsStats = useMemo(() => {
    const totalBuying = conversations.reduce((s, c) => s + (c.signals.buyingSignals?.length || 0), 0);
    const totalPain = conversations.reduce((s, c) => s + (c.signals.painPoints?.length || 0), 0);
    const approvedCount = conversations.filter((c) => c.draftedStory?.status === "approved").length;
    const draftedCount = conversations.filter((c) => c.draftedStory).length;
    return { totalBuying, totalPain, approvedCount, draftedCount };
  }, [conversations]);

  const latestApproved = useMemo(
    () => conversations.find((c) => c.draftedStory?.status === "approved") || null,
    [conversations]
  );

  const northStar = useMemo(() => {
    if (conversations.length === 0) {
      return {
        label: "Buying signals detected across your calls",
        value: "0",
        delta: "Upload your first call to start extracting signals",
        attribution:
          "Every transcript you import gets scanned for motivations, pain points, buying signals and objections — automatically.",
      };
    }
    return {
      label: "Buying signals detected across your calls",
      value: `${signalsStats.totalBuying}`,
      delta: `across ${conversations.length} conversation${conversations.length === 1 ? "" : "s"} · ${signalsStats.approvedCount} approved`,
      attribution: `${signalsStats.totalPain} pain points and ${signalsStats.draftedCount} drafted testimonials surfaced from your calls so far.`,
      latestTestimonial: latestApproved ? {
        body: latestApproved.draftedStory.body,
        attribution: latestApproved.draftedStory.attribution,
        approvedAt: latestApproved.draftedStory.approvedAt,
      } : null,
    };
  }, [conversations, signalsStats, latestApproved]);

  const topSignalConversation = useMemo(() => {
    if (conversations.length === 0) return null;
    return [...conversations].sort((a, b) => b.signalScore - a.signalScore)[0];
  }, [conversations]);

  const smartAction = useMemo(() => {
    if (!topSignalConversation) {
      return {
        eyebrow: "Intelligent action",
        headline: "Upload a customer call to unlock your first intelligent action",
        reasoning: [],
        outcome:
          "Once a transcript is analyzed, Uplaud surfaces the single highest-signal conversation here with a recommended next step.",
        cta: "Go to Sources",
      };
    }
    const c = topSignalConversation;
    const topBuying = c.signals.buyingSignals?.[0];
    const topPain = c.signals.painPoints?.[0];
    const status = c.draftedStory?.status;
    let outcome, cta;
    if (!c.draftedStory) {
      outcome = `No testimonial drafted yet from this call — draft one now while the signal is fresh.`;
      cta = "Draft testimonial";
    } else if (status === "draft") {
      outcome = `A testimonial is drafted but hasn't been sent to ${c.person} for approval yet.`;
      cta = "Send for approval";
    } else if (status === "awaiting_approval") {
      outcome = `Waiting on ${c.person} to approve — check the approval page or nudge them.`;
      cta = "View approval page";
    } else {
      outcome = `Approved and ready — amplify this testimonial across LinkedIn, Instagram and X.`;
      cta = "Amplify now";
    }
    return {
      eyebrow: "Intelligent action",
      headline: `${c.person}'s call at ${c.company} has the highest signal score right now (${Math.round(c.signalScore * 100)}/100)`,
      reasoning: [
        { label: "Sentiment", value: `${c.sentiment} · ${c.type}` },
        topBuying ? { label: "Buying signal", value: topBuying } : null,
        topPain ? { label: "Pain point", value: topPain } : null,
      ].filter(Boolean),
      outcome,
      cta,
    };
  }, [topSignalConversation]);

  const handleIntelligentAction = () => {
    if (!topSignalConversation) {
      toast.info("Upload a call transcript in Sources to get started");
      return;
    }
    if (smartAction.cta === "Amplify now") {
      navigate("/business/social");
      return;
    }
    setSelectedId(topSignalConversation.id);
    toast.success(`Jumped to ${topSignalConversation.person}'s call`, {
      description: smartAction.outcome,
    });
  };

  return (
    <div data-testid="conversations-page" className="space-y-8">
      <PageHero
        eyebrow="Growth Signals · AI-extracted from customer calls"
        question="Which conversation should you act on next?"
        northStar={northStar}
        smartAction={smartAction}
        onAction={handleIntelligentAction}
      />

      {/* Explore individual conversations — this is where the action happens, kept up top */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-[18px] font-semibold tracking-tight text-[#111827]">
              Explore individual conversations
            </h2>
            <span className="text-[12px] text-[#9ca3af]">
              {filtered.length} of {conversations.length}
            </span>
          </div>
        </div>

        {/* Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List */}
        <aside className="lg:col-span-4 space-y-3">
          {/* Filter bar */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[#9ca3af] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                data-testid="conversations-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search person, company..."
                className="w-full h-10 pl-10 pr-4 rounded-full border border-[#eeeaf6] bg-white text-[13px] focus:outline-none focus:border-[#d9d1ee]"
              />
            </div>
            <select
              data-testid="conversations-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-4 rounded-full border border-[#eeeaf6] bg-white text-[13px] text-[#4b5563] focus:outline-none focus:border-[#d9d1ee]"
            >
              <option value="all">All statuses</option>
              {Object.entries(STATUS_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#4b5563] px-2 pt-2">
            {filtered.length} conversations
          </div>

          <div className="space-y-2">
            {filtered.map((c) => {
              const status = STATUS_META[c.status];
              const StatusIcon = status.icon;
              const isActive = selectedId === c.id;
              return (
                <button
                  key={c.id}
                  data-testid={`conv-card-${c.id}`}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all relative overflow-hidden ${
                    isActive
                      ? "border-[#6d46c6] bg-[#f5f3ff] shadow-sm ring-1 ring-[#6d46c6]/20 font-medium"
                      : "border-[#eeeaf6] bg-white hover:border-[#d9d1ee] hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-[12.5px] font-medium text-[#111827] leading-tight truncate">
                      {c.title}
                    </div>
                    <span
                      className={`ml-auto shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${TONE_STYLES[status.tone]}`}
                    >
                      <StatusIcon className="w-2.5 h-2.5" strokeWidth={2} />
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-[#4b5563]">
                    {c.person} · {c.role}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[10.5px] font-mono text-[#9ca3af]">
                    <span
                      className="px-1.5 py-0.5 rounded-full"
                      style={{
                        color: SOURCE_META[c.source]?.color || "#6d46c6",
                        backgroundColor: `${SOURCE_META[c.source]?.color || "#6d46c6"}12`,
                      }}
                    >
                      {c.source}
                    </span>
                    <span>{c.duration}</span>
                    <span className="ml-auto">{c.date}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Detail */}
        <section className="lg:col-span-8 space-y-4 flex flex-col">
          {selected && <ConversationDetail conversation={selected} onChanged={load} />}
          {!loading && conversations.length === 0 && (
            <div
              data-testid="conversations-empty"
              className="rounded-2xl border border-dashed border-[#d9d1ee] bg-[#faf9ff] p-10 text-center"
            >
              <Mic className="w-6 h-6 text-[#6d46c6] mx-auto" strokeWidth={1.5} />
              <div className="mt-3 text-[15px] font-display font-semibold text-[#111827]">
                No conversations yet
              </div>
              <p className="mt-1 text-[12.5px] text-[#4b5563]">
                Upload a call transcript in <b>Sources</b> to extract growth
                signals and draft a testimonial.
              </p>
            </div>
          )}
        </section>
      </div>
      </section>
    </div>
  );
}

/* ────── Compact latest-approved testimonial (right side, small footprint) ────── */
function CompactLatestTestimonial({ conversation: latest }) {
  return (
    <div
      data-testid="latest-testimonial"
      className="rounded-xl border border-[#eeeaf6] bg-[#faf9ff] p-4"
    >
      <div className="flex items-center gap-2">
        <FileCheck className="w-3.5 h-3.5 text-[#0f9b7c]" strokeWidth={1.75} />
        <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-[#0f9b7c]">
          Latest customer-approved testimonial
        </div>
      </div>
      <p className="mt-2 text-[13px] leading-snug text-[#111827]">
        &ldquo;{latest.draftedStory.body}&rdquo;
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="text-[11.5px] font-mono text-[#6d46c6]">
          — {latest.draftedStory.attribution}
        </div>
        <span className="text-[10px] font-mono text-[#9ca3af]">
          approved {new Date(latest.draftedStory.approvedAt).toLocaleDateString()}
        </span>
        <button
          data-testid="latest-amplify-btn"
          onClick={() =>
            toast.success("Sent to Growth Amplification", {
              description: "Drafts ready for LinkedIn, Instagram, X.",
            })
          }
          className="ml-auto text-[11px] font-medium text-[#6d46c6] hover:underline whitespace-nowrap"
        >
          Amplify across channels
        </button>
      </div>
    </div>
  );
}

function ConversationDetail({ conversation: c, onChanged }) {
  const status = STATUS_META[c.status];
  const [composerOpen, setComposerOpen] = useState(false);
  const [localStoryStatus, setLocalStoryStatus] = useState(
    c.draftedStory?.status || null
  );
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(c.draftedStory?.body || "");
  const [busy, setBusy] = useState(false);

  // Reset local status when switching conversations
  const currentStoryStatus = localStoryStatus || c.draftedStory?.status;

  useEffect(() => {
    setDraftText(c.draftedStory?.body || "");
    setEditing(false);
    setLocalStoryStatus(c.draftedStory?.status || null);
  }, [c.id, c.draftedStory?.body, c.draftedStory?.status]);

  const runAnalyze = async (regenerate = false) => {
    setBusy(true);
    try {
      await api.post(`/sources/${c._sourceId}/analyze${regenerate ? "?regenerate=true" : ""}`);
      toast.success(regenerate ? "Regenerated — fresh second pass" : "Testimonial draft generated", {
        description: regenerate
          ? "New angle, different quotes — still grounded verbatim in the transcript."
          : "Grounded in the transcript, ready for review.",
      });
      if (onChanged) await onChanged();
    } catch (err) {
      toast.error(
        formatApiError(err.response?.data?.detail) ||
          (regenerate ? "Could not regenerate this testimonial" : "Generation failed")
      );
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    setBusy(true);
    try {
      await api.put(`/sources/${c._sourceId}/testimonial`, { testimonial_draft: draftText });
      toast.success("Draft saved");
      setEditing(false);
      if (onChanged) await onChanged();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSent = () => {
    setLocalStoryStatus("awaiting_approval");
    setComposerOpen(false);
    toast.success(`Approval request sent to ${c.person}`, {
      description: "They can review, edit and approve on their own page.",
    });
    if (onChanged) onChanged();
  };

  const openPublicTestimonialPage = async () => {
    if (c.shareId) {
      window.open(`/t/${c.shareId}`, "_blank", "noreferrer");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(`/sources/${c._sourceId}/send-approval`);
      if (data?.public_path) {
        window.open(data.public_path, "_blank", "noreferrer");
      }
      if (onChanged) await onChanged();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not open approval page");
    } finally {
      setBusy(false);
    }
  };

  const SECTIONS = [
    {
      key: "motivations",
      icon: Target,
      title: "Motivations",
      accent: "#6d46c6",
    },
    {
      key: "painPoints",
      icon: AlertCircle,
      title: "Pain points",
      accent: "#e35b3a",
    },
    {
      key: "buyingSignals",
      icon: Zap,
      title: "Buying signals",
      accent: "#0f9b7c",
    },
    {
      key: "objections",
      icon: MessageSquare,
      title: "Objections",
      accent: "#a16207",
    },
    {
      key: "customerLanguage",
      icon: Quote,
      title: "Customer language",
      accent: "#6d46c6",
    },
    {
      key: "productFeedback",
      icon: Sparkles,
      title: "Product feedback",
      accent: "#0f9b7c",
    },
    {
      key: "faqs",
      icon: HelpCircle,
      title: "Frequently asked questions",
      accent: "#4285F4",
    },
  ];

  return (
    <>
      {/* Header card */}
      <div className="rounded-2xl border border-[#eeeaf6] bg-white p-6 order-1">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
              Conversation · {c.code}
            </div>
            <h2 className="font-display text-[22px] font-semibold text-[#111827] mt-1">
              {c.title}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#4b5563]">
              <span>{c.person} · {c.role}</span>
              <span>·</span>
              <span>AE: {c.aeName}</span>
              <span>·</span>
              <span className="font-mono">{c.duration}</span>
              <span>·</span>
              <span className="font-mono">{c.date}</span>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${TONE_STYLES[status.tone]}`}
          >
            <status.icon className="w-3 h-3" strokeWidth={2} />
            {status.label}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-3">
          <StatCell label="Source" value={c.source} small />
          <StatCell label="Sentiment" value={c.sentiment} small />
          <StatCell label="Signal score" value={`${Math.round(c.signalScore * 100)}`} />
          <StatCell label="Type" value={c.type} small />
        </div>
      </div>

      {/* Drafted testimonial + approval flow */}
      {c.draftedStory ? (
        <div className="rounded-2xl border border-[#6d46c6]/25 bg-white p-6 relative overflow-hidden order-2">
          <div
            aria-hidden
            className="absolute -top-16 -right-8 w-[240px] h-[240px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(94,234,212,0.16), transparent 60%)",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck
                className="w-4 h-4 text-[#6d46c6]"
                strokeWidth={1.75}
              />
              <div className="text-[13px] font-display font-semibold text-[#111827]">
                Drafted customer testimonial
              </div>
              <span className="ml-auto text-[10.5px] font-mono text-[#9ca3af] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#0f9b7c]" strokeWidth={1.75} />
                Customer approves before publish
              </span>
            </div>

            <ApprovalTimeline
              story={{
                ...c.draftedStory,
                status: currentStoryStatus,
                approvalRequestedAt:
                  currentStoryStatus === "awaiting_approval" ||
                  currentStoryStatus === "approved" ||
                  currentStoryStatus === "amplified"
                    ? c.draftedStory.approvalRequestedAt || new Date().toISOString()
                    : c.draftedStory.approvalRequestedAt,
              }}
            />

            <div className="mt-5 rounded-xl bg-[#faf9ff] border border-[#eeeaf6] p-5">
              {editing ? (
                <textarea
                  data-testid="story-edit-textarea"
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  className="w-full min-h-[130px] rounded-lg border border-[#eeeaf6] bg-white px-3 py-2.5 text-[14px] leading-relaxed text-[#111827] focus:outline-none focus:border-[#d9d1ee] focus:ring-2 focus:ring-[#6d46c6]/10 resize-y font-display"
                  spellCheck={false}
                />
              ) : (
                <p className="text-[14px] leading-relaxed text-[#111827] whitespace-pre-line font-display">
                  &ldquo;{c.draftedStory.body}&rdquo;
                </p>
              )}
              <div className="mt-3 text-[11.5px] font-mono text-[#6d46c6]">
                — {c.draftedStory.attribution}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {editing ? (
                <>
                  <button
                    data-testid="story-save-btn"
                    onClick={saveEdit}
                    disabled={busy}
                    className="btn-primary h-10 !py-0 disabled:opacity-60"
                  >
                    <FileCheck className="w-4 h-4" strokeWidth={1.75} />
                    {busy ? "Saving..." : "Save draft"}
                  </button>
                  <button
                    data-testid="story-cancel-edit-btn"
                    onClick={() => {
                      setEditing(false);
                      setDraftText(c.draftedStory.body);
                    }}
                    className="btn-secondary h-10 !py-0"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    data-testid="story-edit-btn"
                    onClick={() => {
                      setDraftText(c.draftedStory.body);
                      setEditing(true);
                    }}
                    className="btn-secondary h-10 !py-0"
                  >
                    <Edit3 className="w-4 h-4" strokeWidth={1.75} />
                    Edit draft
                  </button>
                  <button
                    data-testid="story-regenerate-btn"
                    onClick={() => runAnalyze(true)}
                    disabled={busy}
                    className="btn-secondary h-10 !py-0 disabled:opacity-60"
                  >
                    <RefreshCcw className="w-4 h-4" strokeWidth={1.75} />
                    {busy ? "Working..." : "Regenerate"}
                  </button>
                  <button
                    data-testid="story-copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(c.draftedStory.body);
                      toast.success("Copied to clipboard");
                    }}
                    className="btn-secondary h-10 !py-0"
                  >
                    <Copy className="w-4 h-4" strokeWidth={1.75} />
                    Copy
                  </button>

                  <div className="ml-auto flex items-center gap-2">
                    {(c.shareId || currentStoryStatus === "approved") && (
                      <button
                        data-testid="story-view-approval-page"
                        onClick={openPublicTestimonialPage}
                        disabled={busy}
                        className="btn-secondary h-10 !py-0 disabled:opacity-60"
                      >
                        <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
                        {busy
                          ? "Preparing..."
                          : currentStoryStatus === "approved"
                            ? "View approved testimonial"
                            : "View approval page"}
                      </button>
                    )}
                    {currentStoryStatus !== "approved" && (
                      <button
                        data-testid="story-view-email-btn"
                        onClick={() => setComposerOpen(true)}
                        className="btn-primary h-10 !py-0"
                      >
                        <Send className="w-4 h-4" strokeWidth={1.75} />
                        View draft email for customer outreach
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d9d1ee] bg-[#faf9ff] p-8 text-center order-2">
          <FileCheck
            className="w-6 h-6 text-[#6d46c6] mx-auto"
            strokeWidth={1.5}
          />
          <div className="mt-3 text-[14px] font-display font-semibold text-[#111827]">
            No testimonial drafted yet
          </div>
          <p className="mt-1 text-[12.5px] text-[#4b5563] max-w-[420px] mx-auto">
            Ask Uplaud to draft an authentic customer perspective from this
            conversation. Nothing is published without customer approval.
          </p>
          <button
            data-testid="story-draft-btn"
            onClick={() => runAnalyze(false)}
            disabled={busy}
            className="btn-primary mt-4 h-11 !py-0 mx-auto disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" strokeWidth={2} />
            {busy ? "Drafting..." : "Draft customer testimonial"}
          </button>
        </div>
      )}

      {/* Extracted signals */}
      <div className="rounded-2xl border border-[#eeeaf6] bg-white p-6 order-3">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-4 h-4 text-[#6d46c6]" strokeWidth={1.75} />
          <div className="text-[13px] font-display font-semibold text-[#111827]">
            AI-extracted signals
          </div>
          <span className="ml-auto text-[10.5px] font-mono text-[#9ca3af]">
            From transcript · never auto-published
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map((sec) => {
            const items = c.signals[sec.key] || [];
            if (items.length === 0) return null;
            const Icon = sec.icon;
            return (
              <div
                key={sec.key}
                data-testid={`signal-${sec.key}`}
                className="rounded-xl border border-[#eeeaf6] bg-[#faf9ff] p-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${sec.accent}18` }}
                  >
                    <Icon
                      className="w-3.5 h-3.5"
                      strokeWidth={1.75}
                      style={{ color: sec.accent }}
                    />
                  </div>
                  <div className="text-[12px] font-display font-semibold text-[#111827]">
                    {sec.title}
                  </div>
                  <span className="ml-auto text-[10px] font-mono text-[#9ca3af]">
                    {items.length}
                  </span>
                </div>
                <ul className="mt-2.5 space-y-1.5 text-[12.5px] text-[#4b5563] leading-relaxed">
                  {items.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span
                        className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                        style={{ backgroundColor: sec.accent }}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Approval email composer */}
      {c.draftedStory && (
        <ApprovalEmailComposer
          open={composerOpen}
          onClose={() => setComposerOpen(false)}
          onSent={handleSent}
          conversation={c}
        />
      )}
    </>
  );
}

function ApprovalTimeline({ story }) {
  const steps = [
    { key: "draft", label: "Draft", done: true },
    {
      key: "sent",
      label: "Sent for approval",
      done: !!story.approvalRequestedAt,
    },
    { key: "approved", label: "Approved", done: !!story.approvedAt },
    { key: "amplified", label: "Amplified", done: story.status === "amplified" },
  ];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center flex-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono ${
                s.done
                  ? "bg-[#6d46c6] text-white"
                  : "bg-[#eeeaf6] text-[#9ca3af]"
              }`}
            >
              {s.done ? <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} /> : i + 1}
            </div>
            <div
              className={`text-[11.5px] whitespace-nowrap ${
                s.done ? "text-[#111827] font-medium" : "text-[#9ca3af]"
              }`}
            >
              {s.label}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-px mx-2 ${
                s.done && steps[i + 1].done ? "bg-[#6d46c6]" : "bg-[#eeeaf6]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function StatCell({ label, value, small }) {
  return (
    <div className="rounded-xl bg-[#faf9ff] border border-[#eeeaf6] p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#9ca3af]">
        {label}
      </div>
      <div
        className={`mt-1 font-display font-semibold text-[#111827] leading-tight capitalize ${small ? "text-[13px]" : "text-[18px]"}`}
      >
        {value}
      </div>
    </div>
  );
}

function ThemeCard({ theme: t }) {
  return (
    <div
      data-testid={`theme-${t.id}`}
      className="rounded-2xl border border-[#eeeaf6] bg-white p-6 hover:border-[#d9d1ee] transition-colors"
    >
      <div className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
        {t.category}
      </div>
      <div className="mt-3 font-display text-[20px] font-semibold leading-tight text-[#111827]">
        {t.theme}
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <div className="font-display text-[28px] font-semibold text-[#0f9b7c] leading-none">
          {t.lift}
        </div>
        <div className="text-[11px] text-[#4b5563] leading-tight">
          {t.liftLabel}
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-[#faf9ff] border border-[#eeeaf6] p-3">
        <p className="text-[12.5px] leading-relaxed text-[#111827] italic">
          &ldquo;{t.quote}&rdquo;
        </p>
        <div className="mt-1.5 text-[10.5px] font-mono text-[#6d46c6]">
          — {t.quoteAttribution}
        </div>
      </div>

      <div className="mt-4 text-[11px] font-mono text-[#9ca3af]">
        {t.mentions} mentions · {t.conversations} conversations
      </div>

      <button
        data-testid={`theme-action-${t.id}`}
        className="mt-4 text-[12.5px] font-medium text-[#6d46c6] hover:underline flex items-center gap-1"
      >
        {t.action}
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}


/* ────────── Approval Email Composer (right-slide panel) ────────── */

function slugCompany(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function deriveEmail(person, company) {
  const parts = person.toLowerCase().trim().split(/\s+/);
  const first = parts[0] || "hello";
  const last = parts.slice(1).join(".") || "team";
  return `${first}.${last}@${slugCompany(company)}.com`;
}

function firstName(person) {
  return person.split(" ")[0] || person;
}

function cleanBusinessName(name) {
  return (name || "").trim();
}

function emailBusinessName(name) {
  return cleanBusinessName(name) || "your company";
}

function businessHandle(name) {
  const compact = cleanBusinessName(name).replace(/[^a-zA-Z0-9]+/g, "");
  return compact ? `@${compact}` : "@yourcompany";
}

function deriveBusinessEmail(person, businessName) {
  const parts = person.toLowerCase().trim().split(/\s+/);
  const first = parts[0] || "hello";
  return `${first}@${slugCompany(cleanBusinessName(businessName)) || "company"}.com`;
}

function generateLinkedInDraft(c) {
  const quoteLine = c.draftedStory.body.split("\n")[0].replace(/^["“]|["”]$/g, "");
  const handle = businessHandle(c.businessName);
  return `I don't usually post about vendor tools, but this one earned it.

${quoteLine}

If you've been looking at ${handle}, this is the kind of experience that stood out to me. Happy to intro anyone curious.

#CustomerStory #Growth #${cleanBusinessName(c.businessName).replace(/[^a-zA-Z0-9]+/g, "") || "CustomerSuccess"}`;
}

function generateEmailBody(c) {
  const fn = firstName(c.person);
  const testimonial = c.draftedStory.body;
  const link = c.shareId ? `${window.location.origin}/t/${c.shareId}` : "";
  const businessName = emailBusinessName(c.businessName);
  const handle = businessHandle(c.businessName);
  return `Hi ${fn},

Thanks again for the demo — genuinely enjoyed hearing how you're thinking about your team's priorities at ${c.company}.

Based on our conversation, we drafted a short testimonial that captures what you shared. Nothing gets published without your green light.

REVIEW, EDIT & APPROVE (takes 30 seconds):
${link}

TESTIMONIAL FOR YOUR APPROVAL
${testimonial ? `"${testimonial}"` : ""}
— ${c.draftedStory.attribution}

Once you approve on the page above, you'll get ready-to-post, ${businessName}-branded assets for LinkedIn, Instagram and X — share in a couple of taps.

A couple of ways we'd love to say thanks:

TIER 1 — Approve + refer
Approve the testimonial and share ${businessName} with at least one qualified peer in your network who could benefit → we'll credit your ${businessName} account with $500 in rewards + waive next quarter's platform fee.

TIER 2 — Post on LinkedIn tagging ${handle}
Post the testimonial on LinkedIn tagging ${handle} → additional $500 in rewards credit + a co-branded case study we'll publish with your team.

Really appreciate you taking the time,
${c.aeName}
${businessName}`;
}

function ApprovalEmailComposer({ open, onClose, onSent, conversation: c }) {
  const [to, setTo] = useState(deriveEmail(c.person, c.company));
  const [cc, setCc] = useState(deriveBusinessEmail(c.aeName, c.businessName));
  const [subject, setSubject] = useState(
    `Thanks for the demo, ${firstName(c.person)} — a quick approval + a small thank-you`
  );
  const [body, setBody] = useState(generateEmailBody(c));
  const [liDraft, setLiDraft] = useState(generateLinkedInDraft(c));
  const [attachmentOpen, setAttachmentOpen] = useState(true);
  const [sending, setSending] = useState(false);

  // Reset composer content when the underlying conversation changes
  useEffect(() => {
    if (!open) return;
    setTo(deriveEmail(c.person, c.company));
    setCc(deriveBusinessEmail(c.aeName, c.businessName));
    setSubject(
      `Thanks for the demo, ${firstName(c.person)} — a quick approval + a small thank-you`
    );
    setBody(generateEmailBody(c));
    setLiDraft(generateLinkedInDraft(c));
    setSending(false);
  }, [open, c]);

  if (!open) return null;

  const handleSend = () => {
    setSending(true);
    api
      .post(`/sources/${c._sourceId}/send-approval`)
      .then(() => onSent())
      .catch((err) => {
        setSending(false);
        toast.error(formatApiError(err.response?.data?.detail) || "Could not send");
      });
  };

  const handleRegenerate = () => {
    setBody(generateEmailBody(c));
    toast.success("Email body regenerated");
  };

  return (
    <div
      data-testid="approval-email-composer"
      className="fixed inset-0 z-[100] flex"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <button
        data-testid="composer-overlay"
        aria-label="Close composer"
        onClick={onClose}
        className="flex-1 bg-black/50 backdrop-blur-[2px] animate-in fade-in-0 duration-200"
      />

      {/* Panel */}
      <div className="relative w-full sm:w-[760px] max-w-full h-full bg-white shadow-2xl border-l border-[#eeeaf6] flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 h-16 border-b border-[#eeeaf6] flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#f5f3ff] text-[#6d46c6] flex items-center justify-center">
            <Send className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <div className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
              Approval request
            </div>
            <div className="text-[14px] font-display font-semibold text-[#111827] leading-tight truncate">
              To {c.person} · {c.company}
            </div>
          </div>
          <button
            data-testid="composer-close-btn"
            onClick={onClose}
            className="ml-auto w-9 h-9 rounded-full hover:bg-[#faf9ff] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-[#4b5563]" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Address fields */}
          <div className="divide-y divide-[#f2eefa]">
            <ComposerField
              label="To"
              testId="composer-to"
              value={to}
              onChange={setTo}
            />
            <ComposerField
              label="Cc"
              testId="composer-cc"
              value={cc}
              onChange={setCc}
            />
            <ComposerField
              label="Subject"
              testId="composer-subject"
              value={subject}
              onChange={setSubject}
              bold
            />
          </div>

          {/* Body textarea */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
                Message
              </div>
              <button
                data-testid="composer-regenerate-btn"
                onClick={handleRegenerate}
                className="text-[11.5px] text-[#6d46c6] hover:text-[#261c4d] flex items-center gap-1"
              >
                <RefreshCcw className="w-3 h-3" strokeWidth={1.75} />
                Regenerate
              </button>
            </div>
            <textarea
              data-testid="composer-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full min-h-[380px] rounded-xl border border-[#eeeaf6] bg-white px-4 py-3 text-[13.5px] leading-relaxed text-[#111827] font-sans focus:outline-none focus:border-[#d9d1ee] focus:ring-2 focus:ring-[#6d46c6]/10 resize-y"
              spellCheck={false}
            />

            {/* Reward tiers highlight */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RewardTierCard
                testId="tier-1"
                icon={Gift}
                tier="Tier 1"
                title="Approve + refer 1 peer"
                reward="$500 rewards credit + fee waiver"
                accent="#6d46c6"
                bg="#f5f3ff"
              />
              <RewardTierCard
                testId="tier-2"
                icon={Linkedin}
                tier="Tier 2"
                title={`LinkedIn post tagging ${businessHandle(c.businessName)}`}
                reward="+$500 credit + co-branded case study"
                accent="#0f9b7c"
                bg="#ecfdf7"
              />
            </div>
          </div>

          {/* Attachment */}
          <div className="px-6 pb-8">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9ca3af] mb-3 flex items-center gap-2">
              <Paperclip className="w-3 h-3" strokeWidth={2} />
              1 attachment
            </div>
            <div
              data-testid="composer-attachment"
              className="rounded-xl border border-[#eeeaf6] bg-white overflow-hidden"
            >
              <button
                onClick={() => setAttachmentOpen((o) => !o)}
                data-testid="composer-attachment-toggle"
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#faf9ff] transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-[#0a66c2]/10 text-[#0a66c2] flex items-center justify-center shrink-0">
                  <Linkedin className="w-4 h-4" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-[#111827] truncate">
                    LinkedIn post — {firstName(c.person)}-testimonial.txt
                  </div>
                  <div className="text-[11px] font-mono text-[#9ca3af]">
                    Ready-to-post draft · {liDraft.length} chars · tagged {businessHandle(c.businessName)}
                  </div>
                </div>
                <span className="text-[11px] font-mono text-[#6d46c6]">
                  {attachmentOpen ? "Hide" : "Preview"}
                </span>
              </button>
              {attachmentOpen && (
                <div className="border-t border-[#eeeaf6] p-4 bg-[#faf9ff]">
                  <textarea
                    data-testid="composer-linkedin-draft"
                    value={liDraft}
                    onChange={(e) => setLiDraft(e.target.value)}
                    className="w-full min-h-[150px] rounded-lg border border-[#eeeaf6] bg-white px-3 py-2.5 text-[12.5px] leading-relaxed text-[#111827] focus:outline-none focus:border-[#d9d1ee] resize-y"
                    spellCheck={false}
                  />
                  <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#9ca3af]">
                    <span>Customer edits inline before posting</span>
                    <button
                      data-testid="composer-copy-linkedin"
                      onClick={() => {
                        navigator.clipboard.writeText(liDraft);
                        toast.success("LinkedIn draft copied");
                      }}
                      className="text-[#6d46c6] hover:text-[#261c4d] flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" strokeWidth={2} />
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 h-[76px] border-t border-[#eeeaf6] bg-white flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#9ca3af]">
            <Award className="w-3 h-3 text-[#0f9b7c]" strokeWidth={2} />
            One-click approve link · expires in 7 days
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              data-testid="composer-cancel-btn"
              onClick={onClose}
              className="btn-secondary h-10 !py-0"
            >
              Cancel
            </button>
            <button
              data-testid="composer-send-btn"
              onClick={handleSend}
              disabled={sending}
              className="btn-primary h-10 !py-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" strokeWidth={1.75} />
              {sending ? "Sending..." : "Send for approval"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComposerField({ label, testId, value, onChange, bold }) {
  return (
    <div className="grid grid-cols-[64px_1fr] items-center gap-3 px-6 py-3">
      <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#9ca3af]">
        {label}
      </div>
      <input
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-transparent text-[13.5px] text-[#111827] focus:outline-none ${
          bold ? "font-semibold" : ""
        }`}
      />
    </div>
  );
}

function RewardTierCard({ testId, icon: Icon, tier, title, reward, accent, bg }) {
  return (
    <div
      data-testid={testId}
      className="rounded-xl border p-4"
      style={{ borderColor: `${accent}30`, backgroundColor: bg }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          <Icon className="w-3.5 h-3.5" strokeWidth={2} />
        </div>
        <span
          className="text-[10px] font-mono uppercase tracking-[0.16em]"
          style={{ color: accent }}
        >
          {tier}
        </span>
      </div>
      <div className="mt-2 text-[12.5px] font-medium text-[#111827] leading-tight">
        {title}
      </div>
      <div className="mt-1 text-[11.5px] text-[#4b5563] leading-snug">
        {reward}
      </div>
    </div>
  );
}
