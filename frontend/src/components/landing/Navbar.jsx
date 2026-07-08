import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#how", label: "How it works", testId: "nav-link-how" },
  { href: "#engine", label: "AI Engine", testId: "nav-link-engine" },
  { href: "#features", label: "Product", testId: "nav-link-features" },
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
          ? "backdrop-blur-xl bg-[#fdfdfb]/75 border-b border-black/5"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <a
          href="#top"
          data-testid="brand-logo"
          className="flex items-center gap-2 group"
        >
          <span className="relative inline-block w-6 h-6">
            <span className="absolute inset-0 bg-[#0a0a0a] rounded-sm" />
            <span className="absolute inset-[3px] bg-[#10b981] rounded-[2px]" />
          </span>
          <span className="font-display text-[18px] font-medium tracking-tight">
            Uplaud<span className="text-[#10b981]">.</span>ai
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-testid={l.testId}
              className="text-[13px] text-[#525252] hover:text-[#0a0a0a] transition-colors duration-200"
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
          className="md:hidden inline-flex items-center justify-center w-10 h-10 border border-black/10 rounded-sm"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div
          data-testid="mobile-menu"
          className="md:hidden border-t border-black/5 bg-[#fdfdfb]"
        >
          <div className="px-6 py-4 flex flex-col gap-3">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                data-testid={`${l.testId}-mobile`}
                onClick={() => setOpen(false)}
                className="text-[14px] text-[#0a0a0a] py-2"
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
