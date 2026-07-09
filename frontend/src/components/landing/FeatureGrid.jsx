import {
  MessagesSquare,
  Share2,
  Sparkles,
  BarChart3,
  Layers,
  ShieldCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "WhatsApp-first capture",
    body: "Collect authentic reviews via voice or text, in 50+ languages, at the moment your customers are happiest.",
  },
  {
    icon: Share2,
    title: "One-click referrals",
    body: "Every advocate becomes a one-click, AI-personalized referrer. No coupon codes, no awkward asks, no friction.",
  },
  {
    icon: Sparkles,
    title: "Story-driven ads",
    body: "Real customer language, clustered by theme and buyer intent, becomes ad copy and creative that outperforms.",
  },
  {
    icon: Layers,
    title: "Buyer intent clusters",
    body: "The Trust Graph maps clusters of high-intent lookalikes for your Meta, Google and TikTok ad accounts.",
  },
  {
    icon: BarChart3,
    title: "Signal-level attribution",
    body: "See which review, story or referrer drove which conversion, and double down with confidence.",
  },
  {
    icon: ShieldCheck,
    title: "Authentic by default",
    body: "No paid influencers. No synthetic reviews. Every signal is a real customer, verified end-to-end.",
  },
];

export default function FeatureGrid() {
  return (
    <section
      id="features"
      data-testid="feature-grid-section"
      className="relative py-24 md:py-32 bg-white border-b border-violet-100"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <span className="section-label">
              05 &nbsp;/&nbsp; the product
            </span>
            <h2
              data-testid="features-headline"
              className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.05] font-semibold tracking-tight text-[#0f0a1e]"
            >
              Everything you need
              <br />
              to run growth on trust.
            </h2>
          </div>
          <p className="max-w-md text-[14px] leading-relaxed text-[#4a3d63]">
            A single platform for capturing trust signals over WhatsApp,
            activating them across channels, and attributing the revenue they
            drive.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              data-testid={`feature-${i}`}
              className="group border border-violet-100 rounded-2xl p-8 bg-white hover:border-violet-300 hover:shadow-[0_20px_50px_-25px_rgba(109,40,217,0.35)] transition-all duration-200"
            >
              <div className="w-10 h-10 border border-violet-100 rounded-full flex items-center justify-center bg-violet-50 text-[#6d28d9] group-hover:bg-gradient-to-br group-hover:from-[#a78bfa] group-hover:to-[#7c3aed] group-hover:text-white transition-all">
                <f.icon className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <h3 className="mt-8 font-display text-[22px] tracking-tight text-[#0f0a1e] font-semibold">
                {f.title}
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-[#4a3d63]">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
