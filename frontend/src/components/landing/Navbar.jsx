import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

const LOGO_LIGHT_URL =
  "https://customer-assets-gfyr7b9c.emergentagent.net/job_ai-acquisition-hub-2/artifacts/24zfs0md_logo_white_background.webp";

const NAV_LINKS = [
  { href: "/#how", label: "How it works", testId: "nav-link-how" },
  { href: "/#agents", label: "AI Agents", testId: "nav-link-agents" },
  { href: "/#surfaces", label: "Activation", testId: "nav-link-surfaces" },
  { href: "/blog", label: "Blog", testId: "nav-link-blog" },
  { href: "/#faq", label: "FAQ", testId: "nav-link-faq" },
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
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-white/85 border-b border-[#eeeaf6]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <a
          href="/#top"
          data-testid="brand-logo"
          className="flex items-center"
        >
          <img
            src={LOGO_LIGHT_URL}
            alt="Uplaud"
            className="h-10 w-auto object-contain mix-blend-multiply"
            style={{ maxWidth: 120 }}
          />
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-testid={l.testId}
              className="text-[13px] text-[#4b5563] hover:text-[#6d46c6] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="/#demo"
            data-testid="nav-book-demo-btn"
            className="btn-primary"
          >
            Book a demo
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
          </a>
        </div>

        <button
          data-testid="mobile-menu-toggle"
          className="md:hidden inline-flex items-center justify-center w-10 h-10 border border-[#d9d1ee] rounded-full text-[#111827]"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div
          data-testid="mobile-menu"
          className="md:hidden border-t border-[#eeeaf6] bg-white/95 backdrop-blur-xl"
        >
          <div className="px-6 py-4 flex flex-col gap-3">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                data-testid={`${l.testId}-mobile`}
                onClick={() => setOpen(false)}
                className="text-[14px] text-[#111827] py-2"
              >
                {l.label}
              </a>
            ))}
            <a
              href="/#demo"
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
