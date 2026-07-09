import { MessageCircle, Share2, TrendingUp } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: MessageCircle,
    title: "Ask on WhatsApp",
    body: "After every appointment, class or visit, Uplaud sends a quick note. Your customer replies with a review in seconds, in their own voice or words.",
  },
  {
    n: "02",
    icon: Share2,
    title: "Turn love into referrals",
    body: "Every 5-star review becomes a personal referral. One tap and it&apos;s shared with the friends most likely to book you next.",
  },
  {
    n: "03",
    icon: TrendingUp,
    title: "Watch bookings compound",
    body: "New patients, parents, clients and pet parents arrive already sold. You just show up and do what you do best.",
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
          <span className="section-label">02 / how it works</span>
          <h2
            data-testid="how-headline"
            className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.02] font-semibold tracking-tight text-[#111827]"
          >
            Three steps.
            <br />
            <span className="mint-underline">One growth loop.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              data-testid={`how-step-${i}`}
              className="relative border border-[#eeeaf6] rounded-2xl p-8 bg-white hover:border-[#6d46c6] transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-full bg-[#f5f3ff] border border-[#eeeaf6] flex items-center justify-center text-[#6d46c6] group-hover:bg-[#6d46c6] group-hover:text-white transition-colors">
                  <s.icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <span className="font-mono text-[11px] text-[#9ca3af]">
                  {s.n}
                </span>
              </div>
              <h3 className="mt-8 font-display text-[22px] font-semibold tracking-tight text-[#111827]">
                {s.title}
              </h3>
              <p
                className="mt-3 text-[14px] leading-relaxed text-[#4b5563]"
                dangerouslySetInnerHTML={{ __html: s.body }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
