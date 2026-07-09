import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "How is Uplaud different from a review platform or a referral tool?",
    a: "Review tools capture. Referral tools distribute. Uplaud does both, connects them through an AI Trust Graph, and feeds the resulting signal back into your paid ad accounts. Trust becomes the acquisition channel, not a side quest.",
  },
  {
    q: "Why WhatsApp?",
    a: "WhatsApp has the highest reply and open rates of any channel a customer will meet you on. It lets us capture authentic reviews in voice or text, in 50+ languages, at the moment of delight. That is why our pilot customers see 60% higher review rates than email or web forms.",
  },
  {
    q: "Do I need thousands of reviews to get value?",
    a: "No. Uplaud starts working with whatever trust signal you have and grows the graph from there. Pilot customers see lift within their first cohort.",
  },
  {
    q: "Which ad platforms do you integrate with?",
    a: "Meta, Google, TikTok and LinkedIn today. We push audiences, creative and attribution back into your existing ad accounts, no rip-and-replace required.",
  },
  {
    q: "What kinds of businesses is this a fit for?",
    a: "Any business where a single conversion is valuable and trust is expensive to earn. High-consideration ecommerce, professional services, education, healthcare and B2B SaaS all work well.",
  },
  {
    q: "How long is onboarding?",
    a: "Most teams are live within 10 business days: WhatsApp ingestion, one referral loop and one paid loop live in your first cohort.",
  },
];

export default function FAQ() {
  return (
    <section
      id="faq"
      data-testid="faq-section"
      className="relative py-24 md:py-32 bg-white border-t border-violet-100"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <span className="section-label">07 &nbsp;/&nbsp; faq</span>
            <h2
              data-testid="faq-headline"
              className="mt-4 font-display text-[36px] sm:text-[44px] leading-[1.05] font-semibold tracking-tight text-[#0f0a1e]"
            >
              Questions we hear
              <br />
              on the first call.
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-[#4a3d63] max-w-sm">
              Something else on your mind? Book a demo below and ask directly.
            </p>
          </div>

          <div className="lg:col-span-8">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  data-testid={`faq-item-${i}`}
                  className="border-b border-violet-100"
                >
                  <AccordionTrigger
                    data-testid={`faq-trigger-${i}`}
                    className="font-display text-[18px] md:text-[20px] tracking-tight text-[#0f0a1e] hover:no-underline hover:text-[#6d28d9] py-6"
                  >
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent
                    data-testid={`faq-content-${i}`}
                    className="text-[14px] leading-relaxed text-[#4a3d63] pb-6 pr-6"
                  >
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
