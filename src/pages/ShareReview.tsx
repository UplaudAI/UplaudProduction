/**
 * ShareReview.tsx
 *
 * Standalone page that renders a review card image and provides
 * sharing options to Instagram Stories.
 *
 * URL format:
 *   /share?name=Laksh+Subodh&business=QI+Austin&text=Amazing+food...&score=5&handle=@laksh
 *
 * This URL is what gets sent via WhatsApp. When opened on mobile,
 * it shows the generated story image with a prominent
 * "Share Review" button.
 *
 * IMPORTANT: WhatsApp (and most apps) open links in an in-app browser
 * (WebView) which does NOT support navigator.share with files.
 * We detect this and prompt the user to open in Safari/Chrome where
 * the Web Share API works and can hand the image directly to Instagram.
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

/** Detect if we're in an in-app browser (WhatsApp, Instagram, FB, etc.) */
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

  // Parse review data from URL params
  const review: ReviewData = {
    reviewerName: searchParams.get("name") || "Anonymous",
    businessName: searchParams.get("business") || "Unknown Business",
    reviewText: searchParams.get("text") || "",
    score: Math.min(5, Math.max(1, parseInt(searchParams.get("score") || "5", 10))),
    handle: searchParams.get("handle") || undefined,
    likes: searchParams.get("likes") ? parseInt(searchParams.get("likes")!, 10) : undefined,
  };

  const device = getDeviceInfo();
  const inApp = isInAppBrowser();

  // Check if Web Share API with files is available
  const [canWebShare, setCanWebShare] = useState(false);
  useEffect(() => {
    if (imageBlob && navigator.share && navigator.canShare) {
      const file = new File([imageBlob], "test.png", { type: "image/png" });
      try {
        setCanWebShare(navigator.canShare({ files: [file] }));
      } catch {
        setCanWebShare(false);
      }
    }
  }, [imageBlob]);

  // Generate the story image on mount
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
        // Use origin-relative path for the logo
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

    return () => {
      // Cleanup object URL on unmount
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Share handlers ---- */

  /** Primary: Web Share API with file ONLY (no title/text).
   *  Passing only the file ensures Instagram shows "Stories" as a
   *  share target. When the user picks Stories, Instagram opens its
   *  story editor with the image already loaded — zero extra taps.
   *
   *  NOTE: Web Share API requires HTTPS (secure context). On local
   *  dev over plain HTTP, it will be unavailable — falls back to download. */
  const handleShareViaWebShare = async () => {
    if (!imageBlob) return;
    const file = new File([imageBlob], `uplaud-review.png`, { type: "image/png" });

    // Debug: log what's available so we can diagnose issues
    console.log("[ShareReview] navigator.share exists:", !!navigator.share);
    console.log("[ShareReview] navigator.canShare exists:", !!navigator.canShare);
    console.log("[ShareReview] isSecureContext:", window.isSecureContext);
    console.log("[ShareReview] protocol:", window.location.protocol);
    if (navigator.canShare) {
      console.log("[ShareReview] canShare({files}):", navigator.canShare({ files: [file] }));
    }

    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        setShareStatus("Shared successfully!");
      } else if (!window.isSecureContext) {
        // On HTTP (local dev), Web Share API is blocked
        setShareStatus("Sharing requires HTTPS. On your deployed Vercel site this will open the share sheet. For now, use Download.");
      } else {
        handleDownload();
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Share failed:", err);
        handleDownload();
      }
    }
  };

  /** Open this same page in Safari (iOS) or Chrome (Android) */
  const handleOpenInBrowser = () => {
    const currentUrl = window.location.href;
    if (device.isIOS) {
      // On iOS, x-safari-https:// opens Safari with the URL
      // window.open also works in some WebViews
      window.location.href = currentUrl;
      // Also try opening via window.open as a fallback
      setTimeout(() => {
        window.open(currentUrl, "_blank");
      }, 300);
    } else {
      // On Android, intent:// can open the default browser
      const intentUrl =
        `intent://${currentUrl.replace(/^https?:\/\//, "")}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
      window.location.href = intentUrl;
    }
  };

  /** Fallback: download the image */
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-white text-lg mb-4">{error}</p>
          <Link to="/" className="text-purple-400 hover:underline">
            Go to Uplaud
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center pb-8">
      {/* Header */}
      <div className="w-full max-w-md px-4 pt-6 pb-2 text-center">
        <img
          src="/lovable-uploads/logo.png"
          alt="Uplaud"
          className="h-12 mx-auto mb-2"
          style={{ filter: "brightness(0) invert(1)" }}
        />
        <p className="text-gray-400 text-sm">Share this review</p>
      </div>

      {/* Preview */}
      <div className="w-full max-w-md px-4 mt-4">
        {loading ? (
          <div className="aspect-[9/16] bg-gray-800 rounded-2xl flex items-center justify-center">
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
            style={{ aspectRatio: "9 / 16", objectFit: "contain", background: "#1f2937" }}
          />
        ) : null}
      </div>

      {/* Share buttons */}
      {!loading && imageBlob && (
        <div className="w-full max-w-md px-4 mt-6 flex flex-col gap-3">

          {/* Share button — always visible */}
          <button
            onClick={handleShareViaWebShare}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-white text-base flex items-center justify-center gap-3"
            style={{
              background: "linear-gradient(135deg, #6214a8, #4c0e82)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
            Share Review
          </button>

          {/* Download fallback — always visible */}
          <button
            onClick={handleDownload}
            className="w-full py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 border"
            style={{
              color: "#a78bfa",
              borderColor: "rgba(167, 139, 250, 0.3)",
              background: "rgba(167, 139, 250, 0.08)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download Image
          </button>

          {/* Reminder to tag */}
          <p className="text-center text-gray-400 text-xs mt-2">
            Tag <strong className="text-purple-400">@uplaudofficial</strong> if you share to Instagram!
          </p>
        </div>
      )}

      {/* Status toast */}
      {shareStatus && (
        <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto bg-gray-800 border border-purple-500/30 text-white text-sm px-4 py-3 rounded-xl shadow-xl text-center z-50">
          {shareStatus}
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center">
        <a
          href="https://www.uplaud.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 text-xs hover:text-gray-400"
        >
          uplaud.ai — Real reviews from real people
        </a>
      </div>
    </div>
  );
};

export default ShareReview;
