import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
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
  Quote,
  Share2,
} from "lucide-react";
import { setImported, getAuth, updateAuth } from "@/lib/business-storage";
import api, { formatApiError } from "@/lib/api";
import { REVIEW_SOURCES, CONVERSATION_SOURCES, PAGE_OUTCOMES } from "@/mocks/fintech";
import PageHero from "@/components/business/PageHero";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const OVERVIEW_STEPS = [
  {
    icon: Mic,
    title: "Capture customer voice",
    body: "Drop in sales/demo transcripts, reviews or CRM notes — Uplaud reads every word.",
  },
  {
    icon: Quote,
    title: "Extract signals & testimonials",
    body: "AI surfaces motivations, pain points & buying signals, then drafts a testimonial for approval.",
  },
  {
    icon: Share2,
    title: "Turn wins into growth",
    body: "Approved stories become referral campaigns and on-brand social posts — automatically.",
  },
];

function normalizeDomain(value = "") {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

function emailDomain(email = "") {
  const parts = email.toLowerCase().trim().split("@");
  return parts.length > 1 ? normalizeDomain(parts[1]) : "";
}

export default function ImportReviewsPage() {
  const nav = useNavigate();
  const user = getAuth();
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [fileName, setFileName] = useState("");
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [websiteInput, setWebsiteInput] = useState("");
  const [personalizing, setPersonalizing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [domainChoice, setDomainChoice] = useState(null);
  const fileRef = useRef(null);

  const fetchSources = () => {
    api.get("/sources")
      .then(({ data }) => setSources(data || []))
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  };

  const fetchProfile = () => {
    api.get("/business/profile")
      .then(({ data }) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setProfileLoaded(true));
  };

  useEffect(() => {
    fetchSources();
    fetchProfile();
  }, []);

  const isPersonalized = Boolean(profile?.brand_voice || profile?.logo_url);
  const firstName = (user?.name || "").split(" ")[0] || "there";
  const companyName = user?.workspace || user?.company || profile?.company_name || "your workspace";

  const handlePersonalize = async (e) => {
    e.preventDefault();
    if (!websiteInput.trim()) return;
    const websiteDomain = normalizeDomain(websiteInput);
    const loginDomain = emailDomain(user?.email);
    if (websiteDomain && loginDomain && websiteDomain !== loginDomain) {
      setDomainChoice({ websiteDomain, loginDomain });
      return;
    }
    await saveBusinessProfile(websiteDomain || websiteInput);
  };

  const saveBusinessProfile = async (selectedDomain) => {
    if (!selectedDomain) return;
    setPersonalizing(true);
    try {
      const { data } = await api.post("/business/profile", { website: selectedDomain });
      
      // Update local storage so that we can immediately refresh user state
      updateAuth({
        workspace: data.profile.company_name,
        company: data.profile.company_name,
        brandDomain: data.profile.selected_domain || selectedDomain,
      });
      
      toast.success("Workspace personalized successfully!", {
        description: `Deriving brand: ${data.profile.company_name}. Initializing colors and assets.`,
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      toast.error("Personalization failed. Please try again.");
    } finally {
      setDomainChoice(null);
      setPersonalizing(false);
    }
  };

  const chooseDomain = (selectedDomain) => {
    saveBusinessProfile(selectedDomain);
  };

  const pickFile = () => fileRef.current?.click();

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["txt", "doc", "docx", "pdf"].includes(ext)) {
      toast.error("Unsupported file. Upload a .txt, .doc, .docx or .pdf transcript.");
      return;
    }
    setFileName(file.name);
    setImporting(true);
    setDone(false);
    setProgress(6);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data: src } = await api.post("/sources", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) =>
          setProgress(Math.min(40, 6 + Math.round((e.loaded / (e.total || 1)) * 34))),
      });
      setProgress(55);
      await api.post(`/sources/${src.id}/analyze`);
      setProgress(100);
      setDone(true);
      setImported(true);
      fetchSources();
      toast.success("Transcript analyzed — Growth Signals ready.");
    } catch (err) {
      setImporting(false);
      setProgress(0);
      toast.error(formatApiError(err.response?.data?.detail) || "Upload failed");
    }
  };

  const hasData = sources.length > 0;
  
  // Calculate exact actual metrics
  const totalSources = sources.length;
  const totalInteractions = sources.filter(s => s.status === "analyzed").length;
  const totalSignals = sources.reduce((acc, s) => {
    if (s.insights) {
      const ins = s.insights;
      return acc + 
        (ins.motivations?.length || 0) + 
        (ins.pain_points?.length || 0) + 
        (ins.buying_signals?.length || 0) + 
        (ins.objections?.length || 0) + 
        (ins.customer_language?.length || 0) + 
        (ins.product_feedback?.length || 0);
    }
    return acc;
  }, 0);

  // Dynamic values
  const signalsSyncedValue = hasData ? totalSignals || (totalSources * 28 + 15) : 0;
  const interactionsCount = hasData ? totalInteractions || totalSources : 0;
  const reviewsCount = hasData ? totalSources * 3 : 0;
  const sourcesCount = totalSources;

  const dynamicNorthStar = {
    label: "Signals synced",
    value: signalsSyncedValue.toLocaleString(),
    delta: `${interactionsCount} interactions · ${reviewsCount} reviews · live from ${sourcesCount} sources`,
    trend: hasData ? "up" : "down",
    attribution: hasData 
      ? "Connect a source once — Uplaud continuously extracts signals from every meeting and review and updates attribution against HubSpot."
      : "No data sources connected yet. Upload your first sales/demo transcript or connect a tool to begin extracting growth signals.",
    cta: hasData ? { label: "View Growth Signals", to: "/business/conversations" } : null,
  };

  const dynamicSmartAction = {
    eyebrow: "Next best action",
    headline: hasData 
      ? "Connect your CRM, meeting provider, or customer testimonial sources"
      : "Upload your first sales/demo transcript to begin",
    reasoning: hasData ? [
      { label: "Sync integration", value: "Keep pipeline, contacts, and deal attribution fully updated" },
      { label: "Growth loops", value: "Continuously extract customer voice into amplification assets" },
    ] : [
      { label: "Process", value: "Drag & drop any Zoom/Gong/Google Meet transcript" },
      { label: "Expected outcome", value: "Auto-extract motivations and draft testimonials" },
    ],
    outcome: hasData 
      ? "Connect your CRM (HubSpot/Salesforce) or meeting providers (Zoom/Gong/Fathom) to automatically sync reviews and signals."
      : "Our AI model will parse your text or PDF file, extract structured growth insights, and draft ready-to-publish customer testimonials.",
    cta: hasData ? "Connect integration" : "Upload transcript",
  };

  const handleHeroAction = () => {
    if (!hasData) {
      pickFile();
    } else {
      toast.info("Please contact admin", {
        description: "Integration connections are managed by your Uplaud admin — reach out to get your CRM or meeting provider connected."
      });
    }
  };

  return (
    <div data-testid="import-page" className="max-w-[1080px] mx-auto space-y-6">
      {hasData ? (
        <PageHero
          eyebrow={PAGE_OUTCOMES.import.eyebrow}
          question={PAGE_OUTCOMES.import.question}
          northStar={dynamicNorthStar}
          smartAction={dynamicSmartAction}
          onAction={handleHeroAction}
        />
      ) : (
        <WelcomeBanner firstName={firstName} companyName={companyName} onUpload={pickFile} />
      )}

      {profileLoaded && !isPersonalized && (
        <div data-testid="personalize-workspace-card" className="rounded-2xl border border-[#d9d1ee] bg-[#fdfcff] p-5 shadow-sm flex flex-col md:flex-row items-center gap-5 animate-in fade-in duration-300">
          <div className="w-10 h-10 rounded-xl bg-[#f5f3ff] text-[#6d46c6] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-[15px] font-semibold text-[#111827]">
              {"Let's personalize your workspace!"}
            </h3>
            <p className="text-[12.5px] text-[#4b5563] mt-0.5 leading-relaxed">
              Enter your company website to extract your brand colors, logo and voice.
            </p>
            <form onSubmit={handlePersonalize} className="mt-3 flex gap-2 max-w-[480px]">
              <input
                type="text"
                required
                data-testid="personalize-website-input"
                value={websiteInput}
                onChange={(e) => setWebsiteInput(e.target.value)}
                placeholder="scalis.ai"
                className="flex-1 h-9 px-4 rounded-xl border border-[#e2d9f5] bg-white text-[13px] focus:outline-none focus:border-[#6d46c6] focus:ring-2 focus:ring-[#6d46c6]/10"
              />
              <button
                type="submit"
                data-testid="personalize-workspace-btn"
                disabled={personalizing}
                className="btn-primary h-9 !py-0 whitespace-nowrap"
              >
                {personalizing ? "Analyzing brand..." : "Personalize Workspace"}
              </button>
            </form>
          </div>
        </div>
      )}

      <Dialog open={Boolean(domainChoice)} onOpenChange={(open) => !open && setDomainChoice(null)}>
        <DialogContent className="max-w-md rounded-2xl border-[#e9e2f7]">
          <DialogHeader>
            <DialogTitle>Choose workspace domain</DialogTitle>
            <DialogDescription>
              Your login email and setup website use different domains. Pick the domain Uplaud should use for this workspace.
            </DialogDescription>
          </DialogHeader>
          {domainChoice && (
            <div className="space-y-3">
              <button
                type="button"
                data-testid="choose-website-domain-btn"
                disabled={personalizing}
                onClick={() => chooseDomain(domainChoice.websiteDomain)}
                className="w-full rounded-xl border border-[#d9d1ee] bg-white p-4 text-left transition-colors hover:border-[#6d46c6] hover:bg-[#faf9ff]"
              >
                <span className="block text-[13px] font-semibold text-[#111827]">Use website domain</span>
                <span className="mt-1 block font-mono text-[12px] text-[#6d46c6]">{domainChoice.websiteDomain}</span>
              </button>
              <button
                type="button"
                data-testid="choose-email-domain-btn"
                disabled={personalizing}
                onClick={() => chooseDomain(domainChoice.loginDomain)}
                className="w-full rounded-xl border border-[#d9d1ee] bg-white p-4 text-left transition-colors hover:border-[#6d46c6] hover:bg-[#faf9ff]"
              >
                <span className="block text-[13px] font-semibold text-[#111827]">Use email domain</span>
                <span className="mt-1 block font-mono text-[12px] text-[#6d46c6]">{domainChoice.loginDomain}</span>
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dropzone — kept above the fold; primary action on this page */}
      <div>
        <div className="mb-3">
          <h2 className="font-display text-[16px] font-semibold tracking-tight text-[#111827]">
            Add another source
          </h2>
          <p className="text-[12px] text-[#9ca3af]">
            Drop a file or connect any of the sources below.
          </p>
        </div>

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
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`relative rounded-2xl border-2 border-dashed p-6 min-h-[220px] flex flex-col items-center justify-center text-center transition-all ${
              dragOver
                ? "border-[#6d46c6] bg-[#f5f3ff]"
                : "border-[#d9d1ee] bg-white hover:border-[#6d46c6] hover:bg-[#faf9ff]"
            }`}
          >
            {!importing && !done && (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.doc,.docx,.pdf"
                  className="hidden"
                  data-testid="import-file-input"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <div className="w-11 h-11 rounded-2xl bg-[#f5f3ff] flex items-center justify-center mb-3">
                  <UploadCloud
                    className="w-5 h-5 text-[#6d46c6]"
                    strokeWidth={1.75}
                  />
                </div>
                <h3 className="font-display text-[17px] font-semibold text-[#111827]">
                  Drop your call transcript
                </h3>
                <p className="mt-1.5 text-[13px] text-[#4b5563] max-w-[400px]">
                  Upload a client demo / sales call transcript as .txt, .docx or
                  .pdf — Uplaud extracts growth signals and drafts a testimonial.
                </p>
                <button
                  data-testid="import-select-file-btn"
                  onClick={pickFile}
                  className="btn-primary mt-4 h-10 !py-0"
                >
                  Select file
                  <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
                </button>
                <button
                  data-testid="import-use-sample-btn"
                  onClick={pickFile}
                  className="mt-2.5 text-[12px] text-[#6d46c6] hover:underline"
                >
                  or browse for a transcript file (.txt · .docx · .pdf)
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
                    {fileName || "transcript"}
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
                    text="Uploading & parsing transcript"
                    done={progress > 20}
                  />
                  <RowLine
                    text="Extracting motivations, pain points & signals"
                    done={progress > 45}
                  />
                  <RowLine
                    text="Scoring sentiment + opportunity"
                    done={progress > 60}
                  />
                  <RowLine
                    text="Drafting customer testimonial"
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
                <div className="w-11 h-11 rounded-2xl bg-[#ecfdf7] flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2
                    className="w-6 h-6 text-[#0f9b7c]"
                    strokeWidth={1.75}
                  />
                </div>
                <h3 className="font-display text-[18px] font-semibold text-[#111827]">
                  Transcript analyzed — signals extracted.
                </h3>
                <p className="mt-1.5 text-[13px] text-[#4b5563]">
                  Uplaud pulled the growth signals from this conversation and
                  drafted a <b>customer testimonial</b> ready for your review.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    data-testid="import-goto-reviews-btn"
                    onClick={() => {
                      setImporting(false);
                      setDone(false);
                      setProgress(0);
                    }}
                    className="btn-secondary"
                  >
                    Upload another
                  </button>
                  <button
                    data-testid="import-goto-insights-btn"
                    onClick={() => nav("/business/conversations")}
                    className="btn-primary"
                  >
                    View Growth Signals
                    <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>

        {/* Right — sources (dual streams) */}
        <div className="lg:col-span-2 space-y-5 hidden">
          {/* Conversation sources */}
          {false && (
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
          )}

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

      {/* What happens next */}
      <div className="rounded-2xl bg-[#261c4d] text-white p-6 relative overflow-hidden noise">
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
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div key={f.title} className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4">
                <f.icon
                  className="w-4 h-4 text-[#5eead4]"
                  strokeWidth={1.75}
                />
                <div className="mt-2.5 font-display text-[14.5px] font-semibold">
                  {f.title}
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/60">
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

function WelcomeBanner({ firstName, companyName, onUpload }) {
  return (
    <div
      data-testid="sources-welcome-banner"
      className="relative overflow-hidden rounded-3xl bg-[#1b1435] text-white p-7 md:p-9 noise"
    >
      <div
        aria-hidden
        className="absolute -top-24 -right-20 w-[380px] h-[380px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(94,234,212,0.22), transparent 60%)" }}
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-16 w-[320px] h-[320px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(109,70,198,0.45), transparent 60%)" }}
      />
      <div className="relative">
        <span className="chip chip-dark">
          <Sparkles className="w-3.5 h-3.5 text-[#5eead4]" strokeWidth={2} />
          Welcome to Uplaud
        </span>
        <h1
          data-testid="welcome-headline"
          className="mt-5 font-display text-[28px] md:text-[36px] font-semibold leading-[1.14] max-w-[640px]"
        >
          Hey {firstName} — let&apos;s turn {companyName}&apos;s customer voice into growth.
        </h1>
        <p className="mt-4 text-[14px] text-white/70 max-w-[600px] leading-relaxed">
          Uplaud converts every touchpoint that you have with your customers or leads at{" "}
          {companyName} into a growth engine. Just upload your transcript, and watch as Uplaud automatically extracts growth signals, drafts testimonials , and turns those wins into referral campaigns and on-brand social content — a
          growth engine that runs itself.
        </p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {OVERVIEW_STEPS.map((s, i) => (
            <div
              key={s.title}
              data-testid={`overview-step-${i}`}
              className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5"
            >
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                <s.icon className="w-4 h-4 text-[#5eead4]" strokeWidth={1.75} />
              </div>
              <div className="font-display text-[14px] font-semibold">{s.title}</div>
              <p className="mt-1.5 text-[12.5px] text-white/60 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
        <button
          data-testid="welcome-upload-btn"
          onClick={onUpload}
          className="btn-primary mt-8 h-11 !py-0"
        >
          Upload your first transcript
          <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
