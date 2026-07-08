import { ArrowUpRight } from "lucide-react";

const NAV = [
  {
    heading: "Product",
    links: [
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
      { label: "hello@uplaud.ai", href: "mailto:deepthi@uplaud.ai" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      data-testid="site-footer"
      className="relative bg-[#050505] text-[#fdfdfb] border-t border-white/5 pt-20"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-6">
            <a
              href="#top"
              data-testid="footer-brand"
              className="inline-flex items-center gap-2"
            >
              <span className="relative inline-block w-6 h-6">
                <span className="absolute inset-0 bg-white/90 rounded-sm" />
                <span className="absolute inset-[3px] bg-[#10b981] rounded-[2px]" />
              </span>
              <span className="font-display text-[18px] font-medium tracking-tight">
                Uplaud<span className="text-[#10b981]">.</span>ai
              </span>
            </a>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-white/60">
              Trust-powered acquisition for modern commerce. Turn reviews and
              referrals into a compounding growth engine.
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
                        .replace(/\s+/g, "-")}`}
                      className="text-[14px] text-white/80 hover:text-[#10b981] transition-colors"
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

      <div
        aria-hidden
        className="mt-16 overflow-hidden select-none"
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <h3 className="font-display font-medium tracking-tighter text-[22vw] md:text-[18vw] lg:text-[16vw] leading-[0.85] text-transparent bg-clip-text bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02))]">
            uplaud.ai
          </h3>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-[12px] text-white/40">
          <span>© {new Date().getFullYear()} Uplaud AI. All rights reserved.</span>
          <span className="font-mono">Trust-powered acquisition · v1</span>
        </div>
      </div>
    </footer>
  );
}
