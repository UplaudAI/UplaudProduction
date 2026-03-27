/**
 * buildShareUrl.ts
 *
 * Build the URLs for sharing a review:
 * 1. The share page URL (opens the Instagram story share preview)
 * 2. The WhatsApp message URL (sends the share page link via WhatsApp)
 */

export interface ShareReviewParams {
  reviewerName: string;
  businessName: string;
  reviewText: string;
  score: number;
  handle?: string;
  likes?: number;
}

/**
 * Build the URL to the /share page with review data in query params.
 * This is the URL that gets sent via WhatsApp and opens the preview.
 */
export function buildSharePageUrl(
  params: ShareReviewParams,
  origin?: string
): string {
  const base = origin || window.location.origin;
  const url = new URL("/share", base);
  url.searchParams.set("name", params.reviewerName);
  url.searchParams.set("business", params.businessName);
  url.searchParams.set("text", params.reviewText);
  url.searchParams.set("score", String(params.score));
  if (params.handle) {
    url.searchParams.set("handle", params.handle);
  }
  if (params.likes != null && params.likes > 0) {
    url.searchParams.set("likes", String(params.likes));
  }
  return url.toString();
}

/**
 * Build a WhatsApp share URL that includes the share page link.
 * When the recipient opens this on mobile, they see the story preview
 * with the "Share to Instagram Story" button.
 */
export function buildWhatsAppShareUrl(params: ShareReviewParams): string {
  const shareUrl = buildSharePageUrl(params);

  const message =
    `🎉 Check out my review for ${params.businessName} on Uplaud!\n\n` +
    `Share it to your Instagram Story 👇\n${shareUrl}\n\n` +
    `@uplaudofficial — Real reviews from real people`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Build a WhatsApp share URL for sharing the review to a specific number.
 */
export function buildWhatsAppShareUrlWithNumber(
  params: ShareReviewParams,
  phoneNumber: string
): string {
  const shareUrl = buildSharePageUrl(params);
  const cleanPhone = phoneNumber.replace(/\D/g, "");

  const message =
    `🎉 Check out my review for ${params.businessName} on Uplaud!\n\n` +
    `Share it to your Instagram Story 👇\n${shareUrl}\n\n` +
    `@uplaudofficial — Real reviews from real people`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
