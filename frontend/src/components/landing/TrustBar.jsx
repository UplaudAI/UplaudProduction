import Marquee from "react-fast-marquee";

const SOURCES = [
  "WhatsApp",
  "Trustpilot",
  "G2",
  "Google Reviews",
  "Reddit",
  "Yelp",
  "Product Hunt",
  "App Store",
  "Instagram",
  "TikTok",
  "YouTube",
  "LinkedIn",
];

export default function TrustBar() {
  return (
    <section
      data-testid="trust-bar"
      className="relative border-y border-violet-100 bg-white py-10"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10 mb-6 flex items-center justify-between gap-6">
        <span className="section-label">
          Ingests the trust you have already earned
        </span>
        <span className="hidden md:inline text-[12px] text-[#4a3d63]">
          Reviews &nbsp;·&nbsp; Referrals &nbsp;·&nbsp; Social &nbsp;·&nbsp;
          Community
        </span>
      </div>
      <div className="marquee-fade">
        <Marquee gradient={false} speed={38} pauseOnHover>
          {SOURCES.map((s, i) => (
            <div
              key={i}
              data-testid={`trust-source-${i}`}
              className="mx-8 md:mx-12 font-display text-[26px] md:text-[32px] tracking-tight text-[#0f0a1e]/45 hover:text-[#6d28d9] transition-colors"
            >
              {s}
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
