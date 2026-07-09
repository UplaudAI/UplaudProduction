import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Is Uplaud a reviews and referrals tool?",
    a: "Reviews and referrals are part of it, but the real value is broader. Uplaud is a trust-powered growth platform that turns your customer trust &mdash; from every source &mdash; into acquisition, ads, content, referrals and audience insight.",
  },
  {
    q: "What kinds of trust signals do you ingest?",
    a: "Reviews (Trustpilot, G2, Google, Yelp, Shopify), social (Reddit, X, Instagram, TikTok, LinkedIn), CRM notes and email testimonials, support tickets, sales-call transcripts, referrals and native captures on WhatsApp, SMS or your site.",
  },
  {
    q: "What do the AI Agents actually do?",
    a: "They analyze trust data, spot warm leads, recommend campaigns, generate ad creative, draft follow-ups, surface the right testimonial for the right query on social, and hand you a one-click approve workflow. You stay in command.",
  },
  {
    q: "Does Uplaud replace my ad platforms or CRM?",
    a: "No. Uplaud plugs into what you already use &mdash; Meta, Google, TikTok, HubSpot, Salesforce, Shopify and more &mdash; and makes them smarter with trust-native audiences, creative and attribution.",
  },
  {
    q: "How does making trust AI-visible work?",
    a: "As buyers start using ChatGPT, Perplexity and Gemini to research, the brands whose customer trust is structured and citable will win the answer. Uplaud publishes your trust in AI-friendly formats so you show up where the query is asked.",
  },
  {
    q: "Who is Uplaud built for?",
    a: "High-consideration businesses where a single new customer is valuable and trust is expensive to earn &mdash; ecommerce, education, healthcare, legal, professional services and B2B SaaS.",
  },
];

export default function FAQ() {
  return (
    <section
      id="faq"
      data-testid="faq-section"
      className="relative py-24 md:py-32 bg-[#faf9ff] border-y border-[#eeeaf6]"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <span className="section-label">05 / faq</span>
            <h2
              data-testid="faq-headline"
              className="mt-4 font-display text-[36px] sm:text-[44px] leading-[1.05] font-semibold tracking-tight text-[#111827]"
            >
              Straight answers.
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-[#4b5563] max-w-sm">
              Something more specific? Book a demo below and ask us directly.
            </p>
          </div>

          <div className="lg:col-span-8">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  data-testid={`faq-item-${i}`}
                  className="border-b border-[#eeeaf6]"
                >
                  <AccordionTrigger
                    data-testid={`faq-trigger-${i}`}
                    className="font-display text-[18px] md:text-[19px] tracking-tight text-[#111827] hover:no-underline hover:text-[#6d46c6] py-6"
                  >
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent
                    data-testid={`faq-content-${i}`}
                    className="text-[14px] leading-relaxed text-[#4b5563] pb-6 pr-6"
                  >
                    <span dangerouslySetInnerHTML={{ __html: f.a }} />
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
