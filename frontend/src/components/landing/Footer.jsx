import { ArrowUpRight } from "lucide-react";

const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_ai-acquisition-hub-2/artifacts/1gh9rg2w_ChatGPT_Image_May_11__2026__01_46_39_PM-removebg-preview.png";

const NAV = [
  {
    heading: "Product",
    links: [
      { label: "The problem", href: "#pain" },
      { label: "How it works", href: "#how" },
      { label: "AI Engine", href: "#engine" },
      { label: "Features", href: "#features" },
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
      className="relative bg-[#0b0616] text-[#fdfbff] border-t border-violet-500/10 pt-20 overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#7c3aed]/10 to-transparent pointer-events-none" />
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
                className="w-9 h-9 rounded-full"
                width={36}
                height={36}
              />
              <span className="font-display text-[19px] font-semibold tracking-tight">
                uplaud
                <span className="text-[#a78bfa]">.ai</span>
              </span>
            </a>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-white/60">
              Trust-powered acquisition for modern commerce. Turn WhatsApp
              reviews and referrals into a compounding growth engine.
            </p>
            <a
              href="#demo"
              data-testid="footer-cta"
              className="btn-primary btn-on-dark mt-8"
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
                      className="text-[14px] text-white/80 hover:text-[#a78bfa] transition-colors"
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
          <h3 className="font-display font-semibold tracking-tighter text-[22vw] md:text-[18vw] lg:text-[16vw] leading-[0.85] text-transparent bg-clip-text bg-[linear-gradient(180deg,rgba(167,139,250,0.22),rgba(167,139,250,0.02))]">
            uplaud.ai
          </h3>
        </div>
      </div>

      <div className="border-t border-violet-500/10">
        <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[12px] text-white/40">
          <span>
            © {new Date().getFullYear()} Uplaud AI. All rights reserved.
          </span>
          <span className="font-mono">
            Trust-powered acquisition &nbsp;·&nbsp; v1
          </span>
        </div>
      </div>
    </footer>
  );
}
