import {
  MessageCircle,
  Share2,
  Star,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

const FEATURES = [
  {
    icon: MessageCircle,
    title: "WhatsApp reviews",
    body: "Where your customers already are. 60% higher reply rates than email.",
  },
  {
    icon: Share2,
    title: "1-tap referrals",
    body: "Every happy customer turns into a warm intro. No coupon codes, no awkward asks.",
  },
  {
    icon: Sparkles,
    title: "AI-personalised",
    body: "Every referral message is written in your customer&apos;s voice, to the right friend.",
  },
  {
    icon: Star,
    title: "Voice or text, 50+ languages",
    body: "Your customers speak the way they want. You get every review, in any language.",
  },
  {
    icon: Wallet,
    title: "Rewards that fit",
    body: "Points, credits or perks your customers actually want. Design it once, run it forever.",
  },
  {
    icon: ShieldCheck,
    title: "Real, verified & authentic",
    body: "Every review is a real customer. No bots. No fakes. No shortcuts.",
  },
];

export default function FeatureGrid() {
  return (
    <section
      id="product"
      data-testid="feature-grid-section"
      className="relative py-24 md:py-32 bg-white"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="max-w-3xl mb-14">
          <span className="section-label">03 / the product</span>
          <h2
            data-testid="features-headline"
            className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.02] font-semibold tracking-tight text-[#111827]"
          >
            Simple to set up.
            <br />
            <span className="mint-underline">Impossible to outgrow.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              data-testid={`feature-${i}`}
              className="group border border-[#eeeaf6] rounded-2xl p-8 bg-white hover:border-[#6d46c6] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#f5f3ff] flex items-center justify-center text-[#6d46c6] group-hover:bg-[#5eead4] group-hover:text-[#261c4d] transition-colors">
                <f.icon className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <h3 className="mt-6 font-display text-[19px] font-semibold tracking-tight text-[#111827]">
                {f.title}
              </h3>
              <p
                className="mt-2 text-[13.5px] leading-relaxed text-[#4b5563]"
                dangerouslySetInnerHTML={{ __html: f.body }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
