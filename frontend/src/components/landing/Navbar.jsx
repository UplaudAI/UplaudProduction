import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

const LOGO_URL =
  "https://customer-assets.emergentagent.com/job_ai-acquisition-hub-2/artifacts/1gh9rg2w_ChatGPT_Image_May_11__2026__01_46_39_PM-removebg-preview.png";

const NAV_LINKS = [
  { href: "#pain", label: "The problem", testId: "nav-link-pain" },
  { href: "#how", label: "How it works", testId: "nav-link-how" },
  { href: "#engine", label: "AI engine", testId: "nav-link-engine" },
  { href: "#faq", label: "FAQ", testId: "nav-link-faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="site-navbar"
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-white/70 border-b border-violet-100"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <a
          href="#top"
          data-testid="brand-logo"
          className="flex items-center gap-2.5 group"
        >
          <img
            src={LOGO_URL}
            alt="Uplaud"
            className="w-8 h-8 rounded-full"
            width={32}
            height={32}
          />
          <span className="font-display text-[19px] font-semibold tracking-tight text-[#0f0a1e]">
            uplaud
            <span className="text-[#7c3aed]">.ai</span>
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-testid={l.testId}
              className="text-[13px] text-[#4a3d63] hover:text-[#6d28d9] transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="#demo"
            data-testid="nav-book-demo-btn"
            className="btn-primary"
          >
            Book a demo
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
          </a>
        </div>

        <button
          data-testid="mobile-menu-toggle"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 border border-violet-200 rounded-full text-[#0f0a1e]"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div
          data-testid="mobile-menu"
          className="md:hidden border-t border-violet-100 bg-white/95 backdrop-blur-xl"
        >
          <div className="px-6 py-4 flex flex-col gap-3">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                data-testid={`${l.testId}-mobile`}
                onClick={() => setOpen(false)}
                className="text-[14px] text-[#0f0a1e] py-2"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#demo"
              data-testid="nav-book-demo-btn-mobile"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 justify-center"
            >
              Book a demo
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
