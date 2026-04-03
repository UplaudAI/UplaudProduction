/**
 * ShareReview.tsx
 *
 * Standalone page that renders a review card image and provides
 * sharing options to Instagram Stories.
 *
 * URL format:
 *   /share?name=...&business=...&text=...&score=5&handle=@...&reviewCount=42&categories=Cafe,Vegetarian
 */
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { generateStoryImage, type ReviewData } from "@/utils/generateStoryImage";

/* ===================== Device / browser detection ===================== */
function getDeviceInfo() {
  const ua = navigator.userAgent || (navigator as any).vendor || (window as any).opera;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /android/i.test(ua);
  return { isIOS, isAndroid, isMobile: isIOS || isAndroid };
}

function isInAppBrowser(): boolean {
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|WhatsApp|Line|Snapchat|Twitter|Weibo|MicroMessenger/i.test(ua);
}

/* ===================== Component ===================== */
const ShareReview: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const canvasGenerated = useRef(false);

  const review: ReviewData = {
    reviewerName: searchParams.get("name") || "Anonymous",
    businessName: searchParams.get("business") || "Unknown Business",
    reviewText: searchParams.get("text") || "",
    score: Math.min(5, Math.max(1, parseFloat(searchParams.get("score") || "5"))),
    handle: searchParams.get("handle") || undefined,
    reviewCount: searchParams.get("reviewCount") ? parseInt(searchParams.get("reviewCount")!, 10) : undefined,
    categories: searchParams.get("categories") ? searchParams.get("categories")!.split(",").map(c => c.trim()).filter(Boolean) : undefined,
  };

  const device = getDeviceInfo();
  const inApp = isInAppBrowser();

  const [canWebShare, setCanWebShare] = useState(false);
  useEffect(() => {
    if (imageBlob && navigator.share && navigator.canShare) {
      const file = new File([imageBlob], "test.png", { type: "image/png" });
      try { setCanWebShare(navigator.canShare({ files: [file] })); } catch { setCanWebShare(false); }
    }
  }, [imageBlob]);

  useEffect(() => {
    if (canvasGenerated.current) return;
    canvasGenerated.current = true;

    if (!review.reviewText) {
      setError("No review text provided.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const logoUrl = `${window.location.origin}/lovable-uploads/logo.png`;
        const blob = await generateStoryImage(review, logoUrl);
        setImageBlob(blob);
        setImageUrl(URL.createObjectURL(blob));
      } catch (err) {
        console.error("Failed to generate story image:", err);
        setError("Failed to generate the story image.");
      } finally {
        setLoading(false);
      }
    })();

    return () => { if (imageUrl) URL.revokeObjectURL(imageUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Share handlers ---- */
  const handleShareViaWebShare = async () => {
    if (!imageBlob) return;
    const file = new File([imageBlob], `uplaud-review.png`, { type: "image/png" });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        setShareStatus("Shared successfully!");
      } else if (!window.isSecureContext) {
        setShareStatus("Sharing requires HTTPS. On your deployed site this will open the share sheet. For now, use Download.");
      } else {
        handleDownload();
      }
    } catch (err: any) {
      if (err.name !== "AbortError") { handleDownload(); }
    }
  };

  const handleDownload = () => {
    if (!imageBlob) return;
    const url = URL.createObjectURL(imageBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uplaud-review-${review.businessName.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShareStatus("Image downloaded! Open Instagram → Your Story → select the image.");
  };

  /* ---- Render ---- */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#0f1729" }}>
        <div className="text-center">
          <p className="text-white text-lg mb-4">{error}</p>
          <Link to="/" className="text-purple-400 hover:underline">Go to Uplaud</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center pb-8" style={{ background: "#0f1729" }}>

      {/* ── TAG + BUTTONS ── */}
      {!loading && imageBlob && (
        <div className="w-full max-w-md px-6 pt-10 pb-2">
          {/* Large heading */}
          <h1 className="text-3xl font-extrabold text-white leading-tight mb-6">
            Tag{" "}
            <span style={{ color: "#7c6cf0" }}>@uplaudofficial</span>
            {" "}if you share to Instagram!
          </h1>

          {/* Buttons row — side by side */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleShareViaWebShare}
              className="flex-1 py-4 px-5 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-3 shadow-lg active:scale-[0.97] transition-transform"
              style={{ background: "#22c55e" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share review
            </button>

            <button
              onClick={handleDownload}
              className="py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 active:scale-[0.97] transition-transform border-2"
              style={{
                color: "#94a3b8",
                borderColor: "#334155",
                background: "transparent",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download
            </button>
          </div>
        </div>
      )}

      {/* ── IMAGE PREVIEW ── */}
      <div className="w-full max-w-md px-4">
        {loading ? (
          <div className="aspect-[9/16] rounded-2xl flex items-center justify-center" style={{ background: "#1a2236" }}>
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Generating story image...</p>
            </div>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt="Instagram Story Preview"
            className="w-full rounded-2xl shadow-2xl"
            style={{ aspectRatio: "9 / 16", objectFit: "contain", background: "#1a2236" }}
          />
        ) : null}
      </div>

      {/* ── FOLLOW TEXT ── */}
      {!loading && imageBlob && (
        <p className="mt-5 text-center text-gray-400 text-base">
          Follow <strong style={{ color: "#7c6cf0" }}>@uplaudofficial</strong>
        </p>
      )}

      {/* Status toast */}
      {shareStatus && (
        <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto bg-gray-800 border border-purple-500/30 text-white text-sm px-4 py-3 rounded-xl shadow-xl text-center z-50">
          {shareStatus}
        </div>
      )}
    </div>
  );
};

export default ShareReview;
