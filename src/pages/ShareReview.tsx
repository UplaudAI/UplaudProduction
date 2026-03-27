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
 * "Share to Instagram Story" button.
 */
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { generateStoryImage, type ReviewData } from "@/utils/generateStoryImage";

/* ===================== Device detection ===================== */
function getDeviceInfo() {
  const ua = navigator.userAgent || (navigator as any).vendor || (window as any).opera;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /android/i.test(ua);
  return { isIOS, isAndroid, isMobile: isIOS || isAndroid };
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
  };

  const device = getDeviceInfo();

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
   *  story editor with the image already loaded — zero extra taps. */
  const handleShareViaWebShare = async () => {
    if (!imageBlob) return;
    const file = new File([imageBlob], `uplaud-review.png`, { type: "image/png" });

    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        setShareStatus("Shared successfully!");
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
        <p className="text-gray-400 text-sm">Share this review to your Instagram Story</p>
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
          {/* Primary: share via Web Share API (best on mobile) */}
          {device.isMobile && (
            <button
              onClick={handleShareViaWebShare}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-white text-base flex items-center justify-center gap-3"
              style={{
                background: "linear-gradient(135deg, #833AB4, #C13584, #E1306C, #F77737)",
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              Share to Instagram Story
            </button>
          )}

          {/* Download fallback */}
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
            Don't forget to tag <strong className="text-purple-400">@uplaudofficial</strong> in your story!
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
