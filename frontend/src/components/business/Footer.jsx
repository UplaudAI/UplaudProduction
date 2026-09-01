const LOGO_URL = "/uplaud-main-wordmark.png";

export default function Footer() {
  return (
    <footer className="border-t border-[color:var(--u-line)] mt-8" data-testid="site-footer">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <img
            src={LOGO_URL}
            alt="Uplaud"
            className="h-8 w-auto object-contain mix-blend-multiply"
            style={{ maxWidth: 112 }}
          />
          <span className="text-xs text-[color:var(--u-muted)] ml-2">
            The trust engine for modern acquisition
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs text-[color:var(--u-muted)]">
          <a href="#" className="hover:text-[color:var(--u-ink)] transition">Privacy</a>
          <a href="#" className="hover:text-[color:var(--u-ink)] transition">Terms</a>
          <a href="#" className="hover:text-[color:var(--u-ink)] transition">Claim this page</a>
          <span className="hidden md:inline">© {new Date().getFullYear()} Uplaud AI</span>
        </div>
      </div>
    </footer>
  );
}
