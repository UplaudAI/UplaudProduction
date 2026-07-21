import { useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Upload,
  MessagesSquare,
  Megaphone,
  Users,
  Ghost,
  LineChart,
  Settings,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  Plus,
  Radio,
  Mic,
} from "lucide-react";
import { getAuth, clearAuth } from "@/lib/business-storage";
import { BRAND } from "@/mocks/fintech";

const LOGO_URL =
  "https://customer-assets-gfyr7b9c.emergentagent.net/job_ai-acquisition-hub-2/artifacts/24zfs0md_logo_white_background.webp";

const NAV = [
  {
    section: "Growth Engine",
    items: [
      { to: "/business/insights", label: "Overview", icon: LineChart, testId: "nav-insights" },
    ],
  },
  {
    section: "Growth Activation",
    hint: "Pre-customer",
    items: [
      { to: "/business/interactions", label: "Interactions", icon: Radio, testId: "nav-interactions" },
      { to: "/business/conversations", label: "Conversations", icon: Mic, testId: "nav-conversations" },
    ],
  },
  {
    section: "Customer Advocacy",
    hint: "Post-customer",
    items: [
      { to: "/business/reviews", label: "Reviews & Feedback", icon: MessagesSquare, testId: "nav-reviews" },
      { to: "/business/referrals", label: "Referrals", icon: Users, testId: "nav-referrals" },
    ],
  },
  {
    section: "Amplification",
    items: [
      { to: "/business/social", label: "Social Agent", icon: Megaphone, testId: "nav-social" },
      { to: "/business/reddit", label: "Reddit Agent", icon: Ghost, testId: "nav-reddit" },
    ],
  },
  {
    section: "Data",
    items: [
      { to: "/business/import", label: "Import", icon: Upload, testId: "nav-import" },
    ],
  },
];

export default function DashboardLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const user = getAuth();

  useEffect(() => {
    if (!user) {
      nav("/business", { replace: true });
    }
  }, [user, nav]);

  const handleLogout = () => {
    clearAuth();
    nav("/business", { replace: true });
  };

  if (!user) return null;

  return (
    <div
      data-testid="business-dashboard"
      className="min-h-screen w-full bg-[#faf9ff] text-[#111827] flex"
    >
      {/* Sidebar */}
      <aside
        data-testid="dashboard-sidebar"
        className="w-[248px] shrink-0 h-screen sticky top-0 bg-white border-r border-[#eeeaf6] flex flex-col"
      >
        <div className="px-5 h-16 border-b border-[#eeeaf6] flex items-center">
          <a href="/" data-testid="sidebar-brand-logo" className="flex items-center">
            <img
              src={LOGO_URL}
              alt="Uplaud"
              className="h-9 w-auto object-contain mix-blend-multiply"
              style={{ maxWidth: 110 }}
            />
          </a>
        </div>

        {/* Workspace switcher */}
        <button
          data-testid="workspace-switcher"
          className="mx-3 mt-3 mb-4 px-3 py-2.5 rounded-xl border border-[#eeeaf6] hover:border-[#d9d1ee] flex items-center gap-3 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-[#261c4d] text-white flex items-center justify-center font-display text-[13px] font-semibold">
            {BRAND.logoInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-[#111827] leading-tight truncate">
              {BRAND.company}
            </div>
            <div className="text-[10.5px] text-[#9ca3af] font-mono truncate">
              {BRAND.vertical}
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-[#9ca3af] shrink-0" />
        </button>

        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {NAV.map((sec) => (
            <div key={sec.section} className="mb-4">
              <div className="px-3 py-1.5 flex items-baseline gap-2">
                <span className="text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
                  {sec.section}
                </span>
                {sec.hint && (
                  <span className="text-[9.5px] font-mono text-[#6d46c6] uppercase tracking-[0.14em]">
                    {sec.hint}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((it) => (
                  <NavItem key={it.to} {...it} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[#eeeaf6] p-3 space-y-1">
          <NavItem
            to="/business/settings"
            label="Settings"
            icon={Settings}
            testId="nav-settings"
          />
          <button
            data-testid="sidebar-logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-[#4b5563] hover:bg-[#faf9ff] transition-colors"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.75} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <Topbar user={user} pathname={loc.pathname} />
        <div data-testid="dashboard-content" className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, label, icon: Icon, testId }) {
  return (
    <NavLink
      to={to}
      data-testid={testId}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors ${
          isActive
            ? "bg-[#f5f3ff] text-[#261c4d] font-semibold"
            : "text-[#4b5563] hover:bg-[#faf9ff]"
        }`
      }
    >
      <Icon className="w-4 h-4" strokeWidth={1.75} />
      {label}
    </NavLink>
  );
}

function Topbar({ user, pathname }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  const titles = {
    "/business/insights": "Growth Engine",
    "/business/import": "Import",
    "/business/interactions": "Interactions",
    "/business/conversations": "Conversation Intelligence",
    "/business/reviews": "Reviews & Feedback",
    "/business/social": "Social Amplification",
    "/business/referrals": "Referral Engine",
    "/business/reddit": "Reddit Insertion",
    "/business/settings": "Settings",
  };

  const title = titles[pathname] || "Dashboard";

  return (
    <header
      data-testid="dashboard-topbar"
      className="h-16 px-8 border-b border-[#eeeaf6] bg-white/70 backdrop-blur-xl sticky top-0 z-40 flex items-center gap-6"
    >
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
          {BRAND.company}
        </div>
        <div className="text-[17px] font-display font-semibold text-[#111827] leading-tight">
          {title}
        </div>
      </div>

      <div className="flex-1 max-w-[520px]">
        <div className="relative">
          <Search className="w-4 h-4 text-[#9ca3af] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            data-testid="topbar-search-input"
            placeholder="Search reviews, campaigns, threads..."
            className="w-full h-10 pl-10 pr-4 rounded-full border border-[#eeeaf6] bg-[#faf9ff] text-[13px] focus:outline-none focus:border-[#d9d1ee] focus:bg-white transition-all"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          data-testid="topbar-new-campaign-btn"
          className="btn-primary h-10 !py-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          New campaign
        </button>
        <button
          data-testid="topbar-notifications-btn"
          className="w-10 h-10 rounded-full border border-[#eeeaf6] hover:border-[#d9d1ee] flex items-center justify-center relative transition-colors"
        >
          <Bell className="w-4 h-4 text-[#4b5563]" strokeWidth={1.75} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#5eead4]" />
        </button>
        <div
          data-testid="topbar-user-avatar"
          className="w-10 h-10 rounded-full bg-[#261c4d] text-white text-[12px] font-semibold flex items-center justify-center"
          title={user.name}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
