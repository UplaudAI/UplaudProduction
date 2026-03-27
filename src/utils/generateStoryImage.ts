/**
 * generateStoryImage.ts
 * 
 * Generates a 1080×1920 Instagram Story image on a <canvas>
 * from review data, matching the Uplaud purple-card design.
 *
 * Returns a Blob (image/png) that can be shared via Web Share API
 * or downloaded.
 */

export interface ReviewData {
  reviewerName: string;
  businessName: string;
  reviewText: string;
  score: number;       // 1-5 stars
  handle?: string;     // e.g. "@lakshsubodh"
}

/** Wrap text to fit a given maxWidth, returning an array of lines. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/** Draw a rounded rectangle path on context. */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Load the Uplaud logo PNG and return as an HTMLImageElement.
 * Falls back gracefully if the image can't load.
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Main export: generates a story image and returns a Blob.
 * 
 * @param review - the review data to render
 * @param logoUrl - optional URL to the Uplaud logo PNG
 * @returns Promise<Blob> - the generated PNG image
 */
export async function generateStoryImage(
  review: ReviewData,
  logoUrl?: string
): Promise<Blob> {
  const W = 1080;
  const H = 1920;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ---- Background ----
  ctx.fillStyle = "#7C3AED";
  ctx.fillRect(0, 0, W, H);

  // Subtle gradient overlay
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "rgba(109, 40, 217, 0.3)");
  bgGrad.addColorStop(0.5, "rgba(124, 58, 237, 0)");
  bgGrad.addColorStop(1, "rgba(76, 29, 149, 0.4)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ---- Logo ----
  const actualLogoUrl = logoUrl || "/lovable-uploads/logo.png";
  const logoImg = await loadImage(actualLogoUrl);
  if (logoImg) {
    // Draw logo centered at top, scaled to ~280px wide
    const logoScale = 280 / logoImg.width;
    const lw = logoImg.width * logoScale;
    const lh = logoImg.height * logoScale;
    ctx.drawImage(logoImg, (W - lw) / 2, 120, lw, lh);
  } else {
    // Fallback: text logo
    ctx.save();
    ctx.font = "700 72px 'DM Sans', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.textAlign = "center";
    ctx.fillText("uplaud", W / 2, 260);
    ctx.restore();
  }

  // ---- Calculate card dimensions ----
  const cardMargin = 80;
  const cardX = cardMargin;
  const cardW = W - cardMargin * 2;
  const cardPadding = 50;
  const contentW = cardW - cardPadding * 2;

  // Pre-calculate text lines for card height
  ctx.font = "400 34px 'DM Sans', Arial, sans-serif";
  const reviewLines = wrapText(ctx, review.reviewText, contentW);
  const cardContentHeight =
    100 +  // header (avatar + name)
    70 +   // stars
    reviewLines.length * 48 + // review text
    30 +   // gap
    50 +   // @uplaudofficial tag
    40;    // padding bottom

  const cardY = Math.max(logoImg ? 120 + 280 * (logoImg.height / logoImg.width) + 40 : 320, (H - cardContentHeight) / 2 - 80);
  const cardH = cardContentHeight;

  // ---- Card shadow + fill ----
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 10;
  roundedRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.restore();

  // ---- Card content ----
  const cx = cardX + cardPadding;
  let cy = cardY + cardPadding;

  // Avatar circle
  const avatarR = 28;
  const initials = review.reviewerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx + avatarR, cy + avatarR, avatarR, 0, Math.PI * 2);
  ctx.fillStyle = "#7C3AED";
  ctx.fill();
  ctx.font = "700 22px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, cx + avatarR, cy + avatarR + 1);
  ctx.restore();

  // Name + handle
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "700 34px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "#111827";
  ctx.fillText(review.reviewerName, cx + avatarR * 2 + 18, cy + 2);

  if (review.handle) {
    ctx.font = "400 26px 'DM Sans', Arial, sans-serif";
    ctx.fillStyle = "#9CA3AF";
    ctx.fillText(review.handle, cx + avatarR * 2 + 18, cy + 38);
  }
  ctx.restore();

  // "uplaud" branding top-right
  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.font = "600 26px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "#B39DDB";
  ctx.fillText("uplaud", cardX + cardW - cardPadding, cy + 10);
  ctx.restore();

  cy += 100;

  // Star rating
  const starStr = "★".repeat(review.score) + "☆".repeat(5 - review.score);
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "400 42px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "#F59E0B";
  ctx.fillText(starStr, cx, cy);
  ctx.restore();

  cy += 70;

  // Review text
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "400 34px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "#374151";
  reviewLines.forEach((line, i) => {
    ctx.fillText(line, cx, cy + i * 48);
  });
  ctx.restore();

  cy += reviewLines.length * 48 + 30;

  // @uplaudofficial tag inside the card
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "600 28px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "#7C3AED";
  ctx.fillText("@uplaudofficial", cx, cy);
  ctx.restore();

  // ---- Below card: business name ----
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "500 30px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText(`Review for ${review.businessName}`, W / 2, cardY + cardH + 40);
  ctx.restore();

  // ---- Bottom: @uplaudofficial + tagline ----
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.font = "600 30px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillText("@uplaudofficial", W / 2, H - 130);
  ctx.font = "400 24px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.fillText("Real reviews from real people", W / 2, H - 90);
  ctx.restore();

  // ---- Convert to blob ----
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to generate image"));
      },
      "image/png"
    );
  });
}
