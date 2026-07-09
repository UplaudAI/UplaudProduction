import { X, Check } from "lucide-react";

const OLD_WAY = [
  "Paying more for cold clicks every quarter",
  "Chasing reviews with awkward follow-up emails",
  "Asking for referrals and hoping for the best",
];

const NEW_WAY = [
  "Happy customers refer friends in one tap",
  "Reviews land on WhatsApp in minutes, not weeks",
  "Trust does the selling. You just count new bookings.",
];

export default function PainPoint() {
  return (
    <section
      id="pain"
      data-testid="pain-point-section"
      className="relative py-24 md:py-32 bg-white"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="max-w-3xl">
          <span className="section-label">01 / the problem</span>
          <h2
            data-testid="pain-headline"
            className="mt-4 font-display text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.02] font-semibold tracking-tight text-[#111827]"
          >
            Ads got expensive.
            <br />
            <span className="text-[#6d46c6]">Trust never did.</span>
          </h2>
          <p className="mt-6 text-[16px] leading-relaxed text-[#4b5563] max-w-xl">
            Every year you spend more on ads and see less come back. Meanwhile
            your happiest customers &mdash; the ones already telling their
            friends about you &mdash; are doing it without any help from you.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            data-testid="pain-old-way"
            className="border border-[#eeeaf6] rounded-2xl p-8 bg-[#faf9ff]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white border border-[#eeeaf6] flex items-center justify-center">
                <X className="w-4 h-4 text-[#9ca3af]" strokeWidth={2.5} />
              </div>
              <span className="font-display text-[16px] font-semibold text-[#111827]">
                The old way
              </span>
            </div>
            <ul className="mt-6 space-y-4">
              {OLD_WAY.map((t, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[15px] leading-relaxed text-[#4b5563]"
                >
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#9ca3af] shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div
            data-testid="pain-new-way"
            className="relative border-2 border-[#6d46c6] rounded-2xl p-8 bg-white overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#5eead4]/25 blur-2xl pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#6d46c6] flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-display text-[16px] font-semibold text-[#111827]">
                  The Uplaud way
                </span>
              </div>
              <span className="star">NEW</span>
            </div>
            <ul className="relative mt-6 space-y-4">
              {NEW_WAY.map((t, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[15px] leading-relaxed text-[#111827]"
                >
                  <Check
                    className="w-4 h-4 mt-1 text-[#6d46c6] shrink-0"
                    strokeWidth={2.5}
                  />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
