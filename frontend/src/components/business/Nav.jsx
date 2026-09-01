import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

const LOGO_LIGHT_URL = "/uplaud-main-wordmark.png";

export default function Nav({ businessName, audience }) {
  const isB2B = audience === "b2b";
  return (
    <header
      data-testid="site-nav"
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{ background: "rgba(244, 239, 230, 0.82)", borderBottom: "1px solid var(--u-line)" }}
    >
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="flex items-center">
          <img
            src={LOGO_LIGHT_URL}
            alt="Uplaud"
            className="h-10 w-auto object-contain mix-blend-multiply"
            style={{ maxWidth: 120 }}
          />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-[color:var(--u-ink-2)]">
          <a href="#reviews" data-testid="nav-reviews" className="hover:text-[color:var(--u-ink)] transition">Reviews</a>
          <a href="#insights" data-testid="nav-insights" className="hover:text-[color:var(--u-ink)] transition">Insights</a>
          <a href="#stories" data-testid="nav-stories" className="hover:text-[color:var(--u-ink)] transition">Stories</a>
        </nav>
        <div className="flex items-center gap-3">
          <a
            href={`https://wa.me/?text=Check out ${encodeURIComponent(businessName || "this business")} on Uplaud`}
            target="_blank"
            rel="noreferrer"
            data-testid="nav-refer-btn"
            className="u-btn u-btn-ghost hidden sm:inline-flex"
          >
            <MessageCircle size={15} />
            {isB2B ? "Refer a teammate" : "Refer a friend"}
          </a>
        </div>
      </div>
    </header>
  );
}
