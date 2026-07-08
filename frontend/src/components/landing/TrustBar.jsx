import Marquee from "react-fast-marquee";

const SOURCES = [
  "Trustpilot",
  "G2",
  "Reddit",
  "WeChat",
  "Google Reviews",
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
      className="border-y border-black/5 bg-[#fdfdfb] py-10"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10 mb-6 flex items-center justify-between gap-6">
        <span className="section-label">
          Ingests the trust you&apos;ve already earned
        </span>
        <span className="hidden md:inline text-[12px] text-[#525252]">
          Reviews · Referrals · Social · Community
        </span>
      </div>
      <div className="marquee-fade">
        <Marquee gradient={false} speed={38} pauseOnHover>
          {SOURCES.map((s, i) => (
            <div
              key={i}
              data-testid={`trust-source-${i}`}
              className="mx-8 md:mx-12 font-display text-[26px] md:text-[32px] tracking-tight text-[#0a0a0a]/55 hover:text-[#0a0a0a] transition-colors"
            >
              {s}
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
