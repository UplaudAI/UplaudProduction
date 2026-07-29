import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/#how", label: "How it works", testId: "nav-link-how" },
  { href: "/#agents", label: "AI Agents", testId: "nav-link-agents" },
  { href: "/#surfaces", label: "Activation", testId: "nav-link-surfaces" },
  { href: "/blog", label: "Blog", testId: "nav-link-blog" },
  { href: "/#faq", label: "FAQ", testId: "nav-link-faq" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      data-testid="site-navbar"
      className="fixed inset-x-0 top-0 z-50 bg-transparent border-b border-transparent"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <a
          href="/#top"
          data-testid="brand-logo"
          className="flex items-center gap-2 text-[#6d46c6]"
          aria-label="Uplaud home"
        >
          <span
            data-testid="brand-wordmark"
            className="font-display text-[22px] leading-none tracking-[-0.04em]"
          >
            uplaud
          </span>
          <span
            aria-hidden
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#d9d1ee]/70 bg-transparent text-[13px] leading-none"
          >
            ◔
          </span>
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
            className="btn-secondary h-11 px-5"
          >
            Log in
          </a>
          <a
            href="/#demo"
            data-testid="nav-book-demo-btn"
            className="btn-primary h-11 px-5"
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
              className="btn-secondary justify-center"
            >
              Log in
            </a>
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
