import {
  MessageCircle,
  UserPlus,
  Megaphone,
  Bot,
  Target,
  ArrowRight,
} from "lucide-react";

const STEPS = [
  {
    key: "capture",
    icon: MessageCircle,
    label: "01",
    title: "Capture on WhatsApp",
    body: "Solicit reviews at the exact moment of delight, over WhatsApp. Voice or text, 50+ languages, and 60% higher review rates than email.",
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
    body: "Real stories become the highest performing ad creative you have ever run, segmented by theme, cluster and platform.",
    span: "md:col-span-3",
    accent: true,
  },
  {
    key: "enrich",
    icon: Bot,
    label: "04",
    title: "Enrich & nurture",
    body: "AI agents follow up with warm referrals, answering questions, sending proof and booking calls. Never cold, always in-context.",
    span: "md:col-span-3 md:row-span-2",
    accent: false,
  },
  {
    key: "convert",
    icon: Target,
    label: "05",
    title: "Convert",
    body: "Attribute every conversion back to the trust signal that drove it, and let the Trust Graph compound with every cohort.",
    span: "md:col-span-3",
    accent: false,
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how"
      data-testid="how-it-works-section"
      className="relative py-24 md:py-32 bg-[#0b0616] text-[#fdfbff] border-t border-violet-500/10 border-b border-violet-500/10 noise"
    >
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.15),transparent_50%)] pointer-events-none" />
      <div className="relative max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <span className="section-label section-label-dark">
              03 &nbsp;/&nbsp; how it works
            </span>
            <h2
              data-testid="how-headline"
              className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.05] font-semibold tracking-tight"
            >
              Five moves.
              <br />
              <span className="text-violet-shine">One compounding loop.</span>
            </h2>
          </div>
          <p className="max-w-md text-[14px] leading-relaxed text-white/60">
            From the first WhatsApp review you capture to the last conversion
            you attribute, Uplaud runs the full trust-to-revenue loop on
            autopilot.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4 md:auto-rows-[220px]">
          {STEPS.map((s) => (
            <div
              key={s.key}
              data-testid={`how-step-${s.key}`}
              className={`relative group border rounded-2xl p-6 transition-colors duration-300 ${
                s.accent
                  ? "border-[#7c3aed]/50 bg-[#7c3aed]/[0.08] hover:bg-[#7c3aed]/[0.14]"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              } ${s.span}`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-9 h-9 border rounded-full flex items-center justify-center ${
                    s.accent
                      ? "border-[#a78bfa]/60 text-[#c4b5fd] bg-[#7c3aed]/20"
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
                <h3 className="font-display text-[24px] tracking-tight font-semibold">
                  {s.title}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-white/65">
                  {s.body}
                </p>
              </div>
              <ArrowRight
                className="absolute bottom-5 right-5 w-4 h-4 text-white/25 group-hover:text-[#a78bfa] transition-colors"
                strokeWidth={1.5}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
