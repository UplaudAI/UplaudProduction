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
 * The source logo is purple on transparent — we draw it to a temp canvas,
 * then use compositing to turn it white before stamping it.
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
 * Compute scaled dimensions for the layout.
 * We start at scale=1.0 (base sizes) and shrink if the total
 * height of logo + gap + card exceeds the available canvas space.
 */
function computeLayout(
  ctx: CanvasRenderingContext2D,
  reviewText: string,
  logoDrawH: number,
  W: number,
  H: number,
  scale: number
) {
  const cardMarginX = Math.round(48 * Math.max(scale, 0.7));
  const cardW = W - cardMarginX * 2;
  const cardPad = Math.round(60 * scale);
  const contentW = cardW - cardPad * 2;

  const bubblePadX = Math.round(36 * scale);
  const bubblePadY = Math.round(28 * scale);
  const reviewFontSize = Math.round(41 * scale);
  const lineHeight = Math.round(55 * scale);

  ctx.font = `400 ${reviewFontSize}px 'DM Sans', Arial, sans-serif`;
  const reviewLines = wrapText(ctx, reviewText, contentW - bubblePadX * 2);

  const avatarRowH = Math.round(86 * scale);
  const businessNameH = Math.round(52 * scale);
  const starsRowH = Math.round(68 * scale);
  const reviewTextH = reviewLines.length * lineHeight + bubblePadY * 2;

  const gapAfterAvatar = Math.round(28 * scale);
  const gapAfterBusiness = Math.round(16 * scale);
  const gapAfterStars = Math.round(24 * scale);

  const totalContentH =
    avatarRowH + gapAfterAvatar +
    businessNameH + gapAfterBusiness +
    starsRowH + gapAfterStars +
    reviewTextH;

  const cardH = totalContentH + cardPad * 2;

  const logoGap = Math.round(60 * scale);
  const bottomTagH = Math.round(100 * scale); // space for @uplaudofficial
  const topBottomPad = 60; // minimum padding top and bottom

  const groupH = logoDrawH * scale + logoGap + cardH + bottomTagH + topBottomPad * 2;

  return {
    fits: groupH <= H,
    cardMarginX,
    cardW,
    cardPad,
    contentW,
    bubblePadX,
    bubblePadY,
    reviewFontSize,
    lineHeight,
    reviewLines,
    avatarRowH,
    businessNameH,
    starsRowH,
    reviewTextH,
    gapAfterAvatar,
    gapAfterBusiness,
    gapAfterStars,
    cardH,
    logoGap,
    bottomTagH,
    groupH,
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
    const logoScale = logoTargetW / logoImg.width;
    baseLogoW = Math.round(logoImg.width * logoScale);
    baseLogoH = Math.round(logoImg.height * logoScale);
  }

  // ======== LOAD PROFILE IMAGE ========
  let profileImg: HTMLImageElement | null = null;
  if (review.profileImage) {
    profileImg = await loadImage(review.profileImage);
  }

  // ======== FIND THE RIGHT SCALE ========
  // Start at 1.0, shrink by 0.05 until everything fits.
  // Minimum scale 0.5 to keep things readable.
  let scale = 1.0;
  let layout = computeLayout(ctx, review.reviewText, baseLogoH, W, H, scale);

  while (!layout.fits && scale > 0.5) {
    scale -= 0.05;
    layout = computeLayout(ctx, review.reviewText, baseLogoH, W, H, scale);
  }

  console.log(`[generateStoryImage] baseLogoH=${baseLogoH} scale=${scale.toFixed(2)} groupH=${layout.groupH} cardH=${layout.cardH} lines=${layout.reviewLines.length} fits=${layout.fits}`);

  const s = scale; // shorthand

  // ======== DERIVED DIMENSIONS ========
  const {
    cardMarginX, cardW, cardPad, contentW,
    bubblePadX, bubblePadY, reviewFontSize, lineHeight,
    reviewLines, avatarRowH, businessNameH, starsRowH,
    reviewTextH, gapAfterAvatar, gapAfterBusiness, gapAfterStars,
    cardH, logoGap,
  } = layout;

  const cardX = cardMarginX;

  // Scaled logo dimensions
  const logoW = Math.round(baseLogoW * s);
  const logoH = Math.round(baseLogoH * s);

  // Center the logo+card group vertically, reserving space for the bottom tag
  const bottomTagSpace = Math.max(Math.round(100 * s), 80);
  const totalGroupH = logoH + logoGap + cardH;
  const availableH = H - bottomTagSpace;
  const groupTopY = Math.max(30, Math.round((availableH - totalGroupH) / 2));

  console.log(`[draw] logoH=${logoH} logoGap=${logoGap} cardH=${cardH} totalGroupH=${totalGroupH} groupTopY=${groupTopY} cardBottom=${groupTopY + totalGroupH} bottomTag=${H - bottomTagSpace} H=${H}`);

  // ======== DRAW LOGO ========
  const logoY = groupTopY;
  if (logoImg) {
    const logoX = Math.round((W - logoW) / 2);
    drawLogoWhite(ctx, logoImg, logoX, logoY, logoW, logoH);
  } else {
    ctx.save();
    ctx.font = `300 ${Math.round(72 * s)}px 'DM Sans', sans-serif`;
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
    ctx.font = `700 ${Math.round(28 * s)}px 'DM Sans', Arial, sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, avatarCX, avatarCY + 1);
    ctx.restore();
  }

  // -- Name + handle --
  const nameX = cx + avatarR * 2 + Math.round(16 * s);
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = `700 ${Math.round(41 * s)}px 'DM Sans', Arial, sans-serif`;
  ctx.fillStyle = "#111827";
  ctx.fillText(review.reviewerName, nameX, cy + 2);

  if (review.handle) {
    ctx.font = `400 ${Math.round(31 * s)}px 'DM Sans', Arial, sans-serif`;
    ctx.fillStyle = "#9CA3AF";
    ctx.fillText(review.handle, nameX, cy + Math.round(46 * s));
  }
  ctx.restore();

  cy += avatarRowH + gapAfterAvatar;

  // -- Business name --
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `600 ${Math.round(43 * s)}px 'DM Sans', Arial, sans-serif`;
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
  ctx.font = `400 ${starFontSize}px Arial, sans-serif`;
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
  ctx.font = `400 ${reviewFontSize}px 'DM Sans', Arial, sans-serif`;
  ctx.fillStyle = "#1A1A1A";
  reviewLines.forEach((line, i) => {
    ctx.fillText(line, bubbleX + bubblePadX, bubbleY + bubblePadY + i * lineHeight);
  });
  ctx.restore();

  // ======== BOTTOM: @uplaudofficial ========
  const tagFontSize = Math.round(52 * s);
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.font = `700 ${Math.max(tagFontSize, 32)}px 'DM Sans', Arial, sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("@uplaudofficial", W / 2, H - Math.round(60 * s));
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
