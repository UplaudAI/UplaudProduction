import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import {
  Sparkles,
  Edit3,
  CheckCircle2,
  ShieldCheck,
  Linkedin,
  Twitter,
  Share2,
  Download,
  Link2,
  Loader2,
  Quote,
  Star,
} from "lucide-react";
import api, { formatApiError } from "@/lib/api";

const NAVY = "#0B1F3A";
const GOLD = "#E8B84B";

function Wordmark({ light }) {
  return (
    <div className="inline-flex items-center gap-1.5 font-display font-bold tracking-tight">
      <span
        className="w-6 h-6 rounded-md flex items-center justify-center text-[13px]"
        style={{ backgroundColor: GOLD, color: NAVY }}
      >
        P
      </span>
      <span className={light ? "text-white" : "text-[#0B1F3A]"}>
        Pay<span style={{ color: GOLD }}>Rewards</span>
      </span>
    </div>
  );
}

/* A branded, exportable social asset card (CSS-only so export is always reliable) */
function AssetCard({ innerRef, square, quote, attribution }) {
  return (
    <div
      ref={innerRef}
      className="relative overflow-hidden shrink-0"
      style={{
        width: square ? 400 : 560,
        height: square ? 400 : 373,
        backgroundColor: NAVY,
        backgroundImage:
          "radial-gradient(circle at 88% 8%, rgba(232,184,75,0.28), transparent 45%), radial-gradient(circle at 6% 96%, rgba(232,184,75,0.10), transparent 40%)",
      }}
    >
      {/* gold frame */}
      <div
        className="absolute inset-4 rounded-lg pointer-events-none"
        style={{ border: `1px solid rgba(232,184,75,0.35)` }}
      />
      <div className="relative h-full w-full flex flex-col justify-between p-8">
        <div className="flex items-center justify-between">
          <Wordmark light />
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="w-3.5 h-3.5" style={{ color: GOLD, fill: GOLD }} />
            ))}
          </div>
        </div>

        <div>
          <Quote className="w-8 h-8 mb-2" style={{ color: GOLD }} />
          <p
            className="font-display text-white leading-snug"
            style={{ fontSize: square ? 19 : 21, fontWeight: 600 }}
          >
            {quote.length > (square ? 210 : 230)
              ? quote.slice(0, square ? 207 : 227) + "…"
              : quote}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[12px]" style={{ color: GOLD, fontFamily: "monospace" }}>
            — {attribution}
          </div>
          <div className="text-[10px] text-white/45" style={{ fontFamily: "monospace" }}>
            payrewards.com
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialPage() {
  const { shareId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const liRef = useRef(null);
  const igRef = useRef(null);

  useEffect(() => {
    api
      .get(`/public/testimonial/${shareId}`)
      .then((res) => {
        setData(res.data);
        setText(res.data.testimonial);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [shareId]);

  const attribution = data
    ? [data.speaker_name, data.speaker_role, data.company_name].filter(Boolean).join(", ")
    : "";
  const approved = data?.status === "approved";
  const publicUrl = typeof window !== "undefined" ? window.location.href : "";

  const saveEdit = async () => {
    setBusy(true);
    try {
      const res = await api.put(`/public/testimonial/${shareId}`, { testimonial_draft: text });
      setData(res.data);
      setEditing(false);
      toast.success("Your edits were saved");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    setBusy(true);
    try {
      const res = await api.post(`/public/testimonial/${shareId}/approve`);
      setData(res.data);
      toast.success("Approved — thank you! Your share assets are ready.");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Could not approve");
    } finally {
      setBusy(false);
    }
  };

  const exportCard = async (ref) => {
    return toPng(ref.current, { pixelRatio: 2, cacheBust: true });
  };

  const downloadCard = async (ref, name) => {
    try {
      const url = await exportCard(ref);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      toast.success("Image downloaded");
    } catch {
      toast.error("Could not generate image");
    }
  };

  const shareTray = async (ref, name) => {
    try {
      if (ref?.current && navigator.canShare) {
        const url = await exportCard(ref);
        const blob = await (await fetch(url)).blob();
        const file = new File([blob], name, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "PayRewards", text: data.testimonial });
          return;
        }
      }
      if (navigator.share) {
        await navigator.share({ title: "PayRewards testimonial", text: data.testimonial, url: publicUrl });
        return;
      }
      toast.info("Sharing isn't supported here — use Download and post it manually.");
    } catch {
      /* user cancelled */
    }
  };

  const shareLinkedIn = () =>
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`,
      "_blank",
      "noopener,width=680,height=640"
    );
  const shareX = () =>
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `"${data.testimonial}" — via PayRewards`
      )}&url=${encodeURIComponent(publicUrl)}`,
      "_blank",
      "noopener,width=680,height=640"
    );
  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Link copied");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: NAVY }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: GOLD }} />
      </div>
    );

  if (notFound || !data)
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-center px-6"
        style={{ backgroundColor: NAVY }}
      >
        <Wordmark light />
        <p className="mt-6 text-white/70">This testimonial link is invalid or has expired.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f7f6f2]" data-testid="testimonial-page">
      {/* Top bar */}
      <header className="h-16 border-b border-[#eae6dc] bg-white flex items-center px-6 sm:px-10">
        <Wordmark />
        <span className="ml-auto text-[11px] font-mono text-[#9a9384] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: GOLD }} />
          Secure approval · powered by Uplaud
        </span>
      </header>

      <main className="max-w-[860px] mx-auto px-6 sm:px-10 py-12">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-[0.18em]" style={{ backgroundColor: "#fdf6e6", color: "#9a7b25" }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: GOLD }} />
            {approved ? "Approved & ready to share" : "A quick approval, on you"}
          </span>
          <h1 className="mt-5 font-display text-[30px] sm:text-[38px] font-bold tracking-tight text-[#0B1F3A] leading-[1.1]">
            {approved
              ? "Thank you — let's make it fly."
              : `${data.speaker_name ? data.speaker_name.split(" ")[0] + "," : "Hi,"} we drafted this from our chat.`}
          </h1>
          <p className="mt-3 text-[14px] text-[#5b5445] max-w-[560px] mx-auto leading-relaxed">
            {approved
              ? "Your testimonial is approved. Grab the branded assets below and share them in a couple of taps."
              : "Nothing gets published without your OK. Read it, tweak anything that doesn't sound like you, then approve."}
          </p>
        </div>

        {/* Testimonial card */}
        <div className="mt-10 rounded-2xl border border-[#eae6dc] bg-white p-7 sm:p-9 shadow-sm relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-16 -right-12 w-[260px] h-[260px] rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, rgba(232,184,75,0.16), transparent 60%)` }}
          />
          <Quote className="w-9 h-9" style={{ color: GOLD }} />
          {editing ? (
            <textarea
              data-testid="public-edit-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="mt-3 w-full rounded-xl border border-[#eae6dc] bg-[#faf9f5] px-4 py-3 text-[17px] leading-relaxed text-[#0B1F3A] focus:outline-none focus:border-[#E8B84B] font-display resize-y"
            />
          ) : (
            <blockquote
              data-testid="public-testimonial-text"
              className="mt-3 font-display text-[20px] sm:text-[24px] leading-[1.4] text-[#0B1F3A] font-semibold whitespace-pre-line"
            >
              &ldquo;{data.testimonial}&rdquo;
            </blockquote>
          )}
          <div className="mt-5 text-[13px] font-mono" style={{ color: "#9a7b25" }}>
            — {attribution}
          </div>

          {!approved && (
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {editing ? (
                <>
                  <button
                    data-testid="public-save-btn"
                    onClick={saveEdit}
                    disabled={busy}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full font-semibold text-[14px] text-white disabled:opacity-60 transition-transform hover:-translate-y-[1px]"
                    style={{ backgroundColor: NAVY }}
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Save edits
                  </button>
                  <button
                    data-testid="public-cancel-btn"
                    onClick={() => {
                      setText(data.testimonial);
                      setEditing(false);
                    }}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full font-medium text-[14px] text-[#5b5445] border border-[#eae6dc] hover:bg-[#faf9f5]"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    data-testid="public-approve-btn"
                    onClick={approve}
                    disabled={busy}
                    className="inline-flex items-center gap-2 h-11 px-6 rounded-full font-semibold text-[14px] disabled:opacity-60 transition-transform hover:-translate-y-[1px]"
                    style={{ backgroundColor: GOLD, color: NAVY }}
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Approve &amp; publish
                  </button>
                  <button
                    data-testid="public-edit-btn"
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-2 h-11 px-5 rounded-full font-medium text-[14px] text-[#0B1F3A] border border-[#dcd6c8] hover:bg-[#faf9f5]"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit wording
                  </button>
                </>
              )}
            </div>
          )}
          {approved && (
            <div className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium" style={{ color: "#0f9b7c" }}>
              <CheckCircle2 className="w-4 h-4" />
              Approved{data.approved_at ? ` on ${new Date(data.approved_at).toLocaleDateString()}` : ""}
            </div>
          )}
        </div>

        {/* Assets + share (after approval) */}
        {approved && (
          <section className="mt-14" data-testid="share-assets">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
              <h2 className="font-display text-[20px] font-semibold text-[#0B1F3A]">
                Your branded share assets
              </h2>
            </div>
            <p className="text-[13px] text-[#5b5445] mt-1">
              Post-ready visuals with PayRewards branding. Share to your network in a couple of taps.
            </p>

            <div className="mt-7 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LinkedIn / landscape */}
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9a9384] mb-2">
                  LinkedIn · 1200×800
                </div>
                <div className="rounded-xl overflow-hidden border border-[#eae6dc] shadow-sm inline-block max-w-full">
                  <div className="origin-top-left" style={{ transform: "scale(1)" }}>
                    <AssetCard innerRef={liRef} quote={data.testimonial} attribution={attribution} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ShareBtn testId="share-linkedin" icon={Linkedin} label="Share on LinkedIn" onClick={shareLinkedIn} />
                  <ShareBtn testId="download-linkedin" icon={Download} label="Download" onClick={() => downloadCard(liRef, "payrewards-linkedin.png")} outline />
                </div>
              </div>

              {/* Instagram / square */}
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9a9384] mb-2">
                  Instagram · 1080×1080
                </div>
                <div className="rounded-xl overflow-hidden border border-[#eae6dc] shadow-sm inline-block max-w-full">
                  <AssetCard innerRef={igRef} square quote={data.testimonial} attribution={attribution} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ShareBtn testId="share-instagram" icon={Share2} label="Share to Instagram" onClick={() => shareTray(igRef, "payrewards-instagram.png")} />
                  <ShareBtn testId="download-instagram" icon={Download} label="Download" onClick={() => downloadCard(igRef, "payrewards-instagram.png")} outline />
                </div>
              </div>
            </div>

            {/* Global share tray */}
            <div className="mt-10 rounded-2xl p-6 flex flex-wrap items-center gap-3" style={{ backgroundColor: NAVY }}>
              <div className="text-white">
                <div className="font-display font-semibold">Share everywhere</div>
                <div className="text-[12px] text-white/60">Open your device share tray or post directly.</div>
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                <TrayBtn testId="share-x" icon={Twitter} label="X" onClick={shareX} />
                <TrayBtn testId="share-linkedin-2" icon={Linkedin} label="LinkedIn" onClick={shareLinkedIn} />
                <TrayBtn testId="share-tray" icon={Share2} label="Share tray" onClick={() => shareTray(liRef, "payrewards.png")} />
                <TrayBtn testId="copy-link" icon={Link2} label="Copy link" onClick={copyLink} />
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ShareBtn({ testId, icon: Icon, label, onClick, outline }) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-[13px] font-medium transition-transform hover:-translate-y-[1px] ${
        outline
          ? "border border-[#dcd6c8] text-[#0B1F3A] hover:bg-[#faf9f5]"
          : "text-white"
      }`}
      style={outline ? {} : { backgroundColor: "#0B1F3A" }}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function TrayBtn({ testId, icon: Icon, label, onClick }) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-[13px] font-medium text-[#0B1F3A] transition-transform hover:-translate-y-[1px]"
      style={{ backgroundColor: GOLD }}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
