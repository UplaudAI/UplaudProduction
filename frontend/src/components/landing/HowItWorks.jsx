import {
  Inbox,
  BrainCircuit,
  Megaphone,
  MessageCircle,
  Users,
  BarChart3,
} from "lucide-react";

/**
 * Six flywheel stations arranged in a circle.
 * Angles start at 12 o'clock and rotate clockwise.
 */
const STATIONS = [
  {
    key: "capture",
    icon: Inbox,
    tag: "01 · capture",
    title: "Bring trust in",
    body: "Reviews, referrals, DMs, CRM, sales calls, testimonials — from every source.",
  },
  {
    key: "structure",
    icon: BrainCircuit,
    tag: "02 · structure",
    title: "AI reads & tags it",
    body: "Every story tagged by theme, sentiment, buyer intent and channel fit.",
  },
  {
    key: "ads",
    icon: Megaphone,
    tag: "03 · activate ads",
    title: "Fuel your paid growth",
    body: "Story-driven creative and lookalikes shipped to Meta, Google and TikTok.",
  },
  {
    key: "social",
    icon: MessageCircle,
    tag: "04 · activate trust",
    title: "Show up on Reddit, X & AI search",
    body: "The right testimonial in the right thread, in the right ChatGPT answer.",
  },
  {
    key: "refer",
    icon: Users,
    tag: "05 · referrals",
    title: "Turn advocates into leads",
    body: "One-tap warm referrals, in your customer's voice, to the right friend.",
  },
  {
    key: "insight",
    icon: BarChart3,
    tag: "06 · insight",
    title: "Feed the wheel",
    body: "Attribution and insight go back into capture. Every spin gets smarter.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how"
      data-testid="how-it-works-section"
      className="relative py-24 md:py-32 bg-[#faf9ff] border-y border-[#eeeaf6] overflow-hidden"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="max-w-3xl mb-12 md:mb-16">
          <h2
            data-testid="how-headline"
            className="font-display text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.02] font-semibold tracking-tight text-[#111827]"
          >
            The Uplaud
            <br />
            <span className="mint-underline">growth flywheel.</span>
          </h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-[#4b5563] max-w-xl">
            Every spin turns customer trust into acquisition, and every new
            customer feeds the next spin. Uplaud runs all six stations for you.
          </p>
        </div>

        <Flywheel />

        {/* Mobile fallback list */}
        <div
          className="md:hidden mt-10 space-y-3"
          data-testid="flywheel-mobile-list"
        >
          {STATIONS.map((s, i) => (
            <div
              key={s.key}
              data-testid={`flywheel-station-mobile-${i}`}
              className="rounded-2xl border border-[#eeeaf6] bg-white p-5 flex items-start gap-4"
            >
              <div className="w-10 h-10 shrink-0 rounded-full bg-[#f5f3ff] text-[#6d46c6] flex items-center justify-center">
                <s.icon className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#6d46c6]">
                  {s.tag}
                </div>
                <div className="mt-1 font-display text-[16px] font-semibold text-[#111827]">
                  {s.title}
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-[#4b5563]">
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Flywheel() {
  // Six positions clockwise starting from 12 o'clock (top)
  const RADIUS_PCT = 40; // % from center along both x & y
  const positions = STATIONS.map((_, i) => {
    const angleDeg = -90 + i * 60; // -90 = top, then clockwise
    const rad = (angleDeg * Math.PI) / 180;
    return {
      left: 50 + RADIUS_PCT * Math.cos(rad),
      top: 50 + RADIUS_PCT * Math.sin(rad),
    };
  });

  return (
    <div
      data-testid="flywheel"
      className="relative hidden md:block mx-auto w-full max-w-[860px] aspect-square"
    >
      {/* Rotating dashed orbit */}
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient id="orbitStroke" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#6d46c6" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#5eead4" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#6d46c6" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {/* Static outer ring */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#eeeaf6"
          strokeWidth="0.35"
        />
        {/* Rotating dashed ring */}
        <g
          style={{
            transformOrigin: "50px 50px",
            animation: "flywheelSpin 40s linear infinite",
          }}
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="url(#orbitStroke)"
            strokeWidth="0.35"
            strokeDasharray="1.2 2.2"
          />
          {/* Arrow head — one bold dash to indicate motion */}
          <circle cx="90" cy="50" r="1.4" fill="#5eead4" />
        </g>
        {/* Inner faint ring */}
        <circle
          cx="50"
          cy="50"
          r="22"
          fill="none"
          stroke="#eeeaf6"
          strokeWidth="0.3"
        />
      </svg>

      {/* Center hub */}
      <div
        data-testid="flywheel-hub"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
      >
        <div className="w-[220px] h-[220px] lg:w-[240px] lg:h-[240px] rounded-full bg-[#261c4d] text-white flex flex-col items-center justify-center shadow-[0_30px_80px_-20px_rgba(38,28,77,0.55)]">
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#5eead4]">
            uplaud
          </span>
          <span className="mt-2 font-display text-[22px] lg:text-[26px] font-semibold tracking-tight leading-tight text-center px-6">
            The trust engine
          </span>
          <span className="mt-3 text-[11px] text-white/60">
            Runs 24 / 7 · autopilot
          </span>
        </div>
      </div>

      {/* Six stations */}
      {STATIONS.map((s, i) => {
        const pos = positions[i];
        return (
          <div
            key={s.key}
            data-testid={`flywheel-station-${i}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-[210px] lg:w-[240px] group"
            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
          >
            <div className="rounded-2xl border border-[#eeeaf6] bg-white p-4 lg:p-5 shadow-[0_20px_50px_-30px_rgba(38,28,77,0.35)] hover:border-[#6d46c6] transition-colors">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-full bg-[#f5f3ff] text-[#6d46c6] flex items-center justify-center group-hover:bg-[#5eead4] group-hover:text-[#261c4d] transition-colors">
                  <s.icon className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <span className="text-[9.5px] font-mono uppercase tracking-widest text-[#9ca3af]">
                  {s.tag.split(" · ")[0]}
                </span>
              </div>
              <div className="mt-3 text-[10px] font-mono uppercase tracking-widest text-[#6d46c6]">
                {s.tag.split(" · ")[1]}
              </div>
              <div className="mt-1 font-display text-[15px] lg:text-[16px] font-semibold text-[#111827] leading-snug">
                {s.title}
              </div>
              <p className="mt-1.5 text-[11.5px] lg:text-[12px] leading-relaxed text-[#4b5563]">
                {s.body}
              </p>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes flywheelSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
