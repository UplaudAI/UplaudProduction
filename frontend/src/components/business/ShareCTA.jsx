import { useState } from "react";
import axios from "axios";
import { Send, MessageCircle, Sparkles, Check } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const EMOJIS = ["🔥", "😍", "🙂", "😐", "😕"];

export default function ShareCTA({ slug, businessName }) {
  const [form, setForm] = useState({ reviewer_name: "", rating: 5, emoji: "🔥", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!form.reviewer_name.trim() || !form.text.trim()) {
      setError("Please share your name and a few words.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await axios.post(`${API}/business/${slug}/reviews`, form);
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="share" className="max-w-[1320px] mx-auto px-6 lg:px-10 py-10 lg:py-14" data-testid="share-section">
      <div
        className="relative rounded-[28px] overflow-hidden p-8 lg:p-14 grid lg:grid-cols-12 gap-10 items-center"
        style={{
          background: "linear-gradient(135deg, #0B0B10 0%, #1A1A22 50%, #2E245C 100%)",
        }}
      >
        {/* Decorative accents */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(closest-side, #7CE8C8, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -right-24 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(closest-side, #5B3EEE, transparent 70%)" }}
        />

        <div className="lg:col-span-6 relative text-white">
          <span
            className="u-pill mb-5"
            style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)", color: "white" }}
          >
            <span className="u-pill-dot" /> 05 · your turn
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.05]">
            Used <span className="font-serif-italic text-[color:var(--u-mint)]">{businessName}</span>?<br />
            30 seconds. One story. Real impact.
          </h2>
          <p className="mt-5 text-white/70 max-w-md text-[15px] leading-relaxed">
            Your words become someone else&apos;s confidence. Every review helps a future buyer decide — and quietly builds the trust engine behind this brand.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out ${businessName} — real reviews on Uplaud`)}`}
              target="_blank"
              rel="noreferrer"
              className="u-btn"
              style={{ background: "#7CE8C8", color: "#0B0B10" }}
              data-testid="share-whatsapp-btn"
            >
              <MessageCircle size={16} /> Share on WhatsApp
            </a>
            <span className="inline-flex items-center gap-2 text-xs text-white/60">
              <Sparkles size={14} className="text-[color:var(--u-mint)]" /> Powered by Uplaud
            </span>
          </div>
        </div>

        <div className="lg:col-span-6 relative">
          {submitted ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
              data-testid="share-success"
            >
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "#7CE8C8", color: "#0B0B10" }}>
                <Check size={26} />
              </div>
              <h3 className="font-display text-2xl font-semibold text-white">Thank you. Truly.</h3>
              <p className="mt-3 text-white/70 text-sm max-w-sm mx-auto">
                Your review is queued for verification and will appear here shortly. If you know someone who could use {businessName}, share it below.
              </p>
              <button
                onClick={() => { setSubmitted(false); setForm({ reviewer_name: "", rating: 5, emoji: "🔥", text: "" }); }}
                className="u-btn u-btn-ghost mt-6"
                style={{ color: "white", borderColor: "rgba(255,255,255,0.2)" }}
                data-testid="share-another-btn"
              >
                Share another story
              </button>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="rounded-2xl p-6 lg:p-7"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}
              data-testid="share-form"
            >
              <div className="grid gap-4">
                <input
                  type="text"
                  placeholder="Your name"
                  value={form.reviewer_name}
                  onChange={(e) => setForm({ ...form, reviewer_name: e.target.value })}
                  data-testid="share-name-input"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 outline-none focus:border-[color:var(--u-mint)] transition"
                />

                <div>
                  <label className="text-xs text-white/60 mb-2 block uppercase tracking-wider">How was it?</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {EMOJIS.map((e, i) => (
                      <button
                        key={e}
                        type="button"
                        data-testid={`share-emoji-${i}`}
                        onClick={() => setForm({ ...form, emoji: e, rating: 5 - i })}
                        className={`w-11 h-11 rounded-full text-xl transition flex items-center justify-center ${
                          form.emoji === e ? "scale-110" : "opacity-50 hover:opacity-100"
                        }`}
                        style={{
                          background: form.emoji === e ? "#7CE8C8" : "rgba(255,255,255,0.05)",
                        }}
                      >
                        {e}
                      </button>
                    ))}
                    <span className="ml-2 text-xs text-white/60">{form.rating} / 5</span>
                  </div>
                </div>

                <textarea
                  rows={4}
                  placeholder="What did you love (or not)? Be honest — every word helps."
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  data-testid="share-text-input"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 outline-none focus:border-[color:var(--u-mint)] transition resize-none"
                />

                {error && <p className="text-sm text-[color:var(--u-coral)]" data-testid="share-error">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="u-btn u-btn-primary w-full"
                  data-testid="share-submit-btn"
                >
                  {submitting ? "Sending..." : (<>Submit review <Send size={15} /></>)}
                </button>

                <p className="text-[11px] text-white/45 text-center leading-relaxed">
                  Verified before publishing. No spam. No selling your data.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
