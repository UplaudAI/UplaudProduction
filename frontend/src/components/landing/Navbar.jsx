import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

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
          ? "backdrop-blur-xl bg-white/90 border-b border-[#eeeaf6] shadow-[0_16px_40px_-32px_rgba(38,28,77,0.55)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <a
          href="/#top"
          data-testid="brand-logo"
          className="flex items-center"
          aria-label="Uplaud home"
        >
          <img
            src="/assets/uplaud-logo-purple-transparent.png"
            alt="Uplaud"
            className="h-14 w-auto object-contain"
            style={{ maxWidth: 172 }}
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
            href="/business"
            data-testid="nav-sign-in-link"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#d9d1ee] bg-white/45 px-5 text-[13px] font-medium text-[#261c4d] shadow-[0_14px_34px_-24px_rgba(38,28,77,0.55)] transition-all hover:-translate-y-0.5 hover:border-[#6d46c6]/40 hover:bg-white/75"
          >
            Log in
          </a>
          <a
            href="/#demo"
            data-testid="nav-book-demo-btn"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#6d46c6] px-5 text-[13px] font-semibold text-white shadow-[0_14px_34px_-18px_rgba(109,70,198,0.8)] transition-all hover:-translate-y-0.5 hover:bg-[#5f35bf]"
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
              href="/business"
              data-testid="nav-sign-in-link-mobile"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#d9d1ee] bg-white px-5 text-[14px] font-medium text-[#261c4d]"
            >
              Log in
            </a>
            <a
              href="/#demo"
              data-testid="nav-book-demo-btn-mobile"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#6d46c6] px-5 text-[14px] font-semibold text-white shadow-[0_14px_34px_-18px_rgba(109,70,198,0.8)]"
            >
              Book a demo
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
