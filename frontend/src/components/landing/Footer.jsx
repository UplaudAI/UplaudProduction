import { ArrowUpRight } from "lucide-react";

const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_ai-acquisition-hub-2/artifacts/1gh9rg2w_ChatGPT_Image_May_11__2026__01_46_39_PM-removebg-preview.png";

const NAV = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "#how" },
      { label: "AI Agents", href: "#agents" },
      { label: "Activation", href: "#surfaces" },
      { label: "Flywheel", href: "#results" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Book a demo", href: "#demo" },
      { label: "deepthi@uplaud.ai", href: "mailto:deepthi@uplaud.ai" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      data-testid="site-footer"
      className="relative bg-[#261c4d] text-white pt-20 overflow-hidden"
    >
      <div className="relative max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-6">
            <a
              href="#top"
              data-testid="footer-brand"
              className="inline-flex items-center gap-2.5"
            >
              <img
                src={LOGO_URL}
                alt="Uplaud"
                className="w-10 h-10 rounded-full"
                width={40}
                height={40}
              />
              <span className="font-brand text-[24px] text-white leading-none">
                uplaud
              </span>
            </a>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-white/65">
              The trust engine for modern acquisition. Ingest customer trust
              from anywhere. Activate it across every channel. Growth on
              autopilot.
            </p>
            <a
              href="#demo"
              data-testid="footer-cta"
              className="btn-primary btn-mint mt-8"
            >
              Book a demo
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
            </a>
          </div>

          {NAV.map((col) => (
            <div key={col.heading} className="md:col-span-3">
              <div className="font-mono text-[11px] uppercase tracking-widest text-white/40">
                {col.heading}
              </div>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      data-testid={`footer-link-${l.label
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "")}`}
                      className="text-[14px] text-white/80 hover:text-[#5eead4] transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden className="mt-16 overflow-hidden select-none">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <h3 className="font-display font-semibold tracking-tighter text-[22vw] md:text-[18vw] lg:text-[16vw] leading-[0.85] text-transparent bg-clip-text bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.02))]">
            uplaud.ai
          </h3>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[12px] text-white/45">
          <span>
            © {new Date().getFullYear()} Uplaud AI. All rights reserved.
          </span>
          <span className="font-mono">Trust-powered growth · v1</span>
        </div>
      </div>
    </footer>
  );
}
