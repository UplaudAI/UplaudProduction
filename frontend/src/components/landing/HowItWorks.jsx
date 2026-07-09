import { Download, Zap, Bot, ArrowRight } from "lucide-react";

const PILLARS = [
  {
    key: "ingest",
    icon: Download,
    n: "01",
    tag: "Bring trust in",
    title: "From everywhere it already lives.",
    body: "Import from Trustpilot, G2, Shopify, Reddit, Instagram, CRM, sales calls and support tickets. Capture new signals natively on WhatsApp, Instagram, SMS or your site. Nothing gets left in a silo.",
    bullets: ["20+ native connectors", "Voice, text, image, video", "Real customers only"],
  },
  {
    key: "activate",
    icon: Zap,
    n: "02",
    tag: "Turn trust into acquisition",
    title: "The right story, the right moment.",
    body: "Uplaud surfaces the perfect testimonial to the perfect buyer &mdash; on ads, on Reddit answers, in sales follow-ups, in landing pages, and in front of AI search engines. Trust becomes visible where it converts.",
    bullets: ["Warm leads and referrals", "Story-driven ad creative", "AI-search visibility"],
  },
  {
    key: "autopilot",
    icon: Bot,
    n: "03",
    tag: "Put marketing on autopilot",
    title: "AI Agents that run the flywheel.",
    body: "Uplaud Agents analyze your trust data, spot warm leads, recommend campaigns, generate content, draft follow-ups and answer questions on social &mdash; on your terms. You approve. They ship.",
    bullets: ["24/7 acquisition ops", "Content in your voice", "Approve-to-ship workflow"],
    accent: true,
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how"
      data-testid="how-it-works-section"
      className="relative py-24 md:py-32 bg-[#faf9ff] border-y border-[#eeeaf6]"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="max-w-3xl mb-14">
          <span className="section-label">02 / how uplaud works</span>
          <h2
            data-testid="how-headline"
            className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.02] font-semibold tracking-tight text-[#111827]"
          >
            Three shifts.
            <br />
            <span className="mint-underline">One growth flywheel.</span>
          </h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-[#4b5563] max-w-xl">
            Uplaud is not a reviews tool with extras. It is a trust-powered
            growth platform that runs across every acquisition surface you
            already have.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PILLARS.map((p) => (
            <div
              key={p.key}
              data-testid={`how-step-${p.key}`}
              className={`relative rounded-2xl p-8 border transition-colors flex flex-col ${
                p.accent
                  ? "border-[#6d46c6] bg-white"
                  : "border-[#eeeaf6] bg-white hover:border-[#d9d1ee]"
              }`}
            >
              {p.accent && (
                <span className="absolute top-6 right-6 px-2.5 py-1 rounded-full bg-[#5eead4] text-[#261c4d] text-[10px] font-mono font-semibold uppercase tracking-widest">
                  New
                </span>
              )}
              <div className="flex items-center justify-between">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center ${
                    p.accent
                      ? "bg-[#6d46c6] text-white"
                      : "bg-[#f5f3ff] text-[#6d46c6]"
                  }`}
                >
                  <p.icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <span className="font-mono text-[11px] text-[#9ca3af]">
                  {p.n}
                </span>
              </div>
              <div className="mt-8 text-[11px] font-mono uppercase tracking-widest text-[#6d46c6]">
                {p.tag}
              </div>
              <h3 className="mt-2 font-display text-[22px] font-semibold tracking-tight text-[#111827]">
                {p.title}
              </h3>
              <p
                className="mt-3 text-[14px] leading-relaxed text-[#4b5563]"
                dangerouslySetInnerHTML={{ __html: p.body }}
              />
              <ul className="mt-6 space-y-2 pt-5 border-t border-[#eeeaf6]">
                {p.bullets.map((b, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[13px] text-[#4b5563]"
                  >
                    <ArrowRight
                      className={`w-3.5 h-3.5 mt-1 shrink-0 ${
                        p.accent ? "text-[#6d46c6]" : "text-[#9ca3af]"
                      }`}
                      strokeWidth={2}
                    />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
