import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import OverviewTab from "@/components/app/OverviewTab";
import SourcesTab from "@/components/app/SourcesTab";
import GrowthSignalsTab from "@/components/app/GrowthSignalsTab";
import { LayoutDashboard, FolderUp, Sparkles, LogOut } from "lucide-react";

const NAV = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "sources", label: "Sources", icon: FolderUp },
  { key: "signals", label: "Growth Signals", icon: Sparkles },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [sources, setSources] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const refreshSources = useCallback(async () => {
    const res = await api.get("/sources");
    setSources(res.data);
    return res.data;
  }, []);

  useEffect(() => {
    refreshSources();
  }, [refreshSources]);

  const goSignals = (id) => {
    setSelectedId(id);
    setTab("signals");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col fixed h-screen" data-testid="app-sidebar">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-heading font-extrabold">U</div>
          <span className="font-heading font-bold tracking-tight text-slate-900">Uplaud</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              data-testid={`nav-${key}`}
              onClick={() => setTab(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                tab === key ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
              {user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="mt-1 w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-64">
        <header className="h-16 sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-slate-200 flex items-center justify-between px-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-slate-400">Growth Engine · PayRewards</p>
            <h1 className="font-heading text-lg font-bold tracking-tight text-slate-900 -mt-0.5">
              {NAV.find((n) => n.key === tab)?.label}
            </h1>
          </div>
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
            Demo workspace
          </span>
        </header>

        <main className="p-8 animate-fade-up" key={tab}>
          {tab === "overview" && <OverviewTab sources={sources} onGoSignals={goSignals} setTab={setTab} />}
          {tab === "sources" && (
            <SourcesTab sources={sources} refreshSources={refreshSources} onAnalyze={goSignals} />
          )}
          {tab === "signals" && (
            <GrowthSignalsTab
              sources={sources}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              refreshSources={refreshSources}
              user={user}
            />
          )}
        </main>
      </div>
    </div>
  );
}
