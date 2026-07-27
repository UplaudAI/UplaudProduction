import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "@/lib/business-storage";
import {
  Sparkles,
  ArrowUpRight,
  MessageSquare,
  FileCheck,
  TrendingUp,
  Ghost,
  Lightbulb,
  RefreshCcw,
} from "lucide-react";
import {
  PAGE_OUTCOMES,
  OPPORTUNITIES,
  VALUE_CHAIN,
  SMART_NBA,
  JOURNEY_STAGES,
} from "@/mocks/fintech";
import PageHero from "@/components/business/PageHero";

const OPP_ICONS = { MessageSquare, FileCheck, Sparkles, TrendingUp, Ghost };

export default function InsightsPage() {
  const outcome = PAGE_OUTCOMES.overview;

  return (
    <div data-testid="insights-page" className="space-y-14">
      <PageHero
        eyebrow={outcome.eyebrow}
        question="Where is Uplaud creating warm pipeline you weren't getting from paid?"
        subhead="Uplaud converts your existing demos, trials and customers into a compounding referral + amplification engine."
        valueChain={VALUE_CHAIN}
        smartAction={SMART_NBA.overview}
      />

      {/* Editable funnel */}
      <EditableFunnel />

      {/* Where should I focus next */}
      <section data-testid="opportunities" className="space-y-6">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-[#111827]">
            Where should you focus next
          </h2>
          <span className="text-[12px] text-[#9ca3af]">
            Auto-updates when you edit the funnel above
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {OPPORTUNITIES.slice(0, 2).map((op) => (
            <OpportunityCard key={op.id} op={op} large />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {OPPORTUNITIES.slice(2).map((op) => (
            <OpportunityCard key={op.id} op={op} />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─────────────── Editable funnel ─────────────── */
function EditableFunnel() {
  const initial = useMemo(
    () => JOURNEY_STAGES.reduce((acc, s) => ({ ...acc, [s.id]: s.count }), {}),
    []
  );
  const [values, setValues] = useState(initial);
  const [editMode, setEditMode] = useState(false);

  const stages = JOURNEY_STAGES.map((s) => ({ ...s, count: values[s.id] }));
  const max = Math.max(...stages.map((s) => s.count || 1));

  const phaseColor = {
    acquisition: "#c9b3ee",
    activation: "#8f66d8",
    pipeline: "#6d46c6",
    revenue: "#4a1f9a",
    advocacy: "#5eead4",
  };

  return (
    <section
      data-testid="growth-funnel"
      className="rounded-2xl border border-[#eeeaf6] bg-white p-8"
    >
      {/* Header */}
      <div className="flex items-baseline gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-[#111827]">
              const user = getAuth();
  const businessName = user?.workspace || user?.company || "My Company";

  return (
    <section
      data-testid="growth-funnel"
      className="rounded-2xl border border-[#eeeaf6] bg-white p-8"
    >
      {/* Header */}
      <div className="flex items-baseline gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-[20px] font-semibold tracking-tight text-[#111827]">
            The {businessName} growth funnel
          </h2>
          </h2>
          <p className="text-[12px] text-[#9ca3af] mt-1">
            {editMode
              ? "Editing — enter your own numbers to see opportunities recalc."
              : "Meta + Google → Uplaud → Advocates · click Edit to plug in your real numbers."}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {editMode && (
            <button
              data-testid="funnel-reset-btn"
              onClick={() => {
                setValues(initial);
              }}
              className="text-[11.5px] text-[#4b5563] hover:text-[#111827] flex items-center gap-1"
            >
              <RefreshCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
              Reset
            </button>
          )}
          <button
            data-testid="funnel-edit-toggle"
            onClick={() => setEditMode((e) => !e)}
            className={`text-[11.5px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
              editMode
                ? "bg-[#261c4d] text-white border-[#261c4d]"
                : "bg-white text-[#6d46c6] border-[#e2d9f5] hover:border-[#6d46c6]"
            }`}
          >
            {editMode ? "Done editing" : "Edit funnel"}
          </button>
        </div>
      </div>

      {/* Column header row */}
      <div className="mt-6 grid grid-cols-12 gap-4 text-[10px] font-mono uppercase tracking-[0.14em] text-[#9ca3af] pb-3 border-b border-[#eeeaf6]">
        <div className="col-span-3">Stage</div>
        <div className="col-span-5">People</div>
        <div className="col-span-1 text-right">Conv.</div>
        <div className="col-span-3">Uplaud tip</div>
      </div>

      {/* Rows */}
      <div className="mt-2 divide-y divide-[#f2eefa]">
        {stages.map((s, i) => {
          const count = Number(s.count) || 0;
          const w = Math.max(6, (count / max) * 100);
          const conversion =
            i > 0 && stages[i - 1].count
              ? Math.round((count / stages[i - 1].count) * 100)
              : null;
          const isEditable = editMode;

          return (
            <div
              key={s.id}
              data-testid={`funnel-stage-${s.id}`}
              className="grid grid-cols-12 items-center gap-4 py-4"
            >
              {/* Stage */}
              <div className="col-span-3 flex items-center gap-2">
                <span
                  className="w-1 h-9 rounded-full shrink-0"
                  style={{ backgroundColor: phaseColor[s.phase] }}
                />
                <div>
                  <div className="text-[13px] font-medium text-[#111827] leading-tight">
                    {s.label}
                  </div>
                  <div className="text-[10px] font-mono text-[#9ca3af] mt-0.5">
                    {s.hint}
                  </div>
                </div>
              </div>

              {/* Bar / editable input */}
              <div className="col-span-5">
                <div className="relative h-10 flex items-center">
                  {/* Track */}
                  <div className="absolute inset-y-1 left-0 right-0 rounded-md bg-[#faf9ff]" />
                  {/* Fill */}
                  <div
                    className="relative h-8 rounded-md transition-[width] duration-500 ease-out"
                    style={{
                      width: `${w}%`,
                      backgroundColor: s.color,
                      minWidth: "68px",
                    }}
                  />
                  {/* Value */}
                  {isEditable ? (
                    <input
                      data-testid={`funnel-input-${s.id}`}
                      type="number"
                      value={values[s.id]}
                      onChange={(e) =>
                        setValues((v) => ({
                          ...v,
                          [s.id]: Number(e.target.value) || 0,
                        }))
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-24 h-7 px-2 rounded-md bg-white/95 border border-[#d9d1ee] text-[13px] font-mono font-semibold text-[#111827] focus:outline-none focus:border-[#6d46c6]"
                    />
                  ) : (
                    <span
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-mono font-semibold"
                      style={{ color: i < 3 ? "#261c4d" : "#ffffff" }}
                    >
                      {count.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Conversion */}
              <div className="col-span-1 text-right">
                {conversion !== null ? (
                  <span className="text-[12px] font-mono text-[#0f9b7c] font-semibold">
                    {conversion}%
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-[#9ca3af]">—</span>
                )}
              </div>

              {/* Insight tip */}
              <div className="col-span-3">
                <div
                  data-testid={`funnel-tip-${s.id}`}
                  className="flex items-start gap-2 rounded-lg bg-[#faf9ff] border border-[#eeeaf6] p-2.5"
                >
                  <Lightbulb
                    className="w-3.5 h-3.5 text-[#6d46c6] shrink-0 mt-0.5"
                    strokeWidth={1.75}
                  />
                  <div className="text-[11px] leading-snug text-[#4b5563]">
                    {s.tip}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-[#eeeaf6] flex flex-wrap items-center gap-4 text-[11px] font-mono text-[#9ca3af]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#c9b3ee]" /> Acquisition
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#8f66d8]" /> Activation
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#6d46c6]" /> Pipeline
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#4a1f9a]" /> Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#5eead4]" /> Advocacy
        </span>
      </div>
    </section>
  );
}

function OpportunityCard({ op, large }) {
  const nav = useNavigate();
  const Icon = OPP_ICONS[op.icon] || Sparkles;
  const isHigh = op.priority === "high";
  const isMint = op.tone === "mint";

  return (
    <button
      data-testid={`opp-${op.id}`}
      onClick={() => op.ctaPath && nav(op.ctaPath)}
      className={`w-full text-left rounded-2xl border border-[#eeeaf6] bg-white p-6 hover:border-[#d9d1ee] transition-colors group ${
        large ? "min-h-[176px]" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isMint
              ? "bg-[#ecfdf7] text-[#0f9b7c]"
              : "bg-[#f5f3ff] text-[#6d46c6]"
          }`}
        >
          <Icon className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#9ca3af]">
              {op.stage}
            </span>
            {isHigh && (
              <span className="text-[9.5px] font-mono text-[#e35b3a] bg-[#fef3f0] border border-[#f5d5cc] rounded-full px-1.5 py-0.5 uppercase">
                high
              </span>
            )}
          </div>
          <div
            className={`mt-1.5 font-display font-semibold text-[#111827] leading-tight ${
              large ? "text-[17px]" : "text-[14px]"
            }`}
          >
            {op.title}
          </div>
          <p className="mt-1.5 text-[12.5px] text-[#4b5563] leading-relaxed">
            {op.subtitle}
          </p>
          {large && (
            <div className="mt-3 text-[11.5px] font-mono text-[#6d46c6]">
              {op.impact}
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#6d46c6] group-hover:text-[#261c4d] transition-colors">
          {op.cta}
        </span>
        <ArrowUpRight
          className="w-4 h-4 text-[#9ca3af] group-hover:text-[#6d46c6] transition-colors"
          strokeWidth={1.75}
        />
      </div>
    </button>
  );
}
