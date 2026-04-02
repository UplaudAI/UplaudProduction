/**
 * generateStoryImage.ts
 *
 * Generates a 1080×1920 Instagram Story image on a <canvas>
 * from review data, matching the Uplaud story design.
 *
 * For long reviews, all dimensions scale down proportionally
 * so the entire review always fits on one story image.
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
  likes?: number; // number of likes/hearts
}

// Use Arial for all canvas text — it's always available and
// gives consistent measureText results across all browsers.
const FONT_FAMILY = "Arial, sans-serif";

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

/** Load an image, returning null on failure. */
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
 * Draw the logo as white on the canvas.
 */
function drawLogoWhite(
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const tmp = document.createElement("canvas");
  tmp.width = w;
  tmp.height = h;
  const tctx = tmp.getContext("2d")!;
  tctx.drawImage(logoImg, 0, 0, w, h);
  tctx.globalCompositeOperation = "source-in";
  tctx.fillStyle = "#FFFFFF";
  tctx.fillRect(0, 0, w, h);
  ctx.drawImage(tmp, x, y);
}

/**
 * Compute all layout dimensions at a given scale.
 * Returns whether it fits within the canvas height.
 */
function computeLayout(
  ctx: CanvasRenderingContext2D,
  reviewText: string,
  baseLogoH: number,
  W: number,
  H: number,
  scale: number
) {
  const s = scale;

  // Card margins get a floor so the card doesn't get too wide
  const cardMarginX = Math.round(48 * Math.max(s, 0.7));
  const cardW = W - cardMarginX * 2;
  const cardPad = Math.round(60 * s);
  const contentW = cardW - cardPad * 2;

  const bubblePadX = Math.round(36 * s);
  const bubblePadY = Math.round(28 * s);
  const reviewFontSize = Math.round(41 * s);
  const lineHeight = Math.round(55 * s);

  // IMPORTANT: set font before measuring
  ctx.font = `400 ${reviewFontSize}px ${FONT_FAMILY}`;
  const reviewLines = wrapText(ctx, reviewText, contentW - bubblePadX * 2);

  const avatarRowH = Math.round(86 * s);
  const businessNameH = Math.round(52 * s);
  const starsRowH = Math.round(68 * s);
  const reviewTextH = reviewLines.length * lineHeight + bubblePadY * 2;

  const gapAfterAvatar = Math.round(28 * s);
  const gapAfterBusiness = Math.round(16 * s);
  const gapAfterStars = Math.round(24 * s);

  const totalContentH =
    avatarRowH + gapAfterAvatar +
    businessNameH + gapAfterBusiness +
    starsRowH + gapAfterStars +
    reviewTextH;

  const cardH = totalContentH + cardPad * 2;

  const logoH = Math.round(baseLogoH * s);
  const logoGap = Math.round(60 * s);
  const bottomTagSpace = Math.max(Math.round(100 * s), 80);
  const topPad = 40; // minimum top padding

  // Total height needed
  const totalNeeded = topPad + logoH + logoGap + cardH + bottomTagSpace;

  return {
    fits: totalNeeded <= H,
    totalNeeded,
    cardMarginX, cardW, cardPad, contentW,
    bubblePadX, bubblePadY, reviewFontSize, lineHeight,
    reviewLines,
    avatarRowH, businessNameH, starsRowH, reviewTextH,
    gapAfterAvatar, gapAfterBusiness, gapAfterStars,
    cardH, logoH, logoGap, bottomTagSpace,
  };
}

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

  // ======== BACKGROUND ========
  ctx.fillStyle = "#6214a8";
  ctx.fillRect(0, 0, W, H);

  // ======== LOGO ========
  const actualLogoUrl = logoUrl || "/lovable-uploads/logo.png";
  const logoImg = await loadImage(actualLogoUrl);

  let baseLogoH = 180;
  let baseLogoW = 380;
  if (logoImg) {
    const logoTargetW = 380;
    const s = logoTargetW / logoImg.width;
    baseLogoW = Math.round(logoImg.width * s);
    baseLogoH = Math.round(logoImg.height * s);
  }

  // ======== LOAD PROFILE IMAGE ========
  let profileImg: HTMLImageElement | null = null;
  if (review.profileImage) {
    profileImg = await loadImage(review.profileImage);
  }

  // ======== FIND THE RIGHT SCALE ========
  let scale = 1.0;
  let layout = computeLayout(ctx, review.reviewText, baseLogoH, W, H, scale);

  while (!layout.fits && scale > 0.5) {
    scale -= 0.05;
    layout = computeLayout(ctx, review.reviewText, baseLogoH, W, H, scale);
  }

  // If still doesn't fit at 0.5, use 0.5 anyway (content will be small but complete)
  if (!layout.fits) {
    scale = 0.5;
    layout = computeLayout(ctx, review.reviewText, baseLogoH, W, H, scale);
  }

  const s = scale;

  const {
    cardMarginX, cardW, cardPad, contentW,
    bubblePadX, bubblePadY, reviewFontSize, lineHeight,
    reviewLines, avatarRowH, businessNameH, starsRowH,
    reviewTextH, gapAfterAvatar, gapAfterBusiness, gapAfterStars,
    cardH, logoH, logoGap, bottomTagSpace,
  } = layout;

  const cardX = cardMarginX;
  const logoW = Math.round(baseLogoW * s);

  // Center the logo+card group vertically in the available space
  const totalGroupH = logoH + logoGap + cardH;
  const availableH = H - bottomTagSpace;
  const groupTopY = Math.max(30, Math.round((availableH - totalGroupH) / 2));

  // ======== DRAW LOGO ========
  const logoY = groupTopY;
  if (logoImg) {
    const logoX = Math.round((W - logoW) / 2);
    drawLogoWhite(ctx, logoImg, logoX, logoY, logoW, logoH);
  } else {
    ctx.save();
    ctx.font = `300 ${Math.round(72 * s)}px ${FONT_FAMILY}`;
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("uplaud", W / 2, logoY);
    ctx.restore();
  }

  // ======== DRAW CARD ========
  const cardY = groupTopY + logoH + logoGap;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 6;
  roundedRect(ctx, cardX, cardY, cardW, cardH, Math.round(20 * s));
  ctx.fillStyle = "#FFF7E6";
  ctx.fill();
  ctx.restore();

  // ======== CARD CONTENT ========
  const cx = cardX + cardPad;
  let cy = cardY + cardPad;

  // -- Avatar --
  const avatarR = Math.round(38 * s);
  const avatarCX = cx + avatarR;
  const avatarCY = cy + avatarR;

  if (profileImg) {
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
    const initials = review.reviewerName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
    ctx.fillStyle = "#6214a8";
    ctx.fill();
    ctx.font = `700 ${Math.round(28 * s)}px ${FONT_FAMILY}`;
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, avatarCX, avatarCY + 1);
    ctx.restore();
  }

  // -- Name + handle --
  const nameX = cx + avatarR * 2 + Math.round(16 * s);
  const nameFontSize = Math.round(41 * s);

  if (review.handle) {
    // Name on top, handle below — position name near top of avatar
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `700 ${nameFontSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = "#111827";
    ctx.fillText(review.reviewerName, nameX, avatarCY - avatarR + Math.round(4 * s));

    ctx.font = `400 ${Math.round(31 * s)}px ${FONT_FAMILY}`;
    ctx.fillStyle = "#9CA3AF";
    ctx.fillText(review.handle, nameX, avatarCY + Math.round(4 * s));
    ctx.restore();
  } else {
    // No handle — vertically center name with avatar
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${nameFontSize}px ${FONT_FAMILY}`;
    ctx.fillStyle = "#111827";
    ctx.fillText(review.reviewerName, nameX, avatarCY);
    ctx.restore();
  }

  cy += avatarRowH + gapAfterAvatar;

  // -- Business name --
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `600 ${Math.round(43 * s)}px ${FONT_FAMILY}`;
  ctx.fillStyle = "#6214a8";
  ctx.fillText(review.businessName, cardX + cardW / 2, cy);
  ctx.restore();

  cy += businessNameH + gapAfterBusiness;

  // -- Stars --
  const starFontSize = Math.round(53 * s);
  let starStr = "";
  for (let i = 0; i < 5; i++) {
    starStr += i < review.score ? "★" : "☆";
  }
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `400 ${starFontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = "#F59E0B";
  ctx.fillText(starStr, cardX + cardW / 2, cy);
  ctx.restore();

  cy += starsRowH + gapAfterStars;

  // -- Review text in WhatsApp-style green bubble --
  const bubbleW = contentW;
  const bubbleH = reviewLines.length * lineHeight + bubblePadY * 2;
  const bubbleX = cx;
  const bubbleY = cy;

  ctx.save();
  roundedRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, Math.round(16 * s));
  ctx.fillStyle = "#DCF8C6";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = `400 ${reviewFontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = "#1A1A1A";
  reviewLines.forEach((line, i) => {
    ctx.fillText(line, bubbleX + bubblePadX, bubbleY + bubblePadY + i * lineHeight);
  });
  ctx.restore();

  // ======== BOTTOM: @uplaudofficial ========
  const tagFontSize = Math.max(Math.round(52 * s), 32);
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.font = `700 ${tagFontSize}px ${FONT_FAMILY}`;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("@uplaudofficial", W / 2, H - Math.max(Math.round(40 * s), 30));
  ctx.restore();

  // ======== CONVERT TO BLOB ========
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
