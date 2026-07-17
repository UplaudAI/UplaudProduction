import { useState } from "react";
import {
  Users,
  Plus,
  Send,
  Mail,
  MessageSquare,
  Gift,
  TrendingUp,
  ArrowRight,
  Copy,
  Sparkles,
  X,
} from "lucide-react";
import { REFERRAL_CAMPAIGNS, REVIEWS } from "@/mocks/fintech";
import { toast } from "sonner";

const STATUS_STYLES = {
  active: "bg-[#ecfdf7] text-[#0f9b7c] border-[#c8f0e4]",
  draft: "bg-[#f5f3ff] text-[#6d46c6] border-[#e2d9f5]",
  paused: "bg-[#fef9c3] text-[#a16207] border-[#f4e08a]",
};

export default function ReferralAgentPage() {
  const [selectedId, setSelectedId] = useState(REFERRAL_CAMPAIGNS[0].id);
  const [showBuilder, setShowBuilder] = useState(false);

  const campaign = REFERRAL_CAMPAIGNS.find((c) => c.id === selectedId);
  const seedReviews = campaign.seedReviewIds
    .map((id) => REVIEWS.find((r) => r.id === id))
    .filter(Boolean);

  const conversionRate =
    campaign.sent > 0
      ? ((campaign.converted / campaign.sent) * 100).toFixed(1)
      : "0.0";

  return (
    <div data-testid="referral-agent-page" className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-[#111827]">
            Referral Agent
          </h1>
          <p className="text-[13px] text-[#4b5563] mt-1">
            Convert happy reviewers into warm referrals — automatically drafted,
            approved by you.
          </p>
        </div>
        <button
          data-testid="referral-new-campaign-btn"
          onClick={() => setShowBuilder(true)}
          className="btn-primary h-10 !py-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          New campaign
        </button>
      </div>

      {/* Layout: campaigns list + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List */}
        <aside className="lg:col-span-4 space-y-3">
          {REFERRAL_CAMPAIGNS.map((c) => (
            <button
              key={c.id}
              data-testid={`campaign-card-${c.id}`}
              onClick={() => setSelectedId(c.id)}
              className={`w-full text-left rounded-2xl border p-4 transition-all ${
                selectedId === c.id
                  ? "border-[#6d46c6] bg-[#f5f3ff]"
                  : "border-[#eeeaf6] bg-white hover:border-[#d9d1ee]"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="text-[13.5px] font-display font-semibold text-[#111827] leading-tight">
                  {c.name}
                </div>
                <span
                  className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono border ${STATUS_STYLES[c.status]}`}
                >
                  {c.status}
                </span>
              </div>
              <div className="mt-2 text-[11.5px] font-mono text-[#9ca3af]">
                {c.channel} · {c.incentive}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <MiniStat label="Sent" value={c.sent} />
                <MiniStat label="Booked" value={c.booked} />
                <MiniStat label="Rev" value={c.revenue} />
              </div>
            </button>
          ))}
        </aside>

        {/* Detail */}
        <section className="lg:col-span-8 space-y-5">
          <div className="rounded-2xl border border-[#eeeaf6] bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
                  Campaign · {campaign.id}
                </div>
                <div className="mt-1 font-display text-[22px] font-semibold text-[#111827]">
                  {campaign.name}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#4b5563]">
                  <span className="flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {campaign.incentive}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
                    {campaign.channel}
                  </span>
                  {campaign.started && (
                    <>
                      <span>·</span>
                      <span className="font-mono">Started {campaign.started}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                data-testid="campaign-launch-btn"
                onClick={() =>
                  toast.success("Referrals dispatched", {
                    description: `${seedReviews.length * 4} warm intros queued for send.`,
                  })
                }
                className="btn-primary h-10 !py-0"
              >
                <Send className="w-4 h-4" strokeWidth={1.75} />
                Launch to seed list
              </button>
            </div>

            {/* Funnel */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Sent", value: campaign.sent, icon: Send },
                { label: "Clicked", value: campaign.clicked, icon: TrendingUp },
                { label: "Booked", value: campaign.booked, icon: Users },
                { label: "Converted", value: campaign.converted, icon: Sparkles },
                { label: "Revenue", value: campaign.revenue, icon: Gift },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl bg-[#faf9ff] border border-[#eeeaf6] p-3"
                >
                  <div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#9ca3af]">
                    <s.icon className="w-3 h-3" strokeWidth={1.75} />
                    {s.label}
                  </div>
                  <div className="mt-1 font-display text-[20px] font-semibold text-[#111827]">
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3 text-[12px]">
              <div className="flex-1 h-2 rounded-full bg-[#eeeaf6] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6d46c6] to-[#5eead4]"
                  style={{
                    width: `${Math.min(100, Number(conversionRate) * 20)}%`,
                  }}
                />
              </div>
              <span className="font-mono text-[#4b5563]">
                {conversionRate}% send → convert
              </span>
            </div>
          </div>

          {/* Message preview */}
          <div className="rounded-2xl border border-[#eeeaf6] bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare
                className="w-4 h-4 text-[#6d46c6]"
                strokeWidth={1.75}
              />
              <div className="text-[13px] font-display font-semibold text-[#111827]">
                Auto-drafted messages
              </div>
              <span className="ml-auto text-[10.5px] font-mono text-[#9ca3af]">
                Personalised per reviewer · edit before send
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seedReviews.map((rv) => (
                <MessageCard
                  key={rv.id}
                  reviewer={rv}
                  channel={campaign.channel}
                  incentive={campaign.incentive}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      {showBuilder && <CampaignBuilderModal onClose={() => setShowBuilder(false)} />}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg bg-white/60 border border-[#eeeaf6] py-2">
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#9ca3af]">
        {label}
      </div>
      <div className="mt-0.5 text-[13px] font-display font-semibold text-[#111827]">
        {value}
      </div>
    </div>
  );
}

function MessageCard({ reviewer, channel, incentive }) {
  const friendName = ["Rachel", "David", "Priyanka", "Marcus", "Sarah"][
    reviewer.id.charCodeAt(reviewer.id.length - 1) % 5
  ];
  const first = reviewer.customer.split(" ")[0];

  return (
    <div
      data-testid={`referral-message-${reviewer.id}`}
      className="rounded-xl border border-[#eeeaf6] bg-[#faf9ff] p-4"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#f5f3ff] text-[#6d46c6] flex items-center justify-center text-[11px] font-semibold">
          {reviewer.customer.split(" ").map((n) => n[0]).join("")}
        </div>
        <div className="min-w-0">
          <div className="text-[12.5px] font-medium text-[#111827] leading-tight">
            {reviewer.customer} <span className="text-[#9ca3af]">→</span> {friendName}
          </div>
          <div className="text-[10.5px] font-mono text-[#9ca3af]">
            via {channel} · {reviewer.ltv}
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-white border border-[#eeeaf6] p-3">
        <p className="text-[12.5px] leading-relaxed text-[#111827]">
          Hey {friendName}! I know you were asking about advisors last month —
          I wrote about my experience with Westgate. They handled my {reviewer.tags[0] || "planning"} the way I wish someone had years ago. If you want, they'll waive the intake fee for you: <span className="font-mono text-[#6d46c6]">uplaud.co/wg-{first.toLowerCase()}</span>
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded-full bg-[#5eead4] text-[#261c4d] text-[9.5px] font-mono font-semibold">
            {incentive}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          data-testid={`referral-copy-${reviewer.id}`}
          onClick={() => toast.success("Copied warm intro to clipboard")}
          className="text-[11.5px] text-[#6d46c6] hover:underline flex items-center gap-1"
        >
          <Copy className="w-3.5 h-3.5" strokeWidth={1.75} /> Copy
        </button>
        <button
          data-testid={`referral-send-${reviewer.id}`}
          onClick={() =>
            toast.success(`Sent ${first} → ${friendName} via ${channel}`)
          }
          className="ml-auto btn-secondary h-8 !py-0 !px-3 !text-[11.5px]"
        >
          Send
          <ArrowRight className="w-3 h-3" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function CampaignBuilderModal({ onClose }) {
  return (
    <div
      data-testid="campaign-builder-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#111827]/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[560px] rounded-2xl bg-white shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="text-[16px] font-display font-semibold text-[#111827]">
            New referral campaign
          </div>
          <button
            data-testid="builder-close"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[#eeeaf6] hover:border-[#d9d1ee] flex items-center justify-center"
          >
            <X className="w-4 h-4 text-[#4b5563]" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <FormField label="Campaign name">
            <input
              data-testid="builder-name-input"
              defaultValue="Q1 High-LTV Warm Intros"
              className="w-full h-11 px-4 rounded-xl border border-[#eeeaf6] bg-white text-[13px] focus:outline-none focus:border-[#d9d1ee]"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Channel">
              <select
                data-testid="builder-channel-select"
                className="w-full h-11 px-4 rounded-xl border border-[#eeeaf6] bg-white text-[13px] focus:outline-none focus:border-[#d9d1ee]"
              >
                <option>SMS + Email</option>
                <option>Email only</option>
                <option>LinkedIn DM</option>
              </select>
            </FormField>
            <FormField label="Incentive">
              <input
                data-testid="builder-incentive-input"
                defaultValue="$500 statement credit"
                className="w-full h-11 px-4 rounded-xl border border-[#eeeaf6] bg-white text-[13px] focus:outline-none focus:border-[#d9d1ee]"
              />
            </FormField>
          </div>
          <FormField label="Seed audience">
            <div className="rounded-xl border border-[#eeeaf6] bg-[#faf9ff] p-3 text-[12.5px] text-[#4b5563]">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-[#6d46c6]" strokeWidth={1.75} />
                <b className="text-[#111827]">Auto-seeded:</b> 47 reviewers with rating ≥ 5, LTV ≥ $10k, positive sentiment
              </div>
            </div>
          </FormField>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button
            data-testid="builder-cancel"
            onClick={onClose}
            className="btn-secondary flex-1 justify-center h-11"
          >
            Cancel
          </button>
          <button
            data-testid="builder-save"
            onClick={() => {
              toast.success("Campaign created — drafting messages");
              onClose();
            }}
            className="btn-primary flex-1 justify-center h-11"
          >
            Create campaign
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#4b5563]">
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
