import { useState } from "react";
import {
  Users,
  ArrowUpRight,
  ArrowRight,
  X,
  Sparkles,
  Linkedin,
  TrendingUp,
  Zap,
  Send,
  DollarSign,
  Building2,
  Award,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import {
  WARM_LEADS,
  WARM_LEAD_STAGES,
  REFERRAL_CAMPAIGNS,
  PAGE_OUTCOMES,
  SMART_NBA,
} from "@/mocks/fintech";
import { toast } from "sonner";
import PageHero from "@/components/business/PageHero";

const STAGE_STYLES = {
  purple: "bg-[#f5f3ff] text-[#6d46c6] border-[#e2d9f5]",
  amber: "bg-[#fef9c3] text-[#a16207] border-[#f4e08a]",
  mint: "bg-[#ecfdf7] text-[#0f9b7c] border-[#c8f0e4]",
  grey: "bg-[#f5f5f5] text-[#6b7280] border-[#e5e7eb]",
};

const STAGE_ORDER = ["converted", "negotiation", "demoed", "booked", "clicked", "new", "cold"];

export default function ReferralAgentPage() {
  const [selected, setSelected] = useState(null);
  const [campaignFilter, setCampaignFilter] = useState("all");

  const sorted = [...WARM_LEADS].sort((a, b) => {
    const sd = STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage);
    if (sd !== 0) return sd;
    return b.hotness - a.hotness;
  });

  const filtered = sorted.filter((l) =>
    campaignFilter === "all" ? true : l.campaignId === campaignFilter
  );

  return (
    <div data-testid="referral-agent-page" className="space-y-12">
      <PageHero
        eyebrow={PAGE_OUTCOMES.referrals.eyebrow}
        question={PAGE_OUTCOMES.referrals.question}
        northStar={PAGE_OUTCOMES.referrals.northStar}
        smartAction={SMART_NBA.referrals}
        onAction={() =>
          toast.success("Healthcare CFO campaign launched", {
            description: "22 warm intros dispatching over 5 days.",
          })
        }
      />

      {/* Warm leads */}
      <section data-testid="warm-leads" className="space-y-6">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-[20px] font-semibold tracking-tight text-[#111827]">
              Warm leads generated
            </h2>
            <span className="text-[12px] text-[#9ca3af]">
              {filtered.length} of {WARM_LEADS.length} · ranked by stage + fit
            </span>
          </div>
          <select
            data-testid="warm-leads-campaign-filter"
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="h-10 px-4 rounded-full border border-[#eeeaf6] bg-white text-[13px] text-[#4b5563] focus:outline-none focus:border-[#d9d1ee]"
          >
            <option value="all">All campaigns</option>
            {REFERRAL_CAMPAIGNS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-[#eeeaf6] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table data-testid="warm-leads-table" className="w-full text-[13px]">
              <thead className="bg-[#faf9ff] border-b border-[#eeeaf6]">
                <tr className="text-left text-[11px] font-mono uppercase tracking-[0.14em] text-[#4b5563]">
                  <th className="py-3 px-5">Lead</th>
                  <th className="py-3 px-5">Referred by</th>
                  <th className="py-3 px-5">Campaign</th>
                  <th className="py-3 px-5">Stage</th>
                  <th className="py-3 px-5">Fit</th>
                  <th className="py-3 px-5">Signals</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr
                    key={l.id}
                    data-testid={`warm-lead-${l.id}`}
                    onClick={() => setSelected(l)}
                    className="border-b border-[#f2eefa] hover:bg-[#faf9ff] cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#f5f3ff] text-[#6d46c6] flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {l.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-[#111827] leading-tight">
                            {l.name}
                          </div>
                          <div className="text-[11px] text-[#4b5563] mt-0.5 truncate">
                            {l.role} · {l.company}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-[12.5px] text-[#111827]">
                        {l.referrer.name}
                      </div>
                      <div className="text-[10.5px] font-mono text-[#9ca3af] mt-0.5">
                        {l.referrer.company}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="text-[11.5px] font-medium text-[#6d46c6]">
                        {l.campaign}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border ${STAGE_STYLES[WARM_LEAD_STAGES[l.stage].tone]}`}
                      >
                        {WARM_LEAD_STAGES[l.stage].label}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[#eeeaf6] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#6d46c6] to-[#5eead4]"
                            style={{ width: `${l.hotness * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-[#4b5563]">
                          {Math.round(l.hotness * 100)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        {l.enrichment.recent.slice(0, 1).map((r, i) => (
                          <span
                            key={i}
                            className="text-[11px] text-[#4b5563] truncate max-w-[220px]"
                            title={r}
                          >
                            · {r}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Active campaigns as secondary content */}
      <section data-testid="active-campaigns" className="space-y-6">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-[#111827]">
            Active referral campaigns
          </h2>
          <span className="text-[12px] text-[#9ca3af]">
            Every campaign is seeded from a real customer testimonial
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REFERRAL_CAMPAIGNS.map((c) => (
            <CampaignCard key={c.id} c={c} />
          ))}
        </div>
      </section>

      {selected && (
        <LeadDrawer lead={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

/* ─────────────── Lead drawer ─────────────── */
function LeadDrawer({ lead: l, onClose }) {
  const stage = WARM_LEAD_STAGES[l.stage];

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
                {l.role} · {l.company}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${STAGE_STYLES[stage.tone]}`}
                >
                  {stage.label}
                </span>
                <a
                  href={`https://${l.enrichment.linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-[#0a66c2] flex items-center gap-1 hover:underline"
                >
                  <Linkedin className="w-3 h-3" strokeWidth={2} />
                  LinkedIn
                </a>
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
                <div className="text-[10.5px] font-mono text-[#9ca3af]">Campaign</div>
                <div className="text-[13px] font-medium text-[#6d46c6] mt-0.5">
                  {l.campaign}
                </div>
                <div className="text-[10.5px] font-mono text-[#9ca3af] mt-1">
                  Received {l.receivedAt}
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
                  {l.industry} · {l.headcount} employees
                </div>
                <div className="text-[11px] text-[#4b5563] mt-0.5">
                  {l.enrichment.companyMetrics.arr}
                  {l.enrichment.companyMetrics.growth &&
                    ` · ${l.enrichment.companyMetrics.growth}`}
                </div>
              </EnrichRow>
              <EnrichRow icon={DollarSign} label="Monthly vendor spend">
                <div className="text-[12.5px] font-mono text-[#111827]">
                  {l.monthlySpend}
                </div>
              </EnrichRow>
              <EnrichRow icon={Award} label="Recent activity">
                <ul className="space-y-1">
                  {l.enrichment.recent.map((r, i) => (
                    <li key={i} className="text-[12px] text-[#111827] leading-relaxed">
                      · {r}
                    </li>
                  ))}
                </ul>
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
            </div>
          </div>

          {/* Suggested actions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[#6d46c6]" strokeWidth={1.75} />
              <div className="text-[13px] font-display font-semibold text-[#111827]">
                Suggested next actions
              </div>
            </div>
            <div className="space-y-2">
              {l.suggestedActions.map((a) => (
                <button
                  key={a.id}
                  data-testid={`suggest-${l.id}-${a.id}`}
                  onClick={() =>
                    toast.success(`Queued: ${a.label}`, {
                      description: `For ${l.name} — projected next-stage advance.`,
                    })
                  }
                  className="w-full text-left rounded-xl border border-[#eeeaf6] hover:border-[#d9d1ee] bg-white p-3 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight
                      className="w-3.5 h-3.5 text-[#6d46c6]"
                      strokeWidth={2}
                    />
                    <div className="text-[12.5px] text-[#111827] leading-tight">
                      {a.label}
                    </div>
                    <ArrowUpRight
                      className="ml-auto w-3.5 h-3.5 text-[#9ca3af] group-hover:text-[#6d46c6]"
                      strokeWidth={1.75}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Primary CTA */}
          <button
            data-testid="warm-lead-open-in-crm"
            onClick={() => toast.info("Would open lead in HubSpot")}
            className="btn-primary w-full justify-center h-11"
          >
            Open in HubSpot
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
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

/* ─────────────── Campaign card (secondary) ─────────────── */
function CampaignCard({ c }) {
  const status = c.status === "active" ? "mint" : "purple";
  return (
    <div
      data-testid={`campaign-card-${c.id}`}
      className="rounded-2xl border border-[#eeeaf6] bg-white p-5"
    >
      <div className="flex items-center gap-2">
        <div className="text-[13.5px] font-display font-semibold text-[#111827] leading-tight">
          {c.name}
        </div>
        <span
          className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono border ${STAGE_STYLES[status]}`}
        >
          {c.status}
        </span>
      </div>
      <div className="mt-2 text-[11px] font-mono text-[#9ca3af]">
        {c.channel} · {c.incentive}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <MiniStat label="Sent" value={c.sent} />
        <MiniStat label="Booked" value={c.booked} />
        <MiniStat label="Won" value={c.converted} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg bg-[#faf9ff] border border-[#eeeaf6] py-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#9ca3af]">
        {label}
      </div>
      <div className="mt-0.5 text-[13px] font-display font-semibold text-[#111827]">
        {value}
      </div>
    </div>
  );
}
