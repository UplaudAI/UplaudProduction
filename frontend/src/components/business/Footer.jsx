export default function Footer() {
  return (
    <footer className="border-t border-[color:var(--u-line)] mt-8" data-testid="site-footer">
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
            style={{
              background:
                "conic-gradient(from 210deg at 50% 50%, #5B3EEE 0%, #7CE8C8 40%, #5B3EEE 90%)",
            }}
          />
          <span className="font-display font-semibold">uplaud</span>
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
