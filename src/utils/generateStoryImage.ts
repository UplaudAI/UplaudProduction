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
  score: number; // 1-5 stars
  handle?: string; // e.g. "@lakshsubodh"
  profileImage?: string; // URL to profile photo
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

/** Load an image and return as HTMLImageElement, or null on failure. */
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
 * Design matches the Uplaud mockup:
 * - Solid purple background
 * - Uplaud logo centered near top
 * - White card vertically centered with profile pic, name, handle,
 *   "uplaud" branding, stars, review text, heart + likes
 * - @uplaudofficial at the very bottom
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

  // ---- Background: solid purple ----
  ctx.fillStyle = "#6B21A8";
  ctx.fillRect(0, 0, W, H);

  // Subtle vignette gradient
  const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, H);
  bgGrad.addColorStop(0, "rgba(107, 33, 168, 0)");
  bgGrad.addColorStop(1, "rgba(30, 10, 60, 0.4)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ---- Logo at top ----
  const actualLogoUrl = logoUrl || "/lovable-uploads/logo.png";
  const logoImg = await loadImage(actualLogoUrl);

  let logoBottomY = 300; // default if no logo loads
  if (logoImg) {
    const logoTargetW = 260;
    const logoScale = logoTargetW / logoImg.width;
    const lw = logoImg.width * logoScale;
    const lh = logoImg.height * logoScale;
    const logoY = 140;
    ctx.drawImage(logoImg, (W - lw) / 2, logoY, lw, lh);
    logoBottomY = logoY + lh + 40;
  } else {
    // Fallback text logo
    ctx.save();
    ctx.font = "700 64px 'DM Sans', sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("uplaud", W / 2, 160);
    ctx.restore();
    logoBottomY = 260;
  }

  // ---- Load profile image (if available) ----
  let profileImg: HTMLImageElement | null = null;
  if (review.profileImage) {
    profileImg = await loadImage(review.profileImage);
  }

  // ---- Pre-calculate card dimensions ----
  const cardMargin = 72;
  const cardX = cardMargin;
  const cardW = W - cardMargin * 2;
  const cardPadding = 48;
  const contentW = cardW - cardPadding * 2;

  // Measure review text lines
  ctx.font = "400 32px 'DM Sans', Arial, sans-serif";
  const reviewLines = wrapText(ctx, review.reviewText, contentW);

  // Card content layout heights
  const headerH = 80; // avatar row (name + handle)
  const starsH = 60; // star row
  const textH = reviewLines.length * 44; // review body
  const likesH = 50; // heart + likes row
  const gaps = 24 + 20 + 24 + 20; // gaps between sections

  const cardContentH = headerH + starsH + textH + likesH + gaps;
  const cardH = cardContentH + cardPadding * 2;

  // Center the card vertically between logo and bottom text
  const availTop = logoBottomY;
  const availBottom = H - 180; // leave room for @uplaudofficial at bottom
  const cardY = Math.max(availTop, (availTop + availBottom - cardH) / 2);

  // ---- Card shadow + fill ----
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 8;
  roundedRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.restore();

  // ---- Card content ----
  const cx = cardX + cardPadding;
  let cy = cardY + cardPadding;

  // -- Avatar --
  const avatarR = 30;
  const avatarCX = cx + avatarR;
  const avatarCY = cy + avatarR;

  if (profileImg) {
    // Draw profile photo in a circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      profileImg,
      avatarCX - avatarR,
      avatarCY - avatarR,
      avatarR * 2,
      avatarR * 2
    );
    ctx.restore();
  } else {
    // Initials fallback
    const initials = review.reviewerName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
    ctx.fillStyle = "#7C3AED";
    ctx.fill();
    ctx.font = "700 24px 'DM Sans', Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, avatarCX, avatarCY + 1);
    ctx.restore();
  }

  // -- Name + handle --
  const textX = cx + avatarR * 2 + 18;
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "700 32px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "#111827";
  ctx.fillText(review.reviewerName, textX, cy + 2);

  if (review.handle) {
    ctx.font = "400 24px 'DM Sans', Arial, sans-serif";
    ctx.fillStyle = "#9CA3AF";
    ctx.fillText(review.handle, textX, cy + 38);
  }
  ctx.restore();

  // -- "uplaud" branding top-right of card with clap emoji --
  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.font = "600 24px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "#B39DDB";
  ctx.fillText("uplaud 👏", cardX + cardW - cardPadding, cy + 10);
  ctx.restore();

  cy += headerH + 24;

  // -- Star rating (orange/amber) --
  const starSize = 38;
  for (let i = 0; i < 5; i++) {
    const filled = i < review.score;
    ctx.save();
    ctx.font = `400 ${starSize}px 'DM Sans', Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = filled ? "#F59E0B" : "#E5E7EB";
    ctx.fillText("★", cx + i * (starSize + 4), cy);
    ctx.restore();
  }

  cy += starsH + 20;

  // -- Review text --
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "400 32px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "#374151";
  reviewLines.forEach((line, i) => {
    ctx.fillText(line, cx, cy + i * 44);
  });
  ctx.restore();

  cy += textH + 24;

  // -- Heart + likes (green heart like the mockup) --
  ctx.save();
  ctx.font = "400 28px 'DM Sans', Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#34D399"; // green
  ctx.fillText("💚", cx, cy);
  ctx.fillStyle = "#6B7280";
  ctx.font = "500 26px 'DM Sans', Arial, sans-serif";
  ctx.fillText("21", cx + 40, cy + 2);
  ctx.restore();

  // ---- Bottom area: @uplaudofficial ----
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.font = "600 28px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.fillText("@uplaudofficial", W / 2, H - 100);
  ctx.font = "400 22px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.fillText("Real reviews from real people", W / 2, H - 65);
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
