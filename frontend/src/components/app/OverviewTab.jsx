import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Sparkles, ArrowUpRight, FileText } from "lucide-react";

const KPIS = [
  { label: "Prospects", value: "388", delta: "+12%" },
  { label: "Warm intros", value: "94", delta: "+8%" },
  { label: "New customers", value: "21", delta: "+5%" },
  { label: "Demo → prospect", value: "60%", delta: "+4%" },
  { label: "Testimonial approved", value: "44%", delta: "+9%" },
  { label: "Warm intro delivered", value: "27%", delta: "+3%" },
];

export default function OverviewTab({ sources, onGoSignals, setTab }) {
  const analyzed = sources.filter((s) => s.status === "analyzed");
  return (
    <div className="space-y-8" data-testid="overview-tab">
      <div className="max-w-2xl">
        <h2 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900">
          Every interaction is a growth asset waiting to compound.
        </h2>
        <p className="text-slate-500 mt-2 text-sm leading-relaxed">
          Pre-customer to advocate. One continuous engine, sitting on top of your paid acquisition.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {KPIS.map((k) => (
          <Card key={k.label} className="p-4 border-slate-200 shadow-sm hover:shadow-md transition-shadow" data-testid={`kpi-${k.label}`}>
            <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-slate-400">{k.label}</p>
            <div className="flex items-end justify-between mt-2">
              <span className="font-heading text-2xl font-bold text-slate-900">{k.value}</span>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="h-3 w-3" />{k.delta}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-bold text-slate-900">Recent sources</h3>
            <Button variant="ghost" size="sm" onClick={() => setTab("sources")} data-testid="overview-view-sources">
              Manage sources
            </Button>
          </div>
          {sources.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-400 mt-3">No transcripts yet. Upload one in Sources to get started.</p>
              <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700" size="sm" onClick={() => setTab("sources")} data-testid="overview-upload-cta">
                Upload transcript
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sources.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  onClick={() => onGoSignals(s.id)}
                  className="w-full flex items-center justify-between p-3 rounded-md border border-slate-100 hover:bg-slate-50 transition-colors text-left"
                  data-testid={`overview-source-${s.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{s.client_name}</p>
                      <p className="text-xs text-slate-400 truncate">{s.filename} · {s.word_count} words</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.status === "analyzed" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    {s.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 border-slate-200 shadow-sm bg-indigo-600 text-white">
          <Sparkles className="h-6 w-6" />
          <h3 className="font-heading text-lg font-bold mt-3">Growth Signals</h3>
          <p className="text-indigo-100/90 text-sm mt-1 leading-relaxed">
            {analyzed.length > 0
              ? `${analyzed.length} conversation${analyzed.length > 1 ? "s" : ""} analyzed with AI insights & testimonial drafts ready.`
              : "Turn a demo call transcript into insights and an auto-drafted testimonial."}
          </p>
          <Button
            onClick={() => setTab("signals")}
            className="mt-5 bg-white text-indigo-700 hover:bg-indigo-50"
            size="sm"
            data-testid="overview-open-signals"
          >
            <TrendingUp className="h-4 w-4 mr-1" /> Open Growth Signals
          </Button>
        </Card>
      </div>
    </div>
  );
}
