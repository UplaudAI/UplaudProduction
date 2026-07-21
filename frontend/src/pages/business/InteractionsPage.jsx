import { useState } from "react";
import {
  Radio,
  Filter,
  Search,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Zap,
  X,
} from "lucide-react";
import { INTERACTIONS, INTERACTION_TYPES, ACTIVATION_STATES, PAGE_OUTCOMES } from "@/mocks/fintech";
import { toast } from "sonner";
import PageHero from "@/components/business/PageHero";

const STATE_STYLES = {
  grey: "bg-[#f5f5f5] text-[#6b7280] border-[#e5e7eb]",
  purple: "bg-[#f5f3ff] text-[#6d46c6] border-[#e2d9f5]",
  mint: "bg-[#ecfdf7] text-[#0f9b7c] border-[#c8f0e4]",
  amber: "bg-[#fef9c3] text-[#a16207] border-[#f4e08a]",
};

export default function InteractionsPage() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = INTERACTIONS.filter((i) => {
    if (
      query &&
      !`${i.person} ${i.company} ${i.note}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
      return false;
    if (typeFilter !== "all" && i.type !== typeFilter) return false;
    if (stateFilter !== "all" && i.state !== stateFilter) return false;
    return true;
  });

  return (
    <div data-testid="interactions-page" className="space-y-10">
      <PageHero
        eyebrow={PAGE_OUTCOMES.interactions.eyebrow}
        question={PAGE_OUTCOMES.interactions.question}
        northStar={PAGE_OUTCOMES.interactions.northStar}
        action={PAGE_OUTCOMES.interactions.action}
        onAction={() =>
          toast.success("Feedback prompts queued for top 20 attendees", {
            description: "Projected +$168k pipeline.",
          })
        }
      />

      {/* Section header */}
      <div className="flex items-baseline gap-3">
        <h2 className="font-display text-[20px] font-semibold tracking-tight text-[#111827]">
          Every interaction, ranked by untapped value
        </h2>
        <span className="text-[12px] text-[#9ca3af]">
          Sorted by monthly spend
        </span>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-[420px]">
          <Search className="w-4 h-4 text-[#9ca3af] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            data-testid="interactions-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search person, company..."
            className="w-full h-10 pl-10 pr-4 rounded-full border border-[#eeeaf6] bg-white text-[13px] focus:outline-none focus:border-[#d9d1ee] transition-all"
          />
        </div>
        <select
          data-testid="interactions-type-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 px-4 rounded-full border border-[#eeeaf6] bg-white text-[13px] text-[#4b5563] focus:outline-none focus:border-[#d9d1ee]"
        >
          <option value="all">All types</option>
          {Object.entries(INTERACTION_TYPES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select
          data-testid="interactions-state-filter"
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="h-10 px-4 rounded-full border border-[#eeeaf6] bg-white text-[13px] text-[#4b5563] focus:outline-none focus:border-[#d9d1ee]"
        >
          <option value="all">All states</option>
          {Object.entries(ACTIVATION_STATES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#eeeaf6] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table data-testid="interactions-table" className="w-full text-[13px]">
            <thead className="bg-[#faf9ff] border-b border-[#eeeaf6]">
              <tr className="text-left text-[11px] font-mono uppercase tracking-[0.14em] text-[#4b5563]">
                <th className="py-3 px-5">Person</th>
                <th className="py-3 px-5">Type</th>
                <th className="py-3 px-5">Source</th>
                <th className="py-3 px-5">Value</th>
                <th className="py-3 px-5">Signal</th>
                <th className="py-3 px-5">Activation</th>
                <th className="py-3 px-5">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const meta = INTERACTION_TYPES[i.type];
                const state = ACTIVATION_STATES[i.state];
                return (
                  <tr
                    key={i.id}
                    data-testid={`interaction-row-${i.id}`}
                    onClick={() => setSelected(i)}
                    className="border-b border-[#f2eefa] hover:bg-[#faf9ff] cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                          style={{ backgroundColor: meta.color }}
                        >
                          {i.person.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-[#111827] leading-tight">
                            {i.person}
                          </div>
                          <div className="text-[11px] text-[#4b5563]">
                            {i.role} · {i.company}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                        style={{
                          backgroundColor: `${meta.color}18`,
                          color: meta.color,
                        }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-[12px] text-[#4b5563]">
                      {i.source}
                    </td>
                    <td className="py-4 px-5 font-mono text-[12px] text-[#4b5563]">
                      {i.monthlySpend}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full bg-[#eeeaf6] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#6d46c6] to-[#5eead4]"
                            style={{ width: `${i.signalScore * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-[#4b5563]">
                          {Math.round(i.signalScore * 100)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${STATE_STYLES[state.tone]}`}
                      >
                        {state.label}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-[11.5px] font-mono text-[#9ca3af]">
                      {i.date}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <InteractionDrawer
          interaction={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function SumTile() {
  // deprecated — kept as no-op to avoid breaking imports
  return null;
}

function InteractionDrawer({ interaction, onClose }) {
  const meta = INTERACTION_TYPES[interaction.type];
  const state = ACTIVATION_STATES[interaction.state];
  const i = interaction;

  const ACTIONS = [
    {
      id: "prompt",
      label: "Send feedback prompt",
      icon: Send,
      hint: "Personalised, one-click reply",
      priority: "high",
    },
    {
      id: "story",
      label: "Draft a customer story",
      icon: Sparkles,
      hint: "From conversation transcript",
      priority: "high",
    },
    {
      id: "intro",
      label: "Request a warm intro",
      icon: ArrowUpRight,
      hint: "3 lookalikes in their network",
      priority: "medium",
    },
    {
      id: "amplify",
      label: "Add to Social Agent queue",
      icon: Zap,
      hint: "LinkedIn draft, founder tone",
      priority: "medium",
    },
  ];

  return (
    <div
      data-testid="interaction-drawer"
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div
        className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-[540px] h-full bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#eeeaf6] px-6 h-14 flex items-center justify-between z-10">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
            Interaction · {i.id}
          </div>
          <button
            data-testid="interaction-drawer-close"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[#eeeaf6] hover:border-[#d9d1ee] flex items-center justify-center"
          >
            <X className="w-4 h-4 text-[#4b5563]" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[15px] font-semibold shrink-0"
              style={{ backgroundColor: meta.color }}
            >
              {i.person.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-[17px] font-semibold text-[#111827]">
                {i.person}
              </div>
              <div className="text-[12.5px] text-[#4b5563]">
                {i.role} · {i.company}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                  style={{
                    backgroundColor: `${meta.color}18`,
                    color: meta.color,
                  }}
                >
                  {meta.label}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${STATE_STYLES[state.tone]}`}
                >
                  {state.label}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <MiniStat label="Monthly value" value={i.monthlySpend} />
            <MiniStat label="Signal score" value={`${Math.round(i.signalScore * 100)}`} />
            <MiniStat label="Source" value={i.source.split(" ")[0]} small />
          </div>

          <div className="rounded-xl border border-[#eeeaf6] bg-[#faf9ff] p-4">
            <div className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#9ca3af]">
              Rep notes
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[#111827]">
              {i.note}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#6d46c6]" strokeWidth={1.75} />
              <div className="text-[13px] font-display font-semibold text-[#111827]">
                Suggested activations
              </div>
            </div>
            <div className="space-y-2">
              {ACTIONS.map((a) => (
                <button
                  key={a.id}
                  data-testid={`activation-${a.id}`}
                  onClick={() =>
                    toast.success(`${a.label} queued for ${i.person}`)
                  }
                  className="w-full text-left rounded-xl border border-[#eeeaf6] hover:border-[#d9d1ee] bg-white p-4 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#f5f3ff] text-[#6d46c6] flex items-center justify-center shrink-0">
                      <a.icon className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[#111827] leading-tight">
                        {a.label}
                      </div>
                      <div className="text-[11px] font-mono text-[#9ca3af] mt-0.5">
                        {a.hint}
                      </div>
                    </div>
                    {a.priority === "high" && (
                      <span className="text-[10px] font-mono text-[#0f9b7c] bg-[#ecfdf7] border border-[#c8f0e4] rounded-full px-2 py-0.5">
                        high
                      </span>
                    )}
                    <ArrowUpRight
                      className="w-4 h-4 text-[#9ca3af] group-hover:text-[#6d46c6]"
                      strokeWidth={1.75}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function MiniStat({ label, value, small }) {
  return (
    <div className="rounded-lg bg-[#faf9ff] border border-[#eeeaf6] p-3">
      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#9ca3af]">
        {label}
      </div>
      <div
        className={`mt-1 font-display font-semibold text-[#111827] leading-none ${small ? "text-[13px]" : "text-[18px]"}`}
      >
        {value}
      </div>
    </div>
  );
}
