import { TrendingUp, DollarSign, ArrowRight } from "lucide-react";

export default function PainPoint() {
  return (
    <section
      id="pain"
      data-testid="pain-point-section"
      className="relative py-24 md:py-32 bg-white"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-6">
            <span className="section-label">01 / the problem</span>
            <h2
              data-testid="pain-headline"
              className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[58px] leading-[1.02] font-semibold tracking-tight text-[#111827]"
            >
              You keep paying for
              <br />
              <span className="text-[#6d46c6]">the wrong half</span> of the
              funnel.
            </h2>
            <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-[#4b5563]">
              You spend on ads, SEO and campaigns to get the click. But the
              actual buying decision happens somewhere you don&apos;t spend at
              all &mdash; on a Reddit thread, in a WhatsApp DM, in a review,
              in a ChatGPT answer. That is the disconnect.
            </p>
            <div className="mt-8 rounded-2xl border border-[#eeeaf6] bg-[#faf9ff] p-6">
              <p className="font-display text-[19px] leading-snug italic text-[#111827]">
                &ldquo;I love spending more and more money on ads.&rdquo;
              </p>
              <p className="mt-2 text-[12px] font-mono uppercase tracking-widest text-[#6d46c6]">
                &mdash; No one, ever
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-3">
            <PainCard
              testId="pain-stat-cac"
              icon={TrendingUp}
              stat="+40%"
              statLabel="YoY"
              title="Customer acquisition costs keep climbing."
              body="Every quarter, the ad auction gets more expensive. And the click you buy doesn&apos;t come with trust attached."
            />
            <PainCard
              testId="pain-stat-roas"
              icon={DollarSign}
              stat="$2"
              statLabel="to earn $1"
              title="You&apos;re spending more to make less."
              body="Cold acquisition now costs roughly $2 in ad spend for every $1 of revenue. The math stopped working, everyone noticed."
              highlight
            />
            <PainCard
              testId="pain-stat-disconnect"
              icon={ArrowRight}
              stat="0%"
              statLabel="of trust used"
              title="Meanwhile, your best sales rep is on Reddit."
              body="Real customer stories, DMs, comments and reviews are already convincing your next buyer &mdash; without a single dollar from you."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PainCard({ testId, icon: Icon, stat, statLabel, title, body, highlight }) {
  return (
    <div
      data-testid={testId}
      className={`rounded-2xl border p-6 flex items-start gap-5 transition-colors ${
        highlight
          ? "border-[#6d46c6] bg-white"
          : "border-[#eeeaf6] bg-white hover:border-[#d9d1ee]"
      }`}
    >
      <div className="shrink-0">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center ${
            highlight
              ? "bg-[#6d46c6] text-white"
              : "bg-[#f5f3ff] text-[#6d46c6]"
          }`}
        >
          <Icon className="w-5 h-5" strokeWidth={1.75} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-display text-[32px] leading-none font-semibold tracking-tight ${
              highlight ? "text-[#6d46c6]" : "text-[#111827]"
            }`}
          >
            {stat}
          </span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#9ca3af]">
            {statLabel}
          </span>
        </div>
        <h3 className="mt-2 font-display text-[17px] font-semibold tracking-tight text-[#111827]">
          {title}
        </h3>
        <p
          className="mt-1.5 text-[13.5px] leading-relaxed text-[#4b5563]"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      </div>
    </div>
  );
}
