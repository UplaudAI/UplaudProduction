import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  RefreshCcw,
  Copy,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import PageHero from "@/components/business/PageHero";
import {
  ROI_SIMULATOR_DEFAULTS,
  ROI_INPUT_LABELS,
} from "@/mocks/fintech";

/* ────────── formatting helpers ────────── */
const fmtNum = (n) =>
  Math.round(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtMoney = (n) => `$${fmtNum(n)}`;
const fmtCompactMoney = (n) => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n)}`;
};
const fmtPct = (n, d = 1) => `${n.toFixed(d)}%`;

/* ────────── the model ────────── */
function computeScenarios(paid, uplaud) {
  // Status quo
  const paidCustomersMo = paid.demosAttendedMo * (paid.demoToCustomer / 100);
  const sqNewCustomersYr = paidCustomersMo * 12;
  const sqNewArr = sqNewCustomersYr * paid.acv;
  const sqBlendedCac = paid.paidCac;
  const ltvBase =
    (paid.acv * (paid.grossMargin / 100)) /
    Math.max(0.01, 1 - paid.retention / 100);
  const sqLtvCac = ltvBase / Math.max(1, sqBlendedCac);
  const monthlyMarginPerCust = (paid.acv * (paid.grossMargin / 100)) / 12;
  const sqPayback = sqBlendedCac / Math.max(1, monthlyMarginPerCust);

  // Uplaud lift
  const feedback = paid.demosAttendedMo * (uplaud.extractionRate / 100);
  const testimonials = feedback * (uplaud.approvalRate / 100);
  const warmIntros = testimonials * uplaud.introsPerTestimonial;
  const uplaudCustomersMo = warmIntros * (uplaud.warmToCustomer / 100);

  const withCustomersMo = paidCustomersMo + uplaudCustomersMo;
  const withNewCustomersYr = withCustomersMo * 12;
  const withNewArr = withNewCustomersYr * paid.acv;
  const withBlendedCac =
    withCustomersMo === 0
      ? sqBlendedCac
      : (paidCustomersMo * paid.paidCac +
          uplaudCustomersMo * uplaud.uplaudCac) /
        withCustomersMo;
  const withLtvCac = ltvBase / Math.max(1, withBlendedCac);
  const withPayback = withBlendedCac / Math.max(1, monthlyMarginPerCust);

  return {
    sq: {
      customersMo: paidCustomersMo,
      customersYr: sqNewCustomersYr,
      arrYr: sqNewArr,
      blendedCac: sqBlendedCac,
      ltvCac: sqLtvCac,
      paybackMo: sqPayback,
    },
    up: {
      customersMo: withCustomersMo,
      uplaudCustomersMo,
      warmIntros,
      testimonials,
      customersYr: withNewCustomersYr,
      arrYr: withNewArr,
      blendedCac: withBlendedCac,
      ltvCac: withLtvCac,
      paybackMo: withPayback,
    },
    ltvBase,
  };
}

/* ────────── page ────────── */
export default function RoiSimulatorPage() {
  const [paid, setPaid] = useState(ROI_SIMULATOR_DEFAULTS.paid);
  const [uplaud, setUplaud] = useState(ROI_SIMULATOR_DEFAULTS.uplaud);

  const scenarios = useMemo(() => computeScenarios(paid, uplaud), [paid, uplaud]);

  const arrDelta = scenarios.up.arrYr - scenarios.sq.arrYr;
  const custDelta = scenarios.up.customersYr - scenarios.sq.customersYr;
  const cacDeltaPct =
    ((scenarios.sq.blendedCac - scenarios.up.blendedCac) /
      Math.max(1, scenarios.sq.blendedCac)) *
    100;
  const paybackDelta = scenarios.sq.paybackMo - scenarios.up.paybackMo;

  const handleReset = () => {
    setPaid(ROI_SIMULATOR_DEFAULTS.paid);
    setUplaud(ROI_SIMULATOR_DEFAULTS.uplaud);
    toast.success("Reset to PayRewards defaults");
  };

  const handleCopy = () => {
    const lines = [
      "PayRewards × Uplaud — 12-month projection",
      "",
      `• +${fmtNum(custDelta)} net-new customers / year (${fmtNum(
        scenarios.up.uplaudCustomersMo * 12
      )} sourced by Uplaud referral loop)`,
      `• +${fmtCompactMoney(arrDelta)} ARR added / year (from ${fmtCompactMoney(
        scenarios.sq.arrYr
      )} → ${fmtCompactMoney(scenarios.up.arrYr)})`,
      `• Blended CAC drops ${fmtPct(cacDeltaPct, 1)} — ${fmtMoney(
        scenarios.sq.blendedCac
      )} → ${fmtMoney(scenarios.up.blendedCac)}`,
      `• LTV/CAC improves ${scenarios.sq.ltvCac.toFixed(
        1
      )}× → ${scenarios.up.ltvCac.toFixed(1)}×`,
      `• Payback shortens ${scenarios.sq.paybackMo.toFixed(
        1
      )} mo → ${scenarios.up.paybackMo.toFixed(1)} mo`,
    ].join("\n");
    navigator.clipboard.writeText(lines);
    toast.success("Boardroom summary copied to clipboard");
  };

  return (
    <div data-testid="roi-simulator-page" className="space-y-14">
      <PageHero
        eyebrow="Business Impact · 12-month projection"
        question="What does Uplaud add to PayRewards' P&L this year?"
        subhead="Plug in your real Meta / Google numbers on the left. Every metric below recomputes live — ready for the board deck."
        smartAction={{
          eyebrow: "How to read this",
          headline:
            "Status Quo assumes paid-only. With Uplaud layers the referral engine on top of the same demo volume.",
          reasoning: [
            {
              label: "Assumption",
              value: "No new ad spend added — Uplaud sits on your existing pipeline",
            },
            {
              label: "Attribution",
              value:
                "Uplaud customers = demos × capture% × approval% × intros/testimonial × warm→customer%",
            },
            {
              label: "Downside protection",
              value: "Every input is editable so you can stress-test conservative cases",
            },
          ],
          outcome:
            "Snapshot the numbers below, hit Copy summary, and paste straight into slide 3 of the growth-review deck.",
          cta: "Copy summary for board deck",
        }}
        onAction={handleCopy}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 -mt-6">
        <div className="text-[12px] font-mono text-[#9ca3af]">
          All numbers live-recalculate as you edit. Assumptions traceable per row.
        </div>
        <div className="flex items-center gap-2">
          <button
            data-testid="roi-reset-btn"
            onClick={handleReset}
            className="text-[12px] text-[#4b5563] hover:text-[#111827] flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#eeeaf6] hover:border-[#d9d1ee] transition-colors bg-white"
          >
            <RefreshCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
            Reset to PayRewards defaults
          </button>
          <button
            data-testid="roi-copy-btn"
            onClick={handleCopy}
            className="text-[12px] font-medium text-white bg-[#261c4d] hover:bg-[#3a2a6b] flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors"
          >
            <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
            Copy board summary
          </button>
        </div>
      </div>

      {/* Grid: Inputs + Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <InputGroup
            testId="roi-inputs-paid"
            eyebrow="1 — Your paid engine today"
            title="Status quo inputs"
            hint="Traceable to your Meta / Google performance + HubSpot CAC report."
            fields={ROI_INPUT_LABELS.paid}
            values={paid}
            onChange={(k, v) => setPaid((p) => ({ ...p, [k]: v }))}
          />
          <InputGroup
            testId="roi-inputs-uplaud"
            eyebrow="2 — Uplaud lift assumptions"
            title="What Uplaud adds on top"
            hint="Defaults reflect PayRewards' current 30-day performance in the Growth Overview."
            fields={ROI_INPUT_LABELS.uplaud}
            values={uplaud}
            onChange={(k, v) => setUplaud((p) => ({ ...p, [k]: v }))}
          />
        </div>

        {/* Comparison */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScenarioCard
              testId="scenario-status-quo"
              variant="sq"
              eyebrow="Scenario A"
              title="Status Quo"
              subtitle="Paid demos only. No referral loop."
              scenario={scenarios.sq}
            />
            <ScenarioCard
              testId="scenario-with-uplaud"
              variant="up"
              eyebrow="Scenario B"
              title="With Uplaud"
              subtitle="Same demos + testimonial → referral loop."
              scenario={scenarios.up}
              extra={
                <div className="mt-4 pt-4 border-t border-[#265447]/25 text-[11.5px] font-mono text-[#0a3d31] space-y-1">
                  <div className="flex justify-between">
                    <span>Testimonials / mo</span>
                    <span className="font-semibold">
                      {fmtNum(scenarios.up.testimonials)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Warm intros / mo</span>
                    <span className="font-semibold">
                      {fmtNum(scenarios.up.warmIntros)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uplaud-sourced customers / mo</span>
                    <span className="font-semibold">
                      {fmtNum(scenarios.up.uplaudCustomersMo)}
                    </span>
                  </div>
                </div>
              }
            />
          </div>

          {/* Deltas */}
          <DeltaSummary
            deltas={[
              {
                id: "customers",
                label: "Net-new customers / year",
                sq: `${fmtNum(scenarios.sq.customersYr)}`,
                up: `${fmtNum(scenarios.up.customersYr)}`,
                delta: `+${fmtNum(custDelta)}`,
                positive: true,
              },
              {
                id: "arr",
                label: "New ARR added / year",
                sq: fmtCompactMoney(scenarios.sq.arrYr),
                up: fmtCompactMoney(scenarios.up.arrYr),
                delta: `+${fmtCompactMoney(arrDelta)}`,
                positive: true,
              },
              {
                id: "cac",
                label: "Blended CAC",
                sq: fmtMoney(scenarios.sq.blendedCac),
                up: fmtMoney(scenarios.up.blendedCac),
                delta: `-${fmtPct(cacDeltaPct, 1)}`,
                positive: true,
                inverse: true,
              },
              {
                id: "ltvcac",
                label: "LTV / CAC",
                sq: `${scenarios.sq.ltvCac.toFixed(1)}×`,
                up: `${scenarios.up.ltvCac.toFixed(1)}×`,
                delta: `+${(scenarios.up.ltvCac - scenarios.sq.ltvCac).toFixed(1)}×`,
                positive: true,
              },
              {
                id: "payback",
                label: "Payback (months)",
                sq: `${scenarios.sq.paybackMo.toFixed(1)}`,
                up: `${scenarios.up.paybackMo.toFixed(1)}`,
                delta: `-${paybackDelta.toFixed(1)} mo`,
                positive: true,
                inverse: true,
              },
            ]}
          />

          {/* Boardroom summary */}
          <BoardroomSummary
            arrDelta={arrDelta}
            custDelta={custDelta}
            cacDeltaPct={cacDeltaPct}
            sq={scenarios.sq}
            up={scenarios.up}
            onCopy={handleCopy}
          />
        </div>
      </div>
    </div>
  );
}

/* ────────── input group ────────── */
function InputGroup({ testId, eyebrow, title, hint, fields, values, onChange }) {
  return (
    <section
      data-testid={testId}
      className="rounded-2xl border border-[#eeeaf6] bg-white p-6"
    >
      <div className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
        {eyebrow}
      </div>
      <h3 className="mt-1.5 font-display text-[17px] font-semibold text-[#111827]">
        {title}
      </h3>
      <p className="mt-1 text-[12px] text-[#4b5563]">{hint}</p>

      <div className="mt-5 divide-y divide-[#f2eefa]">
        {fields.map((f) => (
          <InputRow
            key={f.key}
            field={f}
            value={values[f.key]}
            onChange={(v) => onChange(f.key, v)}
          />
        ))}
      </div>
    </section>
  );
}

function InputRow({ field, value, onChange }) {
  return (
    <div
      data-testid={`roi-row-${field.key}`}
      className="grid grid-cols-[1fr_140px] items-center gap-4 py-3"
    >
      <div>
        <div className="text-[13px] font-medium text-[#111827] leading-tight">
          {field.label}
        </div>
        <div className="text-[11px] text-[#9ca3af] mt-0.5 leading-tight">
          {field.hint}
        </div>
      </div>
      <div className="relative">
        {field.prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-mono text-[#9ca3af] pointer-events-none">
            {field.prefix}
          </span>
        )}
        <input
          data-testid={`roi-input-${field.key}`}
          type="number"
          step={field.step}
          value={value}
          onChange={(e) => {
            const n = e.target.value === "" ? 0 : Number(e.target.value);
            onChange(Number.isFinite(n) ? n : 0);
          }}
          className={`w-full h-10 rounded-lg border border-[#e2d9f5] bg-white text-[13.5px] font-mono font-semibold text-[#111827] focus:outline-none focus:border-[#6d46c6] focus:ring-2 focus:ring-[#6d46c6]/15 transition-colors ${
            field.prefix ? "pl-6 pr-3" : "px-3"
          } ${field.suffix ? "pr-8" : ""}`}
        />
        {field.suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-mono text-[#9ca3af] pointer-events-none">
            {field.suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/* ────────── scenario card ────────── */
function ScenarioCard({ testId, variant, eyebrow, title, subtitle, scenario, extra }) {
  const isUplaud = variant === "up";

  return (
    <div
      data-testid={testId}
      className={`rounded-2xl border p-6 ${
        isUplaud
          ? "bg-gradient-to-br from-[#dff7ee] via-[#ecfdf7] to-[#e8f5ff] border-[#a7e7d3] shadow-[0_2px_20px_-8px_rgba(15,155,124,0.35)]"
          : "bg-[#faf9ff] border-[#eeeaf6]"
      }`}
    >
      <div
        className={`text-[10.5px] font-mono uppercase tracking-[0.18em] ${
          isUplaud ? "text-[#0f9b7c]" : "text-[#9ca3af]"
        }`}
      >
        {eyebrow}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <h3
          className={`font-display text-[18px] font-semibold ${
            isUplaud ? "text-[#0a3d31]" : "text-[#111827]"
          }`}
        >
          {title}
        </h3>
        {isUplaud && (
          <Sparkles className="w-3.5 h-3.5 text-[#0f9b7c]" strokeWidth={1.75} />
        )}
      </div>
      <p
        className={`mt-1 text-[12px] ${
          isUplaud ? "text-[#265447]" : "text-[#4b5563]"
        }`}
      >
        {subtitle}
      </p>

      <div className="mt-5 space-y-3">
        <MetricRow
          label="New customers / mo"
          value={fmtNum(scenario.customersMo)}
          variant={variant}
        />
        <MetricRow
          label="New ARR / year"
          value={fmtCompactMoney(scenario.arrYr)}
          variant={variant}
          emphasise
        />
        <MetricRow
          label="Blended CAC"
          value={fmtMoney(scenario.blendedCac)}
          variant={variant}
        />
        <MetricRow
          label="LTV / CAC"
          value={`${scenario.ltvCac.toFixed(1)}×`}
          variant={variant}
        />
        <MetricRow
          label="Payback"
          value={`${scenario.paybackMo.toFixed(1)} mo`}
          variant={variant}
        />
      </div>

      {extra}
    </div>
  );
}

function MetricRow({ label, value, variant, emphasise }) {
  const isUplaud = variant === "up";
  return (
    <div className="flex items-center justify-between">
      <span
        className={`text-[12px] ${
          isUplaud ? "text-[#265447]" : "text-[#4b5563]"
        }`}
      >
        {label}
      </span>
      <span
        className={`font-mono font-semibold ${
          emphasise ? "text-[18px]" : "text-[14px]"
        } ${isUplaud ? "text-[#0a3d31]" : "text-[#111827]"}`}
      >
        {value}
      </span>
    </div>
  );
}

/* ────────── delta summary ────────── */
function DeltaSummary({ deltas }) {
  return (
    <section
      data-testid="roi-delta-summary"
      className="rounded-2xl border border-[#eeeaf6] bg-white overflow-hidden"
    >
      <div className="px-6 pt-5 pb-3 flex items-baseline justify-between">
        <div>
          <div className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
            Boardroom deltas · Uplaud vs status quo
          </div>
          <h3 className="mt-1 font-display text-[16px] font-semibold text-[#111827]">
            What lands on the P&L
          </h3>
        </div>
      </div>
      <div className="divide-y divide-[#f2eefa]">
        {deltas.map((d) => (
          <div
            key={d.id}
            data-testid={`delta-${d.id}`}
            className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-6 py-3.5"
          >
            <div className="text-[13px] font-medium text-[#111827]">{d.label}</div>
            <div className="text-[12.5px] font-mono text-[#9ca3af] tabular-nums">
              {d.sq}
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-[#9ca3af]" strokeWidth={1.75} />
            <div className="flex items-center gap-2 justify-end min-w-[140px]">
              <span className="text-[13.5px] font-mono font-semibold text-[#111827] tabular-nums">
                {d.up}
              </span>
              <span
                className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                  d.positive
                    ? "text-[#0f9b7c] bg-[#ecfdf7] border border-[#a7e7d3]"
                    : "text-[#e35b3a] bg-[#fef3f0] border border-[#f5d5cc]"
                }`}
              >
                {d.inverse ? (
                  <TrendingDown className="w-3 h-3" strokeWidth={2} />
                ) : (
                  <TrendingUp className="w-3 h-3" strokeWidth={2} />
                )}
                {d.delta}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ────────── boardroom summary ────────── */
function BoardroomSummary({ arrDelta, custDelta, cacDeltaPct, sq, up, onCopy }) {
  return (
    <section
      data-testid="roi-boardroom-summary"
      className="rounded-2xl border border-[#eeeaf6] bg-[#261c4d] text-white p-8 relative overflow-hidden"
    >
      <div
        className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-[#5eead4]/20 blur-3xl pointer-events-none"
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#c9b3ee]">
          <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.75} />
          Ready for slide 3 of the growth-review deck
        </div>
        <h3 className="mt-3 font-display text-[22px] font-semibold leading-snug">
          Layering Uplaud on PayRewards' current ad spend generates{" "}
          <span className="text-[#5eead4]">
            +{fmtCompactMoney(arrDelta)} ARR
          </span>{" "}
          and <span className="text-[#5eead4]">+{fmtNum(custDelta)} customers</span>{" "}
          in year one — at a{" "}
          <span className="text-[#5eead4]">{fmtPct(cacDeltaPct, 1)} lower</span>{" "}
          blended CAC.
        </h3>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryStat
            label="ARR added / yr"
            value={`+${fmtCompactMoney(arrDelta)}`}
            sub={`${fmtCompactMoney(sq.arrYr)} → ${fmtCompactMoney(up.arrYr)}`}
          />
          <SummaryStat
            label="Blended CAC"
            value={fmtMoney(up.blendedCac)}
            sub={`down ${fmtPct(cacDeltaPct, 1)} from ${fmtMoney(sq.blendedCac)}`}
          />
          <SummaryStat
            label="LTV / CAC"
            value={`${up.ltvCac.toFixed(1)}×`}
            sub={`from ${sq.ltvCac.toFixed(1)}× status quo`}
          />
        </div>

        <button
          data-testid="roi-summary-copy-btn"
          onClick={onCopy}
          className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium bg-white text-[#261c4d] hover:bg-[#5eead4] hover:text-[#0a3d31] px-4 py-2 rounded-full transition-colors"
        >
          <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />
          Copy this summary
        </button>
      </div>
    </section>
  );
}

function SummaryStat({ label, value, sub }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <div className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#c9b3ee]">
        {label}
      </div>
      <div className="mt-1 font-display text-[26px] font-semibold text-[#5eead4] leading-none">
        {value}
      </div>
      <div className="mt-2 text-[11px] font-mono text-white/70 leading-tight">
        {sub}
      </div>
    </div>
  );
}
