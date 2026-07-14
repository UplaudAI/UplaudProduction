import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function Nav({ businessName }) {
  return (
    <header
      data-testid="site-nav"
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{ background: "rgba(244, 239, 230, 0.82)", borderBottom: "1px solid var(--u-line)" }}
    >
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2 group">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs"
            style={{
              background:
                "conic-gradient(from 210deg at 50% 50%, #5B3EEE 0%, #7CE8C8 40%, #5B3EEE 90%)",
            }}
          >
            u
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">uplaud</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-[color:var(--u-ink-2)]">
          <a href="#reviews" data-testid="nav-reviews" className="hover:text-[color:var(--u-ink)] transition">Reviews</a>
          <a href="#insights" data-testid="nav-insights" className="hover:text-[color:var(--u-ink)] transition">Insights</a>
          <a href="#stories" data-testid="nav-stories" className="hover:text-[color:var(--u-ink)] transition">Stories</a>
          <a href="#share" data-testid="nav-share" className="hover:text-[color:var(--u-ink)] transition">Share yours</a>
        </nav>
        <div className="flex items-center gap-3">
          <a
            href={`https://wa.me/?text=Check out ${encodeURIComponent(businessName || "this business")} on Uplaud`}
            target="_blank"
            rel="noreferrer"
            data-testid="nav-refer-btn"
            className="u-btn u-btn-ghost hidden sm:inline-flex"
          >
            Refer a friend
          </a>
          <a href="#share" data-testid="nav-cta-btn" className="u-btn u-btn-primary">
            Leave a review <ArrowUpRight size={16} />
          </a>
        </div>
      </div>
    </header>
  );
}
