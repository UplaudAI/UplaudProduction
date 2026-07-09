import Marquee from "react-fast-marquee";

const SOURCES = [
  "Trustpilot",
  "G2",
  "Google Reviews",
  "Yelp",
  "Shopify",
  "Amazon reviews",
  "Reddit",
  "X",
  "Instagram DMs",
  "TikTok comments",
  "LinkedIn",
  "HubSpot",
  "Salesforce",
  "Zendesk tickets",
  "WhatsApp",
  "Telegram",
  "SMS",
  "Testimonial emails",
  "Sales call transcripts",
];

export default function TrustBar() {
  return (
    <section
      data-testid="trust-bar"
      className="relative border-y border-[#eeeaf6] bg-[#faf9ff] py-10"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10 mb-5 flex items-baseline justify-between gap-4">
        <span className="section-label">
          Easily bring in customer trust signals from anywhere
        </span>
        <span className="hidden md:inline text-[12px] text-[#4b5563]">
          Reviews · Social · CRM · Support · Referrals
        </span>
      </div>
      <div className="marquee-fade">
        <Marquee gradient={false} speed={34} pauseOnHover>
          {SOURCES.map((s, i) => (
            <div
              key={i}
              data-testid={`trust-source-${i}`}
              className="mx-3 md:mx-4 px-4 py-2 rounded-full border border-[#eeeaf6] bg-white text-[13px] font-medium text-[#4b5563] hover:text-[#6d46c6] hover:border-[#d9d1ee] transition-colors"
            >
              {s}
            </div>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
