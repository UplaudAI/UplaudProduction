import {
  Inbox,
  UserPlus,
  Megaphone,
  Bot,
  Target,
  ArrowRight,
} from "lucide-react";

const STEPS = [
  {
    key: "capture",
    icon: Inbox,
    label: "01",
    title: "Capture",
    body: "Pull in reviews from Trustpilot, G2, Reddit, WeChat, and your own channels. Solicit new ones at moments of high delight — automatically.",
    span: "md:col-span-3 md:row-span-2",
    accent: false,
  },
  {
    key: "personalize",
    icon: UserPlus,
    label: "02",
    title: "Personalize",
    body: "Turn every happy customer into a one-click referrer. Uplaud writes the message in their voice, to the friends most likely to convert.",
    span: "md:col-span-3",
    accent: false,
  },
  {
    key: "amplify",
    icon: Megaphone,
    label: "03",
    title: "Amplify",
    body: "Real stories become the highest performing ad creative you&apos;ve ever run — segmented by theme, cluster and platform.",
    span: "md:col-span-3",
    accent: true,
  },
  {
    key: "enrich",
    icon: Bot,
    label: "04",
    title: "Enrich & Nurture",
    body: "AI agents follow up with warm referrals: answering questions, sending proof, booking calls. Never cold, always in-context.",
    span: "md:col-span-3 md:row-span-2",
    accent: false,
  },
  {
    key: "convert",
    icon: Target,
    label: "05",
    title: "Convert",
    body: "Attribute every conversion back to the trust signal that drove it — and let the Trust Graph compound.",
    span: "md:col-span-3",
    accent: false,
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how"
      data-testid="how-it-works-section"
      className="relative py-24 md:py-32 bg-[#050505] text-[#fdfdfb] border-t border-white/5 border-b border-white/5 noise"
    >
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <span className="section-label section-label-dark">
              02 / how it works
            </span>
            <h2
              data-testid="how-headline"
              className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.05] font-medium tracking-tight"
            >
              Five moves.
              <br />
              One compounding loop.
            </h2>
          </div>
          <p className="max-w-md text-[14px] leading-relaxed text-white/60">
            From the first review you capture to the last conversion you
            attribute — Uplaud runs the full trust-to-revenue loop on autopilot.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4 md:auto-rows-[220px]">
          {STEPS.map((s) => (
            <div
              key={s.key}
              data-testid={`how-step-${s.key}`}
              className={`relative group border rounded-sm p-6 transition-colors duration-300 ${
                s.accent
                  ? "border-[#10b981]/50 bg-[#10b981]/[0.06] hover:bg-[#10b981]/[0.1]"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              } ${s.span}`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-9 h-9 border rounded-sm flex items-center justify-center ${
                    s.accent
                      ? "border-[#10b981]/50 text-[#10b981]"
                      : "border-white/15 text-white"
                  }`}
                >
                  <s.icon className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <span className="font-mono text-[11px] text-white/50">
                  {s.label}
                </span>
              </div>
              <div className="mt-8">
                <h3 className="font-display text-[24px] tracking-tight">
                  {s.title}
                </h3>
                <p
                  className="mt-3 text-[13px] leading-relaxed text-white/65"
                  dangerouslySetInnerHTML={{ __html: s.body }}
                />
              </div>
              <ArrowRight
                className="absolute bottom-5 right-5 w-4 h-4 text-white/25 group-hover:text-[#10b981] transition-colors"
                strokeWidth={1.5}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
