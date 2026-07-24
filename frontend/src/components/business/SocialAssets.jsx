import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  Linkedin,
  Twitter,
  Instagram,
  Share2,
  Download,
  Link2,
  Copy,
  Star,
  Sparkles,
  Loader2,
  BadgeCheck,
} from "lucide-react";
import api from "@/lib/api";
import { logEvent } from "@/lib/analytics";

/* ============================================================================
   Uplaud Social Asset Engine — context-aware (two POVs), channel-intelligent.
   - pov="customer": genuine peer share in the CUSTOMER's voice (no stars, no
     CTAs, no marketing hype). Used on the customer approval page (Growth Signals).
   - pov="company": polished PayRewards marketing. Used on Growth Amplification.
   Backend /api/social/generate writes the platform-native copy for each channel.
============================================================================ */

const PURPLE = "#3066C9";
const PURPLE_MID = "#1F49A8";
const PURPLE_DEEP = "#0E2354";
const PURPLE_INK = "#081833";
const MINT = "#8FB3F5";
const DISPLAY = '"Bricolage Grotesque", "Inter", ui-sans-serif, system-ui, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

export const CHANNELS = {
  linkedin: { key: "linkedin", label: "LinkedIn", voice: "Professional · insight-led", dims: "1200 × 628", w: 600, h: 314, ratio: 2, icon: Linkedin, file: "share-linkedin.png" },
  instagram: { key: "instagram", label: "Instagram", voice: "Warm · visual · punchy", dims: "1080 × 1080", w: 540, h: 540, ratio: 2, icon: Instagram, file: "share-instagram.png" },
  x: { key: "x", label: "X", voice: "Concise · witty", dims: "1600 × 900", w: 600, h: 338, ratio: 2.663, icon: Twitter, file: "share-x.png" },
};

function nameOf(attr) { return (attr || "").split(",")[0].trim() || "PayRewards customer"; }
function roleOf(attr) { return (attr || "").split(",").slice(1).join(",").trim(); }
function initials(attr) {
  const p = nameOf(attr).split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || "P") + (p[1]?.[0] || "")).toUpperCase();
}

function PayRewardsMark({ scale = 1 }) {
  return (
    <img
      src="/payrewards-logo-lockup.png"
      alt="PayRewards"
      crossOrigin="anonymous"
      style={{ height: 36 * scale, width: "auto", display: "block" }}
    />
  );
}
function PoweredByUplaud({ scale = 1 }) {
  const s = scale;
  return (
    <div className="inline-flex items-center" style={{ gap: 6 * s }}>
      <span style={{ fontSize: 8 * s, letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)", fontFamily: MONO, textTransform: "uppercase", whiteSpace: "nowrap" }}>Powered by</span>
      <img src="/uplaud-wordmark-white-t.png" alt="uplaud" crossOrigin="anonymous" style={{ height: 15 * s, width: "auto", display: "block" }} />
    </div>
  );
}
function Stars({ scale = 1 }) {
  const size = 13 * scale;
  return (<div className="flex" style={{ gap: 2 * scale }}>{[0, 1, 2, 3, 4].map((i) => (<Star key={i} style={{ width: size, height: size, color: MINT, fill: MINT }} />))}</div>);
}
function Eyebrow({ text, scale = 1 }) {
  if (!text) return null;
  return (<span style={{ fontFamily: MONO, fontSize: 9.5 * scale, letterSpacing: "0.22em", textTransform: "uppercase", color: MINT, padding: `${3 * scale}px ${9 * scale}px`, borderRadius: 999, border: "1px solid rgba(143,179,245,0.4)", background: "rgba(255,255,255,0.06)", whiteSpace: "nowrap" }}>{text}</span>);
}
function Monogram({ attr, scale = 1 }) {
  const s = scale;
  return (
    <div style={{ width: 34 * s, height: 34 * s, borderRadius: 999, background: `linear-gradient(135deg, ${PURPLE}, ${MINT})`, padding: 2 * s, flexShrink: 0 }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 999, background: PURPLE_DEEP, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 700, fontSize: 13 * s }}>{initials(attr)}</div>
    </div>
  );
}
function Poster({ attr, scale = 1 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 * scale, minWidth: 0 }}>
      <Monogram attr={attr} scale={scale} />
      <div style={{ minWidth: 0 }}>
        <div style={{ color: "#fff", fontSize: 13 * scale, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nameOf(attr)}</div>
        <div style={{ color: "rgba(255,255,255,0.6)", fontFamily: MONO, fontSize: 10 * scale }}>{roleOf(attr) || "shared with their network"}</div>
      </div>
    </div>
  );
}

/* auto-fit + scaler */
function AutoFitText({ text, max, min, style }) {
  const ref = useRef(null);
  const [size, setSize] = useState(max);
  const fit = useCallback(() => {
    const el = ref.current; if (!el) return;
    let lo = min, hi = max, best = min;
    while (lo <= hi) { const m = Math.floor((lo + hi) / 2); el.style.fontSize = m + "px"; if (el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1) { best = m; lo = m + 1; } else hi = m - 1; }
    el.style.fontSize = best + "px"; setSize(best);
  }, [max, min]);
  useLayoutEffect(() => { fit(); const t = setTimeout(fit, 250); if (document.fonts?.ready) document.fonts.ready.then(fit).catch(() => {}); return () => clearTimeout(t); }, [text, fit]);
  return (<div ref={ref} style={{ fontSize: size, overflow: "hidden", width: "100%", height: "100%", display: "flex", alignItems: "flex-start", ...style }}><span style={{ width: "100%" }}>{text}</span></div>);
}
function ScaledFrame({ w, h, children }) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const el = wrapRef.current; if (!el) return; let raf = 0;
    const compute = () => { const n = Math.min(1, el.clientWidth / w); setScale((p) => (Math.abs(p - n) > 0.001 ? n : p)); };
    compute(); const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(compute); }); ro.observe(el);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [w]);
  return (<div ref={wrapRef} style={{ width: "100%", height: h * scale }} className="relative"><div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>{children}</div></div>);
}

/* =============================== CARDS ================================= */
const LinkedInCard = forwardRef(function LinkedInCard({ c }, ref) {
  const cust = c.pov === "customer";
  return (
    <div ref={ref} style={{ width: CHANNELS.linkedin.w, height: CHANNELS.linkedin.h, position: "relative", overflow: "hidden", fontFamily: DISPLAY, background: `radial-gradient(120% 120% at 0% 100%, rgba(143,179,245,0.16), transparent 45%), linear-gradient(135deg, ${PURPLE_INK} 0%, ${PURPLE_DEEP} 60%, #163a7a 100%)` }}>
      <div style={{ position: "absolute", left: 0, top: 40, bottom: 40, width: 4, background: `linear-gradient(${MINT}, ${PURPLE})`, borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />
      <div style={{ position: "relative", height: "100%", padding: 34, paddingLeft: 40, display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {cust ? <Poster attr={c.attribution} /> : <PayRewardsMark />}
          {!cust && <Eyebrow text={c.eyebrow} />}
        </div>
        {c.headline && <div style={{ marginTop: 14, color: MINT, fontWeight: 700, fontSize: 20, lineHeight: 1.15, letterSpacing: "-0.02em" }}>{c.headline}</div>}
        <div style={{ flex: 1, minHeight: 0, marginTop: 10, borderLeft: "2px solid rgba(143,179,245,0.5)", paddingLeft: 14, display: "flex" }}>
          <AutoFitText text={`\u201C${c.quote}\u201D`} max={20} min={12} style={{ color: "rgba(255,255,255,0.94)", fontWeight: 500, lineHeight: 1.3 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 8 }}>
          {cust ? <span style={{ color: "rgba(255,255,255,0.4)", fontFamily: MONO, fontSize: 10 }}>my experience with {c.company}</span> : <Poster attr={c.attribution} />}
          <PoweredByUplaud />
        </div>
      </div>
    </div>
  );
});

const InstagramCard = forwardRef(function InstagramCard({ c }, ref) {
  const cust = c.pov === "customer";
  return (
    <div ref={ref} style={{ width: CHANNELS.instagram.w, height: CHANNELS.instagram.h, position: "relative", overflow: "hidden", fontFamily: DISPLAY, background: `linear-gradient(155deg, ${PURPLE_DEEP} 0%, ${PURPLE_MID} 52%, ${PURPLE} 78%, #6f97e6 100%)` }}>
      <div style={{ position: "absolute", top: -120, right: -80, width: 360, height: 360, borderRadius: 999, background: "radial-gradient(circle, rgba(143,179,245,0.45), transparent 62%)" }} />
      <div style={{ position: "absolute", left: 22, top: 92, fontSize: 260, lineHeight: 0.7, color: "rgba(255,255,255,0.08)", fontFamily: "Georgia, serif" }}>&ldquo;</div>
      <div style={{ position: "relative", height: "100%", padding: 44, display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {cust ? <Poster attr={c.attribution} scale={1.1} /> : <PayRewardsMark scale={1.06} />}
          {!cust && <Stars scale={1.1} />}
        </div>
        {c.headline && (cust
          ? <div style={{ marginTop: 16, color: MINT, fontWeight: 700, fontSize: 16 }}>{c.headline}</div>
          : <div style={{ marginTop: 16 }}><span style={{ display: "inline-block", background: MINT, color: PURPLE_DEEP, fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", padding: "5px 12px", borderRadius: 999 }}>{c.headline}</span></div>)}
        <div style={{ flex: 1, minHeight: 0, marginTop: 18, display: "flex" }}>
          <AutoFitText text={`\u201C${c.quote}\u201D`} max={44} min={20} style={{ color: "#fff", fontWeight: 700, lineHeight: 1.16, letterSpacing: "-0.02em" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          {cust ? <span style={{ color: "rgba(255,255,255,0.6)", fontFamily: MONO, fontSize: 10.5 }}>on {c.company}</span> : <Poster attr={c.attribution} scale={1.12} />}
          <PoweredByUplaud scale={1.06} />
        </div>
      </div>
    </div>
  );
});

const XCard = forwardRef(function XCard({ c }, ref) {
  const cust = c.pov === "customer";
  return (
    <div ref={ref} style={{ width: CHANNELS.x.w, height: CHANNELS.x.h, position: "relative", overflow: "hidden", fontFamily: DISPLAY, background: `radial-gradient(100% 140% at 100% 0%, rgba(48,102,201,0.35), transparent 55%), #0a1730` }}>
      <div style={{ position: "relative", height: "100%", padding: 34, display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {cust ? <Poster attr={c.attribution} scale={0.95} /> : (
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <PayRewardsMark scale={0.92} />
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "rgba(255,255,255,0.5)", fontFamily: MONO, fontSize: 11 }}>@payrewards <BadgeCheck style={{ width: 13, height: 13, color: MINT }} /></span>
            </div>
          )}
          {!cust && <Eyebrow text={c.eyebrow} />}
        </div>
        {c.headline && <div style={{ marginTop: 12 }}><div style={{ color: "#fff", fontWeight: 700, fontSize: 19, letterSpacing: "-0.02em" }}>{c.headline}</div><div style={{ width: 46, height: 3, background: MINT, borderRadius: 3, marginTop: 8 }} /></div>}
        <div style={{ flex: 1, minHeight: 0, marginTop: 12, display: "flex" }}>
          <AutoFitText text={`\u201C${c.quote}\u201D`} max={23} min={13} style={{ color: "rgba(255,255,255,0.92)", fontWeight: 500, lineHeight: 1.28 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span style={{ color: cust ? "rgba(255,255,255,0.4)" : MINT, fontFamily: MONO, fontSize: 11 }}>{cust ? `on ${c.company}` : `— ${c.attribution}`}</span>
          <PoweredByUplaud scale={0.95} />
        </div>
      </div>
    </div>
  );
});

const CARD_COMPONENTS = { linkedin: LinkedInCard, instagram: InstagramCard, x: XCard };

function Pill({ testId, icon: Icon, label, onClick, variant = "solid" }) {
  const base = "inline-flex items-center gap-2 h-10 px-4 rounded-full text-[13px] font-medium transition-transform hover:-translate-y-[1px]";
  if (variant === "outline") return (<button data-testid={testId} onClick={onClick} className={`${base} border border-[#e2d9f5] text-[#261c4d] hover:bg-[#f5f3ff]`}><Icon className="w-4 h-4" />{label}</button>);
  const style = variant === "mint" ? { backgroundColor: MINT, color: PURPLE_DEEP } : { backgroundColor: PURPLE, color: "#fff" };
  return (<button data-testid={testId} onClick={onClick} className={base} style={style}><Icon className="w-4 h-4" />{label}</button>);
}

export default function SocialAssetStudio({
  quote,
  attribution,
  company = "PayRewards",
  pov = "company",
  publicUrl = typeof window !== "undefined" ? window.location.href : "",
  channels = ["linkedin", "instagram", "x"],
  imageChannels = ["linkedin", "instagram", "x"],
  heading,
  subheading,
  testId = "share-assets",
  shareId = "",
}) {
  const refs = useRef({});
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const testimonial = (quote || "").trim();
  const attr = (attribution || "PayRewards customer").trim();

  const isCustomer = pov === "customer";
  const resolvedHeading = heading || (isCustomer ? "Share it with your network" : "Your branded share assets");
  const resolvedSub = subheading || (isCustomer
    ? "Genuine posts written in your voice — no sales pitch, just your honest take. Share whatever feels right."
    : "Channel-native posts — written and designed for each platform, powered by Uplaud.");

  useEffect(() => {
    let alive = true; setLoading(true);
    api.post("/social/generate", { testimonial, attribution: attr, company, pov, channels })
      .then((res) => { if (alive) setContent(res.data?.channels || res.data); })
      .catch(() => {
        if (!alive) return; const fb = {};
        channels.forEach((ch) => (fb[ch] = { eyebrow: isCustomer ? "" : "CUSTOMER STORY", headline: isCustomer ? "My honest take" : "In our customer's words", quote: testimonial.slice(0, 150), caption: testimonial, hashtags: [], cta: "" }));
        setContent(fb);
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testimonial, attr, company, pov]);

  const cardData = (ch) => ({
    pov, company, attribution: attr,
    eyebrow: content?.[ch]?.eyebrow || (isCustomer ? "" : "CUSTOMER STORY"),
    headline: content?.[ch]?.headline || "",
    quote: content?.[ch]?.quote || testimonial,
  });

  const getUrl = async (ch) => { const n = refs.current[ch]; if (!n) throw new Error("Card not ready yet — please wait a moment and try again."); return toPng(n, { pixelRatio: CHANNELS[ch].ratio, cacheBust: true, width: CHANNELS[ch].w, height: CHANNELS[ch].h }); };
  const download = async (ch) => { try { const u = await getUrl(ch); const a = document.createElement("a"); a.href = u; a.download = CHANNELS[ch].file; a.click(); toast.success(`${CHANNELS[ch].label} image downloaded`); } catch (err) { console.error("download failed", err); toast.error("Could not generate image"); } };
  const shareTray = async (ch) => {
    logEvent(`share_${ch}_click`, { page: "testimonial", shareId });
    try {
      const u = await getUrl(ch);
      const b = await (await fetch(u)).blob();
      const f = new File([b], CHANNELS[ch].file, { type: "image/png" });
      if (navigator.canShare?.({ files: [f] })) {
        await navigator.share({ files: [f], text: cardData(ch).quote });
        toast.success(`${CHANNELS[ch].label} share sheet opened`);
        return;
      }
      if (navigator.share) {
        await navigator.share({ text: cardData(ch).quote, url: publicUrl });
        toast.success("Shared");
        return;
      }
      // No native share support (most desktop browsers): download the image and
      // copy the caption so the user can upload it straight into Instagram.
      const a = document.createElement("a");
      a.href = u;
      a.download = CHANNELS[ch].file;
      a.click();
      copyCaption(ch);
      toast.info(`${CHANNELS[ch].label} image downloaded & caption copied — open Instagram and upload it there`);
    } catch (err) {
      if (err?.name === "AbortError") return; // user cancelled the native share sheet
      console.error(`${ch} share failed`, err);
      toast.error(`Couldn't prepare the ${CHANNELS[ch].label} share. Try Download instead.`);
    }
  };
  const copyCaption = (ch) => { logEvent(`copy_caption_${ch}_click`, { page: "testimonial", shareId }); const c = content?.[ch] || {}; const tags = (c.hashtags || []).map((t) => `#${t}`).join(" "); const text = [c.caption, tags].filter(Boolean).join("\n\n"); navigator.clipboard.writeText(text).then(() => toast.success(`${CHANNELS[ch].label} caption copied`)).catch(() => toast.info("Copy not available")); };
  const openLinkedIn = () => { logEvent("share_linkedin_click", { page: "testimonial", shareId }); window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`, "_blank", "noopener,width=680,height=640"); };
  const openX = () => { logEvent("share_x_click", { page: "testimonial", shareId }); window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(content?.x?.caption || `"${cardData("x").quote}"`)}&url=${encodeURIComponent(publicUrl)}`, "_blank", "noopener,width=680,height=640"); };

  const primaryAction = {
    linkedin: <Pill testId="share-linkedin" icon={Linkedin} label="Share on LinkedIn" onClick={openLinkedIn} />,
    instagram: <Pill testId="share-instagram" icon={Share2} label="Share to Instagram" onClick={() => shareTray("instagram")} />,
    x: <Pill testId="share-x-card" icon={Twitter} label="Post on X" onClick={openX} />,
  };

  return (
    <section data-testid={testId}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4" style={{ color: PURPLE }} />
        <h2 className="font-display text-[20px] font-semibold text-[#261c4d]">{resolvedHeading}</h2>
        <span className="text-[10px] font-mono uppercase tracking-[0.16em] px-2 py-0.5 rounded-full" style={{ background: "#f0ebfb", color: PURPLE_MID }}>{isCustomer ? "Your voice" : "PayRewards voice"}</span>
      </div>
      <p className="text-[13px] text-[#6b6480] mt-1">{resolvedSub}</p>

      {loading && (<div className="mt-8 flex items-center gap-2 text-[13px] text-[#6d46c6]" data-testid="social-generating"><Loader2 className="w-4 h-4 animate-spin" /> Writing channel-native posts…</div>)}

      <div className="mt-7 space-y-8">
        {channels.map((ch) => {
          const cfg = CHANNELS[ch]; const Card = CARD_COMPONENTS[ch]; const c = content?.[ch]; const Icon = cfg.icon;
          return (
            <div key={ch} data-testid={`asset-${ch}`} className={`rounded-2xl border border-[#eee7f7] bg-white p-5 ${imageChannels.includes(ch) ? "grid grid-cols-1 lg:grid-cols-2 gap-6 items-start" : ""}`}>
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#9a93b0] mb-2 flex items-center gap-2"><Icon className="w-3.5 h-3.5" style={{ color: PURPLE }} /> {cfg.label} {imageChannels.includes(ch) ? `· ${cfg.dims}` : "· text post"}</div>
                {imageChannels.includes(ch) ? (
                  <>
                    <div className="rounded-xl overflow-hidden border border-[#e6dff5] shadow-sm" style={{ background: PURPLE_DEEP }}>
                      <ScaledFrame w={cfg.w} h={cfg.h}><Card c={cardData(ch)} ref={(el) => (refs.current[ch] = el)} /></ScaledFrame>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">{primaryAction[ch]}<Pill testId={`download-${ch}`} icon={Download} label="Download" variant="outline" onClick={() => { logEvent(`download_${ch}_click`, { page: "testimonial", shareId }); download(ch); }} /></div>
                  </>
                ) : (
                  c ? (
                    <div className="rounded-xl bg-[#faf9ff] border border-[#eee7f7] p-4">
                      <p className="text-[14px] leading-relaxed text-[#2b2340] whitespace-pre-line">{c.caption}</p>
                      {c.hashtags?.length > 0 && (<div className="mt-3 flex flex-wrap gap-1.5">{c.hashtags.map((h) => (<span key={h} className="text-[12px] font-mono" style={{ color: PURPLE }}>#{h}</span>))}</div>)}
                      <div className="mt-4 flex flex-wrap items-center gap-2">{primaryAction[ch]}<Pill testId={`copy-caption-${ch}`} icon={Copy} label="Copy caption" variant="mint" onClick={() => copyCaption(ch)} /></div>
                    </div>
                  ) : (<div className="rounded-xl bg-[#faf9ff] border border-[#eee7f7] p-4 text-[13px] text-[#9a93b0]">Generating…</div>)
                )}
              </div>
              {imageChannels.includes(ch) && (
                <div className="lg:pt-7">
                  <div className="flex items-center gap-2 mb-2"><span className="text-[11px] font-mono uppercase tracking-[0.14em] px-2 py-0.5 rounded-full" style={{ background: "#f0ebfb", color: PURPLE_MID }}>{cfg.voice}</span></div>
                  {c ? (
                    <>
                      <div className="rounded-xl bg-[#faf9ff] border border-[#eee7f7] p-4">
                        <p className="text-[13.5px] leading-relaxed text-[#2b2340] whitespace-pre-line">{c.caption}</p>
                        {c.hashtags?.length > 0 && (<div className="mt-3 flex flex-wrap gap-1.5">{c.hashtags.map((h) => (<span key={h} className="text-[12px] font-mono" style={{ color: PURPLE }}>#{h}</span>))}</div>)}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Pill testId={`copy-caption-${ch}`} icon={Copy} label="Copy caption" variant="mint" onClick={() => copyCaption(ch)} />
                        {c.cta && <span className="text-[12px] text-[#9a93b0] font-mono">CTA: {c.cta}</span>}
                      </div>
                    </>
                  ) : (<div className="rounded-xl bg-[#faf9ff] border border-[#eee7f7] p-4 text-[13px] text-[#9a93b0]">Generating…</div>)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl p-6 flex flex-wrap items-center gap-3" style={{ background: `linear-gradient(120deg, ${PURPLE_DEEP}, ${PURPLE_MID})` }}>
        <div className="text-white">
          <div className="font-display font-semibold">Share everywhere</div>
          <div className="text-[12px] text-white/60">Post directly or grab the visual + caption for each channel.</div>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Pill testId="tray-x" icon={Twitter} label="X" variant="mint" onClick={openX} />
          <Pill testId="tray-linkedin" icon={Linkedin} label="LinkedIn" variant="mint" onClick={openLinkedIn} />
          <Pill testId="tray-copy" icon={Link2} label="Copy link" variant="mint" onClick={() => { logEvent("copy_link_click", { page: "testimonial", shareId }); navigator.clipboard.writeText(publicUrl).then(() => toast.success("Link copied")).catch(() => {}); }} />
        </div>
      </div>
    </section>
  );
}
