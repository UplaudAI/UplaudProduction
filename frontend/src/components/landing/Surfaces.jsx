import {
  Megaphone,
  MessageCircle,
  Search,
  Handshake,
  FileText,
  BrainCircuit,
} from "lucide-react";

const SURFACES = [
  {
    icon: Megaphone,
    tag: "paid",
    title: "Meta, Google & TikTok ads",
    body: "Story-driven creative and lookalikes built from customers who already converted.",
  },
  {
    icon: MessageCircle,
    tag: "social",
    title: "Reddit, X & community threads",
    body: "Surface the right testimonial to the right question, on-brand and in-context.",
  },
  {
    icon: BrainCircuit,
    tag: "AI search",
    title: "ChatGPT, Perplexity & Gemini",
    body: "Make your customer trust visible to the AI engines your future buyers are asking.",
  },
  {
    icon: Handshake,
    tag: "referrals",
    title: "One-tap warm referrals",
    body: "Turn happy customers into personalised intros that arrive pre-sold.",
  },
  {
    icon: FileText,
    tag: "web & SEO",
    title: "Landing pages & SEO/GEO",
    body: "Ship social proof pages built from your best customer stories, ranked for the queries that matter.",
  },
  {
    icon: Search,
    tag: "sales",
    title: "CRM follow-ups & sales calls",
    body: "The perfect proof point auto-suggested in every follow-up email and pipeline touch.",
  },
];

export default function Surfaces() {
  return (
    <section
      id="surfaces"
      data-testid="surfaces-section"
      className="relative py-24 md:py-32 bg-white"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="max-w-3xl mb-14">
          <h2
            data-testid="surfaces-headline"
            className="font-display text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.02] font-semibold tracking-tight text-[#111827]"
          >
            One trust engine.
            <br />
            <span className="mint-underline">Every acquisition surface.</span>
          </h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-[#4b5563] max-w-xl">
            Uplaud does not just capture trust. It activates it wherever a
            future customer will meet your brand next.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SURFACES.map((s, i) => (
            <div
              key={i}
              data-testid={`surface-${i}`}
              className="group rounded-2xl border border-[#eeeaf6] bg-white p-7 hover:border-[#6d46c6] hover:shadow-[0_20px_50px_-30px_rgba(38,28,77,0.35)] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-[#f5f3ff] flex items-center justify-center text-[#6d46c6] group-hover:bg-[#5eead4] group-hover:text-[#261c4d] transition-colors">
                  <s.icon className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#9ca3af]">
                  {s.tag}
                </span>
              </div>
              <h3 className="mt-6 font-display text-[19px] font-semibold tracking-tight text-[#111827]">
                {s.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[#4b5563]">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
