import { useState, useEffect, useRef } from "react";
import {
  ArrowUpRight,
  X,
  Sparkles,
  Linkedin,
  Zap,
  Building2,
  ChevronDown,
  Search,
  Copy,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  WARM_LEAD_STAGES,
  PAGE_OUTCOMES,
} from "@/mocks/fintech";
import { toast } from "sonner";
import { getAuth, setSeenLeadsCount } from "@/lib/business-storage";
import PageHero from "@/components/business/PageHero";
import api, { formatApiError } from "@/lib/api";

const EMPTY_ENRICHMENT = { recent: [], linkedin: "", companyMetrics: {}, buyingSignals: [] };

// Every extra data point People Data Labs returns that doesn't already have its
// own dedicated table column — surfaced as key/value pairs in the Signals cell.
function buildSignals(c) {
  const location = [c.city, c.state, c.country].filter(Boolean).join(", ");
  const pairs = [
    ["Industry", c.industry],
    ["Company size", c.company_size && `${c.company_size} employees`],
    ["Location", location],
    ["LinkedIn", c.linkedin],
    ["Match confidence", c.pdl_likelihood != null && `${c.pdl_likelihood}/10`],
    ["Skills", c.skills],
    ["Interests", c.interests],
    ["Education", c.education],
    ["Previously at", c.previous_company],
    ["In role since", c.job_start_date],
    ["Work email", c.work_email],
    ["Mobile", c.mobile_phone],
    ["Twitter", c.twitter_url],
    ["GitHub", c.github_url],
  ];
  return pairs
    .filter(([, value]) => value)
    .map(([label, value]) => ({ label, value: String(value) }));
}

function parseAgentPlan(raw) {
  if (!raw) return null;
  return {
    status: raw.status || "pending",
    researchHeadline: raw.research_headline || "",
    researchSummary: Array.isArray(raw.research_summary) ? raw.research_summary : [],
    emailSubject: raw.email_subject || "",
    emailBody: raw.email_body || "",
    linkedinMessage: raw.linkedin_message || "",
    nextAction: {
      label: raw.next_action?.label || "",
      cta: raw.next_action?.cta || "Send Email",
    },
    generatedAt: raw.generated_at || "",
  };
}

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateShort(iso) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: iso, time: "" };
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return { date, time };
}

function circleToLead(c) {
  const agentPlan = parseAgentPlan(c.agent_plan);
  return {
    id: c.id,
    name: c.name || "Unnamed referral",
    role: c.job_title || "",
    company: c.company_name || c.receiver_company || "",
    stage: "new",
    createdAt: c.created_at || c.referred_date || "",
    industry: c.industry || "",
    headcount: c.company_size || "",
    location: [c.city, c.state, c.country].filter(Boolean).join(", "),
    pdlLikelihood: c.pdl_likelihood ?? null,
    receivedAt: c.referred_date || "",
    referrer: { name: c.referrer_name || "", company: "", relationship: "" },
    enrichment: { ...EMPTY_ENRICHMENT, linkedin: c.linkedin || "" },
    signals: buildSignals(c),
    agentPlan,
    suggestedActions: agentPlan
      ? [{ id: "agent-plan", label: agentPlan.nextAction.label, cta: agentPlan.nextAction.cta }]
      : [],
  };
}

const STAGE_STYLES = {
  purple: "bg-[#f5f3ff] text-[#6d46c6] border-[#e2d9f5]",
  amber: "bg-[#fef9c3] text-[#a16207] border-[#f4e08a]",
  mint: "bg-[#ecfdf7] text-[#0f9b7c] border-[#c8f0e4]",
  grey: "bg-[#f5f5f5] text-[#6b7280] border-[#e5e7eb]",
};

export default function ReferralAgentPage() {
  const user = getAuth();
  const businessName = user?.workspace || user?.company || "My Company";
  const [selectedId, setSelectedId] = useState(null);
  const [warmLeads, setWarmLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [agentBusy, setAgentBusy] = useState(() => new Set());
  const autoTriggered = useRef(new Set());

  useEffect(() => {
    api
      .get("/warm-leads")
      .then(({ data }) => {
        setWarmLeads((data.leads || []).map(circleToLead));
        setSeenLeadsCount((data.leads || []).length);
      })
      .catch(() => setWarmLeads([]))
      .finally(() => setLoadingLeads(false));
  }, []);

  const runAgentForLead = (leadId, force = false) => {
    setAgentBusy((prev) => new Set(prev).add(leadId));
    return api
      .post(`/warm-leads/${leadId}/agent-run${force ? "?force=true" : ""}`)
      .then(({ data }) => {
        const agentPlan = parseAgentPlan(data);
        setWarmLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? { ...l, agentPlan, suggestedActions: [{ id: "agent-plan", label: agentPlan.nextAction.label, cta: agentPlan.nextAction.cta }] }
              : l
          )
        );
      })
      .catch((err) => {
        toast.error("Couldn't build an agent plan for this lead", {
          description: formatApiError(err.response?.data?.detail),
        });
      })
      .finally(() => {
        setAgentBusy((prev) => {
          const next = new Set(prev);
          next.delete(leadId);
          return next;
        });
      });
  };

  const setLeadPlanStatus = (leadId, status) =>
    setWarmLeads((prev) =>
      prev.map((l) => (l.id === leadId && l.agentPlan ? { ...l, agentPlan: { ...l.agentPlan, status } } : l))
    );

  const handleApprove = (leadId) => {
    api
      .post(`/warm-leads/${leadId}/agent-plan/approve`)
      .then(() => {
        setLeadPlanStatus(leadId, "approved");
        toast.success("Outreach approved", { description: "Queued for the growth team to send." });
      })
      .catch((err) => toast.error("Couldn't approve", { description: formatApiError(err.response?.data?.detail) }));
  };

  const handleSkip = (leadId) => {
    api
      .post(`/warm-leads/${leadId}/agent-plan/skip`)
      .then(() => {
        setLeadPlanStatus(leadId, "skipped");
        toast.message("Skipped");
      })
      .catch((err) => toast.error("Couldn't skip", { description: formatApiError(err.response?.data?.detail) }));
  };

  // Exclude closed-won leads (they're customers, not leads)
  const activeLeads = warmLeads.filter((l) => l.stage !== "converted");
  const convertedCount = warmLeads.filter((l) => l.stage === "converted").length;

  const filtered = [...activeLeads].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const topApprovalCandidates = filtered.slice(0, 5);
  const selected = warmLeads.find((l) => l.id === selectedId) || null;

  // Auto-run the Referral Agent for the top 5 leads awaiting approval.
  useEffect(() => {
    topApprovalCandidates.forEach((l) => {
      if (!l.agentPlan && !agentBusy.has(l.id) && !autoTriggered.current.has(l.id)) {
        autoTriggered.current.add(l.id);
        runAgentForLead(l.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topApprovalCandidates.map((l) => l.id).join(",")]);

  const plannedLeads = activeLeads.filter((l) => l.agentPlan);
  const approvedLeads = plannedLeads.filter((l) => l.agentPlan.status === "approved");
  const pendingLeads = plannedLeads.filter((l) => l.agentPlan.status === "pending");

  const referralsNorthStar = {
    label: "Warm introductions delivered",
    value: String(activeLeads.length),
    delta: plannedLeads.length
      ? `${plannedLeads.length} researched by the Referral Agent · ${approvedLeads.length} approved`
      : activeLeads.length
      ? "Referral Agent is researching your newest leads…"
      : "Waiting on your first referral",
    trend: "up",
    attribution:
      `Every warm intro is a named referral from someone who's tried ${businessName}, enriched via People Data Labs and pre-researched by the Referral Agent before outreach.`,
  };

  const bestLead =
    [...pendingLeads].sort((a, b) => b.signals.length - a.signals.length)[0] || filtered[0] || null;

  const referralsSmartAction = bestLead
    ? {
        eyebrow: "Intelligent action",
        headline: bestLead.agentPlan
          ? `${bestLead.name} is ready for outreach — ${
              bestLead.agentPlan.nextAction.cta === "Send LinkedIn InMail"
                ? "they're active on LinkedIn"
                : "reach them by email"
            }`
          : `${bestLead.name} just came in from ${bestLead.referrer.name || "a referrer"} — generate their outreach plan`,
        reasoning: [
          { label: "Referred by", value: bestLead.referrer.name || "—" },
          { label: "Signals found", value: `${bestLead.signals.length} enrichment data points` },
          bestLead.agentPlan
            ? { label: "Recommended channel", value: bestLead.agentPlan.nextAction.cta }
            : { label: "Status", value: "Awaiting research" },
        ],
        outcome:
          bestLead.agentPlan?.nextAction.label ||
          "Open the lead to generate a personalized outreach plan with the Referral Agent.",
        cta: bestLead.agentPlan ? "Review this lead" : "Generate outreach plan",
      }
    : null;

  return (
    <div data-testid="referral-agent-page" className="space-y-8">
      <PageHero
        eyebrow={PAGE_OUTCOMES.referrals.eyebrow}
        question={`How many warm introductions did ${businessName} customers deliver?`}
        northStar={referralsNorthStar}
        smartAction={referralsSmartAction}
        onAction={() => bestLead && setSelectedId(bestLead.id)}
      />

      {/* Warm leads */}
      <section data-testid="warm-leads" className="space-y-4">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-[18px] font-semibold tracking-tight text-[#111827]">
              Active warm leads
            </h2>
            <span className="text-[12px] text-[#9ca3af]">
              {filtered.length} · newest first
            </span>
            {convertedCount > 0 && (
              <span className="text-[11px] font-mono text-[#0f9b7c] bg-[#ecfdf7] border border-[#c8f0e4] rounded-full px-2.5 py-0.5">
                {convertedCount} converted to customer this month
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#eeeaf6] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table data-testid="warm-leads-table" className="w-full text-[13px]">
              <thead className="bg-[#faf9ff] border-b border-[#eeeaf6]">
                <tr className="text-left text-[11px] font-mono uppercase tracking-[0.14em] text-[#4b5563]">
                  <th className="py-3 px-5 min-w-[220px]">Lead</th>
                  <th className="py-3 px-5 min-w-[280px]">Recent activity</th>
                  <th className="py-3 px-5 min-w-[260px]">Signals</th>
                  <th className="py-3 px-5">Stage</th>
                  <th className="py-3 px-5 w-[92px]">Referred on</th>
                  <th className="py-3 px-5">Referred by</th>
                </tr>
              </thead>
              <tbody>
                {loadingLeads && (
                  <tr>
                    <td colSpan={6} className="py-8 px-5 text-center text-[12.5px] text-[#9ca3af]">
                      Loading warm leads…
                    </td>
                  </tr>
                )}
                {!loadingLeads && filtered.length === 0 && (
                  <tr data-testid="warm-leads-empty">
                    <td colSpan={6} className="py-8 px-5 text-center text-[12.5px] text-[#9ca3af]">
                      No referrals yet — warm leads will appear here as soon as your customers refer friends.
                    </td>
                  </tr>
                )}
                {filtered.map((l) => (
                  <tr
                    key={l.id}
                    data-testid={`warm-lead-${l.id}`}
                    onClick={() => setSelectedId(l.id)}
                    className="border-b border-[#f2eefa] hover:bg-[#faf9ff] cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-5 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#f5f3ff] text-[#6d46c6] flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {l.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-semibold text-[#111827] leading-tight truncate">
                            {l.name}
                          </div>
                          {(l.role || l.company) && (
                            <div className="text-[11px] uppercase tracking-[0.02em] text-[#6b7280] mt-0.5 truncate">
                              {l.role}
                              {l.role && l.company ? " at " : ""}
                              <span className="font-semibold text-[#374151]">{l.company}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 align-top">
                      {l.agentPlan?.researchHeadline ? (
                        <span
                          className="text-[12.5px] text-[#374151] leading-snug block"
                          title={l.agentPlan.researchHeadline}
                        >
                          {l.agentPlan.researchHeadline}
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#c7c2d6]">
                          {agentBusy.has(l.id) ? "Researching…" : "Not yet researched"}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 align-top">
                      <SignalsCell signals={l.signals} leadId={l.id} />
                    </td>
                    <td className="py-4 px-5 align-top">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap ${STAGE_STYLES[(WARM_LEAD_STAGES[l.stage] || WARM_LEAD_STAGES.new).tone]}`}
                      >
                        {(WARM_LEAD_STAGES[l.stage] || WARM_LEAD_STAGES.new).label}
                      </span>
                    </td>
                    <td className="py-4 px-5 align-top w-[92px]">
                      <span className="text-[11px] font-mono text-[#4b5563] leading-snug block whitespace-nowrap">
                        {formatDateShort(l.createdAt).date || "—"}
                      </span>
                      <span className="text-[10px] font-mono text-[#9ca3af] leading-snug block whitespace-nowrap">
                        {formatDateShort(l.createdAt).time}
                      </span>
                    </td>
                    <td className="py-4 px-5 align-top">
                      <div className="text-[12.5px] text-[#111827]">
                        {l.referrer.name}
                      </div>
                      {l.referrer.company && (
                        <div className="text-[10.5px] font-mono text-[#9ca3af] mt-0.5">
                          {l.referrer.company}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Agentic approvals panel — one-click on suggested actions per top lead */}
      <section data-testid="agentic-approvals" className="space-y-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[18px] font-semibold tracking-tight text-[#111827]">
            Agentic actions awaiting your approval
          </h2>
          <span className="text-[12px] text-[#9ca3af]">
            Uplaud drafted these · one-click to run
          </span>
        </div>
        <div className="rounded-2xl border border-[#eeeaf6] bg-white divide-y divide-[#f2eefa]">
          {topApprovalCandidates.length === 0 && (
            <div className="px-5 py-8 text-center text-[12.5px] text-[#9ca3af]">
              No warm leads yet for the Referral Agent to work on.
            </div>
          )}
          {topApprovalCandidates.map((l) => {
            const isBusy = agentBusy.has(l.id);
            const a = l.suggestedActions[0];

            if (isBusy || (!a && !l.agentPlan)) {
              return (
                <div
                  key={l.id}
                  data-testid={`approval-loading-${l.id}`}
                  className="flex items-center gap-3 px-5 py-4"
                >
                  <Loader2 className="w-3.5 h-3.5 text-[#6d46c6] animate-spin shrink-0" />
                  <div className="text-[12.5px] text-[#9ca3af]">
                    Researching {l.name}
                    {l.company ? ` at ${l.company}` : ""} and drafting outreach…
                  </div>
                </div>
              );
            }
            if (!a) return null;

            const status = l.agentPlan?.status || "pending";
            return (
              <div
                key={`${l.id}-${a.id}`}
                data-testid={`approval-${l.id}`}
                onClick={() => setSelectedId(l.id)}
                className="grid grid-cols-12 items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#faf9ff] transition-colors"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f5f3ff] text-[#6d46c6] flex items-center justify-center text-[11px] font-semibold shrink-0">
                    {l.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-[#111827] leading-tight truncate">
                      {l.name}
                    </div>
                    <div className="text-[10.5px] text-[#6b7280] truncate">
                      {l.role}
                      {l.role && l.company ? " at " : ""}
                      <span className="font-semibold text-[#374151]">{l.company}</span>
                    </div>
                  </div>
                </div>
                <div className="col-span-6 text-[12.5px] text-[#111827] leading-snug">
                  {a.label}
                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-mono uppercase tracking-wide bg-[#f5f3ff] text-[#6d46c6]">
                    {a.cta}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  {status === "pending" && (
                    <>
                      <button
                        data-testid={`approval-skip-${l.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSkip(l.id);
                        }}
                        className="text-[11.5px] text-[#9ca3af] hover:text-[#4b5563] px-2 py-1"
                      >
                        Skip
                      </button>
                      <button
                        data-testid={`approval-approve-${l.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(l.id);
                        }}
                        className="btn-primary h-9 !py-0 !px-3 !text-[12px]"
                      >
                        Approve
                        <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </>
                  )}
                  {status === "approved" && (
                    <span
                      data-testid={`approval-status-${l.id}`}
                      className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#0f9b7c]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Approved
                    </span>
                  )}
                  {status === "skipped" && (
                    <span
                      data-testid={`approval-status-${l.id}`}
                      className="text-[11.5px] text-[#9ca3af]"
                    >
                      Skipped
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {selected && (
        <LeadDrawer
          lead={selected}
          onClose={() => setSelectedId(null)}
          onGenerate={runAgentForLead}
          onApprove={handleApprove}
          onSkip={handleSkip}
          busy={agentBusy.has(selected.id)}
        />
      )}
    </div>
  );
}

/* ─────────────── Signals cell (expandable key/value enrichment) ─────────────── */
function SignalsCell({ signals, leadId }) {
  const [expanded, setExpanded] = useState(false);

  if (!signals || signals.length === 0) {
    return <span className="text-[11px] text-[#c7c2d6]">—</span>;
  }

  const [first, ...rest] = signals;

  return (
    <div data-testid={`signals-cell-${leadId}`} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2">
        <span
          className="text-[11.5px] text-[#4b5563] truncate max-w-[280px]"
          title={`${first.label}: ${first.value}`}
        >
          <span className="text-[#9ca3af]">{first.label}:</span> {first.value}
        </span>
        {rest.length > 0 && (
          <button
            data-testid={`signals-toggle-${leadId}`}
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-0.5 text-[10.5px] font-mono text-[#6d46c6] hover:text-[#4c2f96] shrink-0"
          >
            {expanded ? "show less" : `+${rest.length} more`}
            <ChevronDown
              className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
          </button>
        )}
      </div>
      {expanded && (
        <div
          data-testid={`signals-expanded-${leadId}`}
          className="mt-2 space-y-1 max-w-[320px] bg-[#faf9ff] border border-[#eeeaf6] rounded-lg p-2.5"
        >
          {rest.map((s, i) => (
            <div key={i} className="flex gap-1.5 text-[11px] leading-snug">
              <span className="text-[#9ca3af] shrink-0">{s.label}:</span>
              <span className="text-[#111827] truncate">{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────── Lead drawer ─────────────── */
function LeadDrawer({ lead: l, onClose, onGenerate, onApprove, onSkip, busy }) {
  const stage = WARM_LEAD_STAGES[l.stage] || WARM_LEAD_STAGES.new;
  const copy = (text, label) => {
    navigator.clipboard?.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <div
      data-testid="warm-lead-drawer"
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div
        className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-[560px] h-full bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#eeeaf6] px-6 h-14 flex items-center justify-between z-10">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
            Warm lead · {l.id}
          </div>
          <button
            data-testid="warm-lead-drawer-close"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[#eeeaf6] hover:border-[#d9d1ee] flex items-center justify-center"
          >
            <X className="w-4 h-4 text-[#4b5563]" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-[#f5f3ff] text-[#6d46c6] flex items-center justify-center text-[16px] font-semibold shrink-0">
              {l.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-[19px] font-semibold text-[#111827]">
                {l.name}
              </div>
              <div className="text-[13px] text-[#4b5563]">
                {l.role}
                {l.role && l.company ? " at " : ""}
                <span className="font-semibold text-[#374151]">{l.company}</span>
                {!l.role && !l.company && "No enrichment yet"}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${STAGE_STYLES[stage.tone]}`}
                >
                  {stage.label}
                </span>
                {l.enrichment.linkedin && (
                  <a
                    href={`https://${l.enrichment.linkedin}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono text-[#0a66c2] flex items-center gap-1 hover:underline"
                  >
                    <Linkedin className="w-3 h-3" strokeWidth={2} />
                    LinkedIn
                  </a>
                )}
                {l.pdlLikelihood != null && (
                  <span className="text-[10.5px] font-mono text-[#9ca3af]">
                    Match confidence {l.pdlLikelihood}/10
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Referrer + campaign */}
          <div className="rounded-2xl border border-[#eeeaf6] bg-[#faf9ff] p-4">
            <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#9ca3af]">
              Attributed to
            </div>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10.5px] font-mono text-[#9ca3af]">Referrer</div>
                <div className="text-[13px] font-medium text-[#111827] mt-0.5">
                  {l.referrer.name}
                </div>
                <div className="text-[11px] text-[#4b5563]">
                  {l.referrer.company}
                </div>
                <div className="text-[10.5px] font-mono text-[#9ca3af] mt-1">
                  {l.referrer.relationship}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] font-mono text-[#9ca3af]">Referred on</div>
                <div className="text-[13px] font-medium text-[#111827] mt-0.5">
                  {formatDateTime(l.createdAt) || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Enrichment */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#6d46c6]" strokeWidth={1.75} />
              <div className="text-[13px] font-display font-semibold text-[#111827]">
                Lead enrichment
              </div>
              <span className="ml-auto text-[10.5px] font-mono text-[#9ca3af]">
                LinkedIn · Crunchbase · Clearbit
              </span>
            </div>
            <div className="space-y-3">
              <EnrichRow icon={Building2} label="Company">
                <div className="text-[12.5px] text-[#111827]">
                  {[l.industry, l.headcount && `${l.headcount} employees`].filter(Boolean).join(" · ") || "—"}
                </div>
                {(l.location || l.enrichment.companyMetrics.arr) && (
                  <div className="text-[11px] text-[#4b5563] mt-0.5">
                    {[l.location, l.enrichment.companyMetrics.arr, l.enrichment.companyMetrics.growth]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                )}
              </EnrichRow>
              {l.enrichment.buyingSignals?.length > 0 && (
                <EnrichRow icon={Zap} label="Buying signals" accent>
                  <ul className="space-y-1">
                    {l.enrichment.buyingSignals.map((r, i) => (
                      <li
                        key={i}
                        className="text-[12px] text-[#0f9b7c] font-medium leading-relaxed"
                      >
                        · {r}
                      </li>
                    ))}
                  </ul>
                </EnrichRow>
              )}
              {(() => {
                const shownElsewhere = new Set(["Industry", "Company size", "Location", "Match confidence", "LinkedIn"]);
                const extra = (l.signals || []).filter((s) => !shownElsewhere.has(s.label));
                if (extra.length === 0) return null;
                return (
                  <EnrichRow icon={Sparkles} label="Additional PDL signals" data-testid={`drawer-pdl-signals-${l.id}`}>
                    <div className="space-y-1.5">
                      {extra.map((s, i) => (
                        <div key={i} className="flex gap-1.5 text-[12px] leading-relaxed">
                          <span className="text-[#9ca3af] shrink-0">{s.label}:</span>
                          <span className="text-[#111827] break-all">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </EnrichRow>
                );
              })()}
            </div>
          </div>

          {/* Referral Agent */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#6d46c6]" strokeWidth={1.75} />
              <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#9ca3af]">
                Referral Agent
              </div>
            </div>
            <div className="text-[15px] font-display font-semibold text-[#111827] leading-snug mb-3">
              {l.agentPlan?.researchHeadline || `What does the web know about ${l.name.split(" ")[0]}?`}
            </div>

            {!l.agentPlan && (
              <button
                data-testid={`generate-agent-plan-${l.id}`}
                onClick={() => onGenerate(l.id)}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#d9d1ee] bg-[#faf9ff] hover:bg-[#f5f3ff] text-[12.5px] font-medium text-[#6d46c6] py-3 transition-colors disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                    Researching &amp; drafting outreach…
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" strokeWidth={2} />
                    Generate agent plan
                  </>
                )}
              </button>
            )}

            {l.agentPlan && (
              <div className="space-y-3" data-testid={`agent-plan-${l.id}`}>
                {l.agentPlan.researchSummary?.length > 0 && (
                  <EnrichRow icon={Search} label="Web research">
                    <ul className="space-y-1.5">
                      {l.agentPlan.researchSummary.map((bullet, i) => (
                        <li key={i} className="flex gap-2 text-[12px] text-[#111827] leading-relaxed">
                          <span className="text-[#6d46c6] mt-0.5 shrink-0">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </EnrichRow>
                )}

                <div className="rounded-xl border border-[#eeeaf6] bg-white p-3">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="text-[12.5px] font-medium text-[#111827] leading-snug">
                      {l.agentPlan.nextAction.label}
                    </div>
                    <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-mono uppercase tracking-wide bg-[#f5f3ff] text-[#6d46c6]">
                      {l.agentPlan.nextAction.cta}
                    </span>
                  </div>
                  {l.agentPlan.status === "pending" && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        data-testid={`drawer-agent-skip-${l.id}`}
                        onClick={() => onSkip(l.id)}
                        className="text-[11.5px] text-[#9ca3af] hover:text-[#4b5563] px-2 py-1"
                      >
                        Skip
                      </button>
                      <button
                        data-testid={`drawer-agent-approve-${l.id}`}
                        onClick={() => onApprove(l.id)}
                        className="btn-primary h-9 !py-0 !px-3 !text-[12px]"
                      >
                        Approve
                        <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  )}
                  {l.agentPlan.status === "approved" && (
                    <div className="flex items-center gap-1 text-[11.5px] font-medium text-[#0f9b7c] mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Approved — queued to send
                    </div>
                  )}
                  {l.agentPlan.status === "skipped" && (
                    <div className="text-[11.5px] text-[#9ca3af] mt-1">Skipped</div>
                  )}
                </div>

                {l.agentPlan.emailBody && (
                  <div className="rounded-xl border border-[#eeeaf6] bg-white p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-[11px] font-mono uppercase tracking-wide text-[#9ca3af]">Email draft</div>
                      <button
                        data-testid={`copy-email-${l.id}`}
                        onClick={() => copy(`Subject: ${l.agentPlan.emailSubject}\n\n${l.agentPlan.emailBody}`, "Email")}
                        className="text-[#6d46c6] hover:text-[#4c2f96]"
                      >
                        <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                    <div className="text-[12px] font-medium text-[#111827] mb-1">{l.agentPlan.emailSubject}</div>
                    <div className="text-[12px] text-[#4b5563] leading-relaxed whitespace-pre-line">{l.agentPlan.emailBody}</div>
                  </div>
                )}

                {l.agentPlan.linkedinMessage && (
                  <div className="rounded-xl border border-[#eeeaf6] bg-white p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-[11px] font-mono uppercase tracking-wide text-[#9ca3af] flex items-center gap-1">
                        <Linkedin className="w-3 h-3" strokeWidth={1.75} /> LinkedIn InMail draft
                      </div>
                      <button
                        data-testid={`copy-linkedin-${l.id}`}
                        onClick={() => copy(l.agentPlan.linkedinMessage, "LinkedIn message")}
                        className="text-[#6d46c6] hover:text-[#4c2f96]"
                      >
                        <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                    <div className="text-[12px] text-[#4b5563] leading-relaxed whitespace-pre-line">{l.agentPlan.linkedinMessage}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Referral Agent actions */}
          {l.agentPlan ? (
            <div className="flex items-center gap-3">
              <button
                data-testid={`drawer-copy-plan-${l.id}`}
                onClick={() =>
                  copy(
                    [
                      `Subject: ${l.agentPlan.emailSubject}`,
                      "",
                      l.agentPlan.emailBody,
                      "",
                      "---",
                      "LinkedIn InMail:",
                      l.agentPlan.linkedinMessage,
                    ]
                      .filter(Boolean)
                      .join("\n"),
                    "Outreach plan"
                  )
                }
                className="btn-secondary flex-1 justify-center h-11"
              >
                <Copy className="w-4 h-4" strokeWidth={1.75} />
                Copy to clipboard
              </button>
              <button
                data-testid={`regenerate-agent-plan-${l.id}`}
                onClick={() => onGenerate(l.id, true)}
                disabled={busy}
                className="btn-secondary flex-1 justify-center h-11 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
                ) : (
                  <Search className="w-4 h-4" strokeWidth={1.75} />
                )}
                {busy ? "Regenerating…" : "Regenerate"}
              </button>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function EnrichRow({ icon: Icon, label, children, accent }) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        accent
          ? "border-[#c8f0e4] bg-[#ecfdf7]"
          : "border-[#eeeaf6] bg-white"
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-[#6d46c6]" strokeWidth={1.75} />
        <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#9ca3af]">
          {label}
        </div>
      </div>
      {children}
    </div>
  );
}
