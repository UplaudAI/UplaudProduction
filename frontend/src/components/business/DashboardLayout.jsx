import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import api from "@/lib/api";
import {
  Upload,
  MessagesSquare,
  Megaphone,
  Users,
  Ghost,
  LineChart,
  Calculator,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  Radio,
  Mic,
} from "lucide-react";
import { getAuth, clearAuth } from "@/lib/business-storage";
import { BRAND } from "@/mocks/fintech";

const LOGO_URL =
  "https://customer-assets-gfyr7b9c.emergentagent.net/job_ai-acquisition-hub-2/artifacts/24zfs0md_logo_white_background.webp";

const NAV = [
  {
    section: "Business Impact",
    items: [
      { to: "/business/roi-simulator", label: "ROI Simulator", icon: Calculator, testId: "nav-roi" },
      { to: "/business/referrals", label: "Warm Pipeline", icon: Users, testId: "nav-referrals" },
    ],
  },
  {
    section: "Pre-Customer Growth",
    items: [
      { to: "/business/conversations", label: "Growth Signals", icon: Mic, testId: "nav-conversations" },
    ],
  },
  {
    section: "Amplification",
    items: [
      { to: "/business/social", label: "Growth Amplification", icon: Megaphone, testId: "nav-social" },
    ],
  },
  {
    section: "Data",
    items: [
      { to: "/business/import", label: "Sources", icon: Upload, testId: "nav-import" },
    ],
  },
];

export default function DashboardLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const [user, setUser] = useState(getAuth());
  const [sources, setSources] = useState([]);

  useEffect(() => {
    const handler = () => {
      setUser(getAuth());
    };
    window.addEventListener("auth_change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("auth_change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  const zeroStateChecked = useRef(false);

  useEffect(() => {
    if (!user) {
      nav("/business", { replace: true });
    }
  }, [user, nav]);

  // Only redirect brand-new (zero-source) users to Sources ONCE, right after login —
  // not on every subsequent navigation, otherwise the app would keep bouncing a user
  // back to Sources whenever they try to visit any other page.
  useEffect(() => {
    if (user && !zeroStateChecked.current) {
      zeroStateChecked.current = true;
      api.get("/sources")
        .then(({ data }) => {
          setSources(data || []);
          if (!data || data.length === 0) {
            const permittedPaths = ["/business/import", "/business/settings", "/business/roi-simulator", "/business"];
            if (!permittedPaths.includes(loc.pathname)) {
              nav("/business/import", { replace: true });
            }
          }
        })
        .catch(() => {});
    }
  }, [user, loc.pathname, nav]);

  const handleLogout = () => {
    clearAuth();
    nav("/business", { replace: true });
  };

  if (!user) return null;

  const businessName = user.workspace || user.company || "My Company";
  const logoInitial = businessName ? businessName.charAt(0).toUpperCase() : "M";

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
            {logoInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-[#111827] leading-tight truncate">
              {businessName}
            </div>
            <div className="text-[10.5px] text-[#9ca3af] font-mono truncate">
              B2B SaaS Workspace
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-[#9ca3af] shrink-0" />
        </button>

        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {NAV.map((sec) => (
            <div key={sec.section} className="mb-4">
              <div className="px-3 py-1.5 text-[10.5px] font-mono uppercase tracking-[0.18em] text-[#9ca3af]">
                {sec.section}
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
        <div data-testid="dashboard-content" className="px-12 py-12 max-w-[1360px]">
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
    "/business/insights": "Growth Overview",
    "/business/roi-simulator": "ROI Simulator",
    "/business/import": "Data Sources",
    "/business/interactions": "Untapped Opportunities",
    "/business/conversations": "Growth Signals",
    "/business/reviews": "Trust Assets",
    "/business/social": "Growth Amplification",
    "/business/referrals": "Warm Pipeline",
    "/business/reddit": "High-Intent Demand",
    "/business/settings": "Settings",
  };

  const title = titles[pathname] || "Dashboard";

  return (
    <header
      data-testid="dashboard-topbar"
      className="h-16 px-8 border-b border-[#eeeaf6] bg-white/80 backdrop-blur-xl sticky top-0 z-40 flex items-center gap-6"
    >
      <div
        data-testid="topbar-title"
        className="text-[14px] font-display font-semibold text-[#111827]"
      >
        {title}
      </div>
      <span className="text-[11px] font-mono text-[#9ca3af]">
        {user?.workspace || user?.company || "My Company"}
      </span>

      <div className="ml-auto flex items-center gap-3">
        <button
          data-testid="topbar-notifications-btn"
          className="w-10 h-10 rounded-full hover:bg-[#faf9ff] flex items-center justify-center transition-colors"
        >
          <Bell className="w-4 h-4 text-[#4b5563]" strokeWidth={1.75} />
        </button>
        <div
          data-testid="topbar-user-avatar"
          className="w-9 h-9 rounded-full bg-[#261c4d] text-white text-[12px] font-semibold flex items-center justify-center"
          title={user.name}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
