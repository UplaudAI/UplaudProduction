import { useState } from "react";
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
} from "lucide-react";
import { CONVERSATIONS, CONVERSATION_SOURCES, SIGNAL_THEMES, PAGE_OUTCOMES } from "@/mocks/fintech";
import { toast } from "sonner";
import PageHero from "@/components/business/PageHero";

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
  const [selectedId, setSelectedId] = useState(CONVERSATIONS[0].id);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = CONVERSATIONS.filter((c) => {
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

  const selected = CONVERSATIONS.find((c) => c.id === selectedId) || filtered[0];

  return (
    <div data-testid="conversations-page" className="space-y-12">
      <PageHero
        eyebrow={PAGE_OUTCOMES.conversations.eyebrow}
        question={PAGE_OUTCOMES.conversations.question}
        northStar={PAGE_OUTCOMES.conversations.northStar}
        action={PAGE_OUTCOMES.conversations.action}
        onAction={() =>
          toast.success("Themes exported to Ads Manager", {
            description: "Meta CFO creative refresh queued.",
          })
        }
      />

      {/* Acquisition-ready themes */}
      <section data-testid="signal-themes" className="space-y-6">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-[#111827]">
            Themes ready to move acquisition
          </h2>
          <span className="text-[12px] text-[#9ca3af]">
            Aggregated across {CONVERSATIONS.length} conversations
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SIGNAL_THEMES.map((t) => (
            <ThemeCard key={t.id} theme={t} />
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="pt-2 border-t border-[#eeeaf6]" />

      {/* Explore individual conversations */}
      <section className="space-y-6">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-[#111827]">
            Explore individual conversations
          </h2>
          <span className="text-[12px] text-[#9ca3af]">
            {filtered.length} of {CONVERSATIONS.length}
          </span>
        </div>

        {/* Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
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
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    isActive
                      ? "border-[#6d46c6] bg-[#f5f3ff]"
                      : "border-[#eeeaf6] bg-white hover:border-[#d9d1ee]"
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
        <section className="lg:col-span-8 space-y-5">
          {selected && <ConversationDetail conversation={selected} />}
        </section>
      </div>
      </section>
    </div>
  );
}

function ConversationDetail({ conversation: c }) {
  const status = STATUS_META[c.status];
  const [showApprove, setShowApprove] = useState(false);

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
      <div className="rounded-2xl border border-[#eeeaf6] bg-white p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
              Conversation · {c.id}
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

      {/* Extracted signals */}
      <div className="rounded-2xl border border-[#eeeaf6] bg-white p-6">
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

      {/* Drafted story + approval flow */}
      {c.draftedStory ? (
        <div className="rounded-2xl border border-[#6d46c6]/25 bg-white p-6 relative overflow-hidden">
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

            <ApprovalTimeline story={c.draftedStory} />

            <div className="mt-5 rounded-xl bg-[#faf9ff] border border-[#eeeaf6] p-5">
              <p className="text-[14px] leading-relaxed text-[#111827] whitespace-pre-line font-display">
                &ldquo;{c.draftedStory.body}&rdquo;
              </p>
              <div className="mt-3 text-[11.5px] font-mono text-[#6d46c6]">
                — {c.draftedStory.attribution}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                data-testid="story-edit-btn"
                onClick={() => toast.info("Opens inline testimonial editor")}
                className="btn-secondary h-10 !py-0"
              >
                <Edit3 className="w-4 h-4" strokeWidth={1.75} />
                Edit draft
              </button>
              <button
                data-testid="story-regenerate-btn"
                onClick={() => toast.success("Draft regenerated with alternative tone")}
                className="btn-secondary h-10 !py-0"
              >
                <RefreshCcw className="w-4 h-4" strokeWidth={1.75} />
                Regenerate
              </button>
              <button
                data-testid="story-copy-btn"
                onClick={() => toast.success("Copied to clipboard")}
                className="btn-secondary h-10 !py-0"
              >
                <Copy className="w-4 h-4" strokeWidth={1.75} />
                Copy
              </button>

              {c.draftedStory.status === "draft" && (
                <button
                  data-testid="story-request-approval-btn"
                  onClick={() =>
                    toast.success(`Approval request sent to ${c.person}`, {
                      description: "One-click approve link expires in 7 days.",
                    })
                  }
                  className="ml-auto btn-primary h-10 !py-0"
                >
                  <Send className="w-4 h-4" strokeWidth={1.75} />
                  Send for customer approval
                </button>
              )}
              {c.draftedStory.status === "awaiting_approval" && (
                <button
                  data-testid="story-resend-btn"
                  onClick={() =>
                    toast.info(`Reminder sent to ${c.person}`)
                  }
                  className="ml-auto btn-secondary h-10 !py-0"
                >
                  <Clock className="w-4 h-4" strokeWidth={1.75} />
                  Send reminder
                </button>
              )}
              {c.draftedStory.status === "approved" && (
                <button
                  data-testid="story-amplify-btn"
                  onClick={() =>
                    toast.success("Sent to Social Agent + Referral Agent")
                  }
                  className="ml-auto btn-primary h-10 !py-0"
                >
                  <Zap className="w-4 h-4" strokeWidth={1.75} />
                  Amplify testimonial
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d9d1ee] bg-[#faf9ff] p-8 text-center">
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
            onClick={() =>
              toast.success("Testimonial draft generated", {
                description: "Grounded in the transcript, ready for review.",
              })
            }
            className="btn-primary mt-4 h-11 !py-0 mx-auto"
          >
            <Sparkles className="w-4 h-4" strokeWidth={2} />
            Draft customer testimonial
          </button>
        </div>
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

