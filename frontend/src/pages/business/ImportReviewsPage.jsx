import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowUpRight,
  Plus,
  Mic,
  MessagesSquare,
} from "lucide-react";
import { setImported } from "@/lib/business-storage";
import { REVIEW_SOURCES, CONVERSATION_SOURCES } from "@/mocks/fintech";

export default function ImportReviewsPage() {
  const nav = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const runImport = () => {
    setImporting(true);
    setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(iv);
          setDone(true);
          setImported(true);
          return 100;
        }
        return p + 4;
      });
    }, 60);
  };

  return (
    <div data-testid="import-page" className="max-w-[1080px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <span className="chip">
            <span className="dot" />
            Zero-state · Let's activate your customer data
          </span>
          <h1 className="font-display text-[36px] leading-[1.05] font-semibold tracking-tight text-[#111827] mt-4">
            Import interactions to <span className="mint-underline">wake the Growth Engine</span>.
          </h1>
          <p className="mt-3 max-w-[620px] text-[15px] leading-relaxed text-[#4b5563]">
            Uplaud reads two streams: your <b>interactions</b> (demos, trials,
            QBRs — via Zoom AI, Gong, Fireflies) and your <b>customer feedback</b>{" "}
            (G2, Capterra, Google, CSV). Every one becomes a signal your agents
            can activate.
          </p>
        </div>
      </div>

      {/* Dropzone + sources grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Dropzone */}
        <div className="lg:col-span-3">
          <div
            data-testid="import-dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              runImport();
            }}
            className={`relative rounded-2xl border-2 border-dashed p-10 min-h-[380px] flex flex-col items-center justify-center text-center transition-all ${
              dragOver
                ? "border-[#6d46c6] bg-[#f5f3ff]"
                : "border-[#d9d1ee] bg-white hover:border-[#6d46c6] hover:bg-[#faf9ff]"
            }`}
          >
            {!importing && !done && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#f5f3ff] flex items-center justify-center mb-5">
                  <UploadCloud
                    className="w-7 h-7 text-[#6d46c6]"
                    strokeWidth={1.75}
                  />
                </div>
                <h3 className="font-display text-[20px] font-semibold text-[#111827]">
                  Drop your reviews CSV
                </h3>
                <p className="mt-2 text-[13.5px] text-[#4b5563] max-w-[400px]">
                  Accepts CSV, XLSX, or JSON exports from Google, Trustpilot,
                  Yelp, Zendesk, Intercom or app stores.
                </p>
                <button
                  data-testid="import-select-file-btn"
                  onClick={runImport}
                  className="btn-primary mt-6"
                >
                  Select file
                  <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
                </button>
                <button
                  data-testid="import-use-sample-btn"
                  onClick={runImport}
                  className="mt-3 text-[12.5px] text-[#6d46c6] hover:underline"
                >
                  or use our sample PayRewards dataset (1,521 interactions · 687 reviews)
                </button>
              </>
            )}

            {importing && !done && (
              <div className="w-full max-w-[420px]">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet
                    className="w-5 h-5 text-[#6d46c6]"
                    strokeWidth={1.75}
                  />
                  <div className="text-[13.5px] font-mono text-[#111827]">
                    westgate_reviews_2026.csv
                  </div>
                  <div className="ml-auto text-[11.5px] font-mono text-[#6d46c6]">
                    {progress}%
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[#eeeaf6] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#6d46c6] to-[#5eead4] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-5 space-y-1.5 text-[12px] font-mono text-[#4b5563]">
                  <RowLine
                    text="Parsed 687 rows"
                    done={progress > 20}
                  />
                  <RowLine
                    text="Detected schema (customer, rating, body, date)"
                    done={progress > 40}
                  />
                  <RowLine
                    text="Enriching sentiment + topic tags"
                    done={progress > 60}
                  />
                  <RowLine
                    text="Scoring agent-worthiness"
                    done={progress > 80}
                  />
                  <RowLine text="Ready" done={progress >= 100} />
                </div>
              </div>
            )}

            {done && (
              <div
                data-testid="import-success"
                className="text-center max-w-[420px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#ecfdf7] flex items-center justify-center mx-auto mb-5">
                  <CheckCircle2
                    className="w-8 h-8 text-[#0f9b7c]"
                    strokeWidth={1.75}
                  />
                </div>
                <h3 className="font-display text-[22px] font-semibold text-[#111827]">
                  1,521 interactions · 687 reviews imported.
                </h3>
                <p className="mt-2 text-[13.5px] text-[#4b5563]">
                  Agents have flagged <b>253 demo attendees</b> awaiting
                  activation and <b>38 stories ready for approval</b>.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    data-testid="import-goto-reviews-btn"
                    onClick={() => nav("/business/reviews")}
                    className="btn-secondary"
                  >
                    View reviews
                  </button>
                  <button
                    data-testid="import-goto-insights-btn"
                    onClick={() => nav("/business/insights")}
                    className="btn-primary"
                  >
                    Go to Insights
                    <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — sources (dual streams) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Conversation sources */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mic className="w-3.5 h-3.5 text-[#6d46c6]" strokeWidth={1.75} />
              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#4b5563]">
                Conversations
              </div>
            </div>
            <div className="space-y-2">
              {CONVERSATION_SOURCES.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  data-testid={`source-card-${s.id}`}
                  className="rounded-xl border border-[#eeeaf6] bg-white p-3 hover:border-[#d9d1ee] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-semibold"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.label[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold text-[#111827] leading-tight">
                        {s.label}
                      </div>
                      <div className="text-[10.5px] font-mono text-[#9ca3af] mt-0.5">
                        {s.connected
                          ? `${s.syncs} synced`
                          : "Not connected"}
                      </div>
                    </div>
                    {s.connected ? (
                      <span className="text-[10px] font-mono text-[#0f9b7c] bg-[#ecfdf7] border border-[#c8f0e4] rounded-full px-2 py-0.5">
                        live
                      </span>
                    ) : (
                      <button
                        data-testid={`source-connect-${s.id}`}
                        className="text-[11px] font-medium text-[#6d46c6] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" strokeWidth={2} />
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review sources */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessagesSquare
                className="w-3.5 h-3.5 text-[#6d46c6]"
                strokeWidth={1.75}
              />
              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#4b5563]">
                Customer feedback
              </div>
            </div>
            <div className="space-y-2">
              {REVIEW_SOURCES.map((s) => (
                <div
                  key={s.id}
                  data-testid={`source-card-${s.id}`}
                  className="rounded-xl border border-[#eeeaf6] bg-white p-3 hover:border-[#d9d1ee] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-semibold"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.label[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold text-[#111827] leading-tight">
                        {s.label}
                      </div>
                      <div className="text-[10.5px] font-mono text-[#9ca3af] mt-0.5">
                        {s.connected
                          ? `${s.count} reviews synced`
                          : "Not connected"}
                      </div>
                    </div>
                    {s.connected ? (
                      <span className="text-[10px] font-mono text-[#0f9b7c] bg-[#ecfdf7] border border-[#c8f0e4] rounded-full px-2 py-0.5">
                        live
                      </span>
                    ) : (
                      <button
                        data-testid={`source-connect-${s.id}`}
                        className="text-[11px] font-medium text-[#6d46c6] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" strokeWidth={2} />
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* What happens next */}
      <div className="rounded-2xl bg-[#261c4d] text-white p-8 relative overflow-hidden noise">
        <div
          aria-hidden
          className="absolute -top-24 -right-16 w-[380px] h-[380px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(94,234,212,0.22), transparent 60%)",
          }}
        />
        <div className="relative">
          <span className="chip chip-dark">
            <Sparkles className="w-3.5 h-3.5 text-[#5eead4]" strokeWidth={2} />
            What happens the moment you hit import
          </span>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Sentiment + topic tagging",
                body:
                  "Every review is auto-tagged with sentiment, topic and agent-worthiness so nothing hides in a spreadsheet.",
              },
              {
                icon: Sparkles,
                title: "Agentic recommendations",
                body:
                  "Each 5★ gets its own action queue: turn into a post, trigger referral, insert into Reddit, add to ad copy.",
              },
              {
                icon: CheckCircle2,
                title: "Continuous refresh",
                body:
                  "Once connected, new reviews flow in automatically and re-score against your campaigns hourly.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
                <f.icon
                  className="w-5 h-5 text-[#5eead4]"
                  strokeWidth={1.75}
                />
                <div className="mt-3 font-display text-[16px] font-semibold">
                  {f.title}
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-white/60">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RowLine({ text, done }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2
        className={`w-3.5 h-3.5 ${
          done ? "text-[#0f9b7c]" : "text-[#d9d1ee]"
        }`}
        strokeWidth={2}
      />
      <span className={done ? "text-[#111827]" : "text-[#9ca3af]"}>
        {text}
      </span>
    </div>
  );
}
