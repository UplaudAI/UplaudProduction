import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Who is Uplaud for?",
    a: "Any business where trust matters and one new customer is worth a lot. Tutoring centers, clinics, law firms, vets, groomers, dermatologists, immigration lawyers, preschools &mdash; if your customers already talk about you, Uplaud will make it count.",
  },
  {
    q: "Do my customers need an app?",
    a: "No. Everything happens on WhatsApp, which they already have. No downloads, no logins, no friction.",
  },
  {
    q: "How long to see results?",
    a: "Most customers see their first spike in reviews within the first week and their first referred bookings inside 30 days.",
  },
  {
    q: "What about my existing reviews?",
    a: "We import them. Google, Yelp, Trustpilot, or wherever they live. Nothing goes to waste.",
  },
  {
    q: "How much time will I spend on this?",
    a: "About 20 minutes to set up. Then roughly zero. Uplaud runs quietly in the background.",
  },
  {
    q: "Is my customer data safe?",
    a: "Yes. We are GDPR-friendly, never share your list, and you can export or delete any time.",
  },
];

export default function FAQ() {
  return (
    <section
      id="faq"
      data-testid="faq-section"
      className="relative py-24 md:py-32 bg-white"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <span className="section-label">05 / faq</span>
            <h2
              data-testid="faq-headline"
              className="mt-4 font-display text-[36px] sm:text-[44px] leading-[1.05] font-semibold tracking-tight text-[#111827]"
            >
              Quick answers.
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-[#4b5563] max-w-sm">
              Something more specific? Book a demo below and ask us live.
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
