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
    title: "Trust ingestion",
    body: "Continuously pulls reviews, comments and DMs from every channel where customers already talk about you.",
  },
  {
    icon: Share2,
    title: "Personalized referrals",
    body: "Every advocate becomes a one-click, AI-personalized referrer — no coupon codes, no awkward asks.",
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
    body: "See which review, story or referrer drove which conversion — and double down with confidence.",
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
      className="relative py-24 md:py-32 bg-[#fdfdfb] border-b border-black/5"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <span className="section-label">04 / the product</span>
            <h2
              data-testid="features-headline"
              className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.05] font-medium tracking-tight"
            >
              Everything you need
              <br />
              to run growth on trust.
            </h2>
          </div>
          <p className="max-w-md text-[14px] leading-relaxed text-[#525252]">
            A single platform for capturing trust signals, activating them
            across channels, and attributing the revenue they drive.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              data-testid={`feature-${i}`}
              className="group border border-black/10 rounded-sm p-8 bg-[#fdfdfb] hover:bg-[#f4f4f0] transition-colors duration-200"
            >
              <div className="w-10 h-10 border border-black/15 rounded-sm flex items-center justify-center group-hover:border-[#10b981] group-hover:text-[#10b981] transition-colors">
                <f.icon className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <h3 className="mt-8 font-display text-[22px] tracking-tight text-[#0a0a0a]">
                {f.title}
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-[#525252]">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
