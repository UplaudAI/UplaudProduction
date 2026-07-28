import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Sparkles,
  Edit3,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Quote,
  Gift,
} from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import SocialAssetStudio from "@/components/business/SocialAssets";
import ReferFriends from "@/components/business/ReferFriends";
import { logEvent } from "@/lib/analytics";

const NAVY = "#0B1F3A";
const GOLD = "#E8B84B";
const PURPLE = "#6d46c6";
const BRAND_BLUE = "#3D5FCB";

function Wordmark({ light, brandName = "PayRewards" }) {
  const initial = brandName ? brandName.charAt(0).toUpperCase() : "P";
  return (
    <div
      data-testid="payrewards-logo"
      className="inline-flex items-center gap-2 font-display font-bold tracking-tight"
    >
      <div className="w-7 h-7 rounded-lg bg-[#3D5FCB] text-white flex items-center justify-center font-bold text-[13px] shrink-0 shadow-sm">
        {initial}
      </div>
      <span className={light ? "text-white" : "text-[#0B1F3A] font-display font-bold text-[16px] tracking-tight"}>
        {brandName}
      </span>
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
  const awaitingApproval = data?.status === "sent";
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
        <Wordmark light brandName="Uplaud" />
        <p className="mt-6 text-white/70">This testimonial link is invalid or has expired.</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f7f6f2]" data-testid="testimonial-page">
      {/* Top bar */}
      <header className="h-16 border-b border-[#eae6dc] bg-white flex items-center px-6 sm:px-10">
        <Wordmark brandName={data?.brand || "PayRewards"} />
        <span className="ml-auto text-[11px] font-mono text-[#9a9384] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: GOLD }} />
          Secure approval · powered by Uplaud
        </span>
      </header>

      <main className="max-w-[900px] mx-auto px-6 sm:px-10 py-12">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-[0.18em]" style={{ backgroundColor: "#fdf6e6", color: "#9a7b25" }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: GOLD }} />
              {approved
                ? "Approved & ready to share"
                : awaitingApproval
                  ? "A quick approval, on you"
                  : "Approval page not sent yet"}
          </span>
          <h1 className="mt-5 font-display text-[30px] sm:text-[38px] font-bold tracking-tight text-[#0B1F3A] leading-[1.1]">
            {approved
              ? "Thank you — let's make it fly."
              : awaitingApproval
                ? `${data.speaker_name ? data.speaker_name.split(" ")[0] + "," : "Hi,"} we drafted this from our chat.`
                : "This testimonial is still being prepared."}
          </h1>
          <p className="mt-3 text-[14px] text-[#5b5445] max-w-[560px] mx-auto leading-relaxed">
            {approved
              ? "Your testimonial is approved. Grab the branded assets below and share them in a couple of taps."
              : awaitingApproval
                ? "These are your own words from our conversation — nothing added, nothing published without your OK. Tweak anything that doesn't sound like you, then approve."
                : "The approval request has not been sent yet. Ask the sender to open this approval page from Uplaud or send the approval request first."}
          </p>
        </div>

        {/* Testimonial card */}
        <div className="mt-10 rounded-2xl border border-[#eae6dc] bg-white p-7 sm:p-9 shadow-sm relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-16 -right-12 w-[260px] h-[260px] rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, rgba(232,184,75,0.16), transparent 60%)` }}
          />
          <div className="flex items-center gap-2 mb-3">
            <Quote className="w-4 h-4" style={{ color: PURPLE }} />
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9a93b0]">Your testimonial</span>
          </div>
          <div className="rounded-xl bg-[#faf9ff] border border-[#eee7f7] p-5">
            {editing ? (
              <textarea
                data-testid="public-edit-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-[#eee7f7] bg-white px-3.5 py-2.5 text-[15px] leading-relaxed text-[#2b2340] focus:outline-none focus:border-[#6d46c6] resize-y"
              />
            ) : (
              <p
                data-testid="public-testimonial-text"
                className="text-[15px] sm:text-[16px] leading-relaxed text-[#2b2340] whitespace-pre-line"
              >
                &ldquo;{data.testimonial}&rdquo;
              </p>
            )}
          </div>
          <div className="mt-3 text-[11.5px] font-mono" style={{ color: PURPLE }}>
            — {attribution}
          </div>

          {awaitingApproval && (
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
                      logEvent("cancel_edit_click", { page: "testimonial", shareId });
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
                    onClick={() => {
                      setEditing(true);
                      logEvent("edit_wording_click", { page: "testimonial", shareId });
                    }}
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
          {!approved && !awaitingApproval && (
            <div className="mt-6 rounded-xl border border-[#f4e08a] bg-[#fef9c3]/60 px-4 py-3 text-[13px] leading-relaxed text-[#7c5c0a]">
              This testimonial is not awaiting approval yet. The sender needs to send the approval request from Uplaud first.
            </div>
          )}
        </div>

        {/* Branded assets + share (after approval) */}
        {approved && (
          <div className="mt-14 space-y-14">
            <div className="text-center">
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-[0.18em]"
                style={{ background: "#f0ebfb", color: "#6d46c6" }}
              >
                <Gift className="w-3.5 h-3.5" />
                Reward unlocked
              </span>
              <h2 className="mt-4 font-display text-[26px] sm:text-[32px] font-bold leading-tight" style={{ color: "#261c4d" }}>
                Share your testimonial in one of the following ways to earn your reward!
              </h2>
              <p className="mt-2 text-[14px] text-[#6b6480] max-w-[600px] mx-auto leading-relaxed">
                Pick whatever feels right — refer a friend who'd benefit, or post it to your own network. Every share helps, and unlocks your reward.
              </p>
            </div>
            <ReferFriends shareId={shareId} brand={data.brand || "PayRewards"} />
            <SocialAssetStudio
              quote={data.testimonial}
              attribution={attribution}
              company={data.brand || "PayRewards"}
              pov="customer"
              imageChannels={["instagram"]}
              publicUrl={publicUrl}
              shareId={shareId}
            />
          </div>
        )}
      </main>
    </div>
  );
}
