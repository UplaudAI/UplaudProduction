import { CheckCircle2, X, Sparkles } from "lucide-react";

const PAIN_QUESTIONS = [
  "Are you watching your CAC climb every quarter while ROAS drops?",
  "Have you burned budget on cold audiences that never quite convert?",
  "Do you know your happiest customers exist &nbsp; but have no system to activate them?",
];

const OLD_WAY = [
  "Bid higher on the same cold audiences everyone else is chasing",
  "Retarget people who already ignored you once",
  "Ask for referrals in a spreadsheet and hope for the best",
  "Rewrite ad creative every 2 weeks as fatigue kills performance",
];

const NEW_WAY = [
  "Capture authentic reviews over WhatsApp, at the moment of delight",
  "Every advocate becomes a one-click, AI-personalized referrer",
  "Real customer stories power ad creative that outperforms benchmarks",
  "Attribute every conversion back to the trust signal that drove it",
];

export default function PainPoint() {
  return (
    <section
      id="pain"
      data-testid="pain-point-section"
      className="relative py-24 md:py-32 bg-[#fdfbff] border-b border-violet-100"
    >
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent pointer-events-none" />
      <div className="relative max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="max-w-3xl">
          <span className="section-label" data-testid="pain-eyebrow">
            01 &nbsp;/&nbsp; the problem
          </span>
          <h2
            data-testid="pain-headline"
            className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.05] font-semibold tracking-tight text-[#0f0a1e]"
          >
            Paying more for cold clicks is not a growth strategy.
            <br />
            <span className="text-violet-gradient">
              It is a slow-motion churn of your ad budget.
            </span>
          </h2>
        </div>

        {/* Dear founder pain questions */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <div className="border border-violet-100 bg-white rounded-2xl p-6 md:p-8 shadow-[0_25px_60px_-30px_rgba(109,40,217,0.25)]">
              <p className="font-display text-[18px] font-medium text-[#0f0a1e]">
                Dear founder,
              </p>
              <ul className="mt-5 space-y-4">
                {PAIN_QUESTIONS.map((q, i) => (
                  <li
                    key={i}
                    data-testid={`pain-question-${i}`}
                    className="flex items-start gap-3 text-[14.5px] leading-relaxed text-[#0f0a1e]"
                  >
                    <span className="mt-1 w-5 h-5 flex items-center justify-center rounded-md bg-violet-100 text-[#6d28d9] shrink-0">
                      ?
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: q }} />
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[13.5px] leading-relaxed text-[#4a3d63]">
                You are not doing anything wrong. The old playbook is just
                quietly breaking. Cold impressions cost more every quarter, and
                the highest converting channel you own is sitting dormant in
                your review data.
              </p>
              <div className="mt-6 pt-5 border-t border-violet-50">
                <p className="font-display text-[15px] italic text-[#4a3d63]">
                  &ldquo;I love spending more and more money on ads.&rdquo;
                </p>
                <p className="mt-1 text-[12px] font-mono text-[#7c3aed]">
                  &mdash; no founder, ever
                </p>
              </div>
            </div>
          </div>

          {/* Old vs new way */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                data-testid="pain-old-way"
                className="border border-violet-100 bg-white rounded-2xl p-6"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                    <X className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <span className="font-display text-[15px] font-semibold text-[#0f0a1e]">
                    The old playbook
                  </span>
                </div>
                <ul className="mt-5 space-y-3">
                  {OLD_WAY.map((t, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[13px] leading-relaxed text-[#4a3d63]"
                    >
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-300 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div
                data-testid="pain-new-way"
                className="relative border border-violet-300 bg-gradient-to-br from-[#faf7ff] to-white rounded-2xl p-6 overflow-hidden"
              >
                <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-violet-200/50 blur-2xl pointer-events-none" />
                <div className="relative flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-[#6d28d9] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <span className="font-display text-[15px] font-semibold text-[#0f0a1e]">
                    The Uplaud way
                  </span>
                </div>
                <ul className="relative mt-5 space-y-3">
                  {NEW_WAY.map((t, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[13px] leading-relaxed text-[#0f0a1e]"
                    >
                      <CheckCircle2
                        className="w-4 h-4 mt-0.5 text-[#7c3aed] shrink-0"
                        strokeWidth={2}
                      />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <StatBox
                testId="pain-stat-cac"
                stat="+60%"
                label="paid CAC over 5 years"
              />
              <StatBox
                testId="pain-stat-ratio"
                stat="$2 : $1"
                label="spend-to-revenue on cold ads"
              />
              <StatBox
                testId="pain-stat-roas"
                stat="-30%"
                label="ROAS in last 24 months"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatBox({ testId, stat, label }) {
  return (
    <div
      data-testid={testId}
      className="border border-violet-100 bg-white rounded-2xl p-5 hover:border-violet-300 transition-colors"
    >
      <div className="font-display text-[30px] leading-none tracking-tight text-violet-gradient font-semibold">
        {stat}
      </div>
      <div className="mt-3 text-[11px] font-mono uppercase tracking-wider text-[#4a3d63]">
        {label}
      </div>
    </div>
  );
}
