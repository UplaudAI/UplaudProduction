/**
 * generateStoryImage.ts
 *
 * Generates a 1080×1920 Instagram Story image on a <canvas>
 * from review data, matching the Uplaud story design.
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
  // Create a temporary canvas
  const tmp = document.createElement("canvas");
  tmp.width = w;
  tmp.height = h;
  const tctx = tmp.getContext("2d")!;

  // Draw the logo
  tctx.drawImage(logoImg, 0, 0, w, h);

  // Turn all visible pixels white using compositing
  tctx.globalCompositeOperation = "source-in";
  tctx.fillStyle = "#FFFFFF";
  tctx.fillRect(0, 0, w, h);

  // Stamp onto main canvas
  ctx.drawImage(tmp, x, y);
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
  // Solid purple matching the mockup
  ctx.fillStyle = "#7C3AED";
  ctx.fillRect(0, 0, W, H);

  // ======== LOGO (white, centered, upper area) ========
  const actualLogoUrl = logoUrl || "/lovable-uploads/logo.png";
  const logoImg = await loadImage(actualLogoUrl);

  // We need the logo dimensions for centering, so compute them first
  let logoDrawH = 180; // fallback
  let logoDrawW = 380;
  if (logoImg) {
    const logoTargetW = 380;
    const logoScale = logoTargetW / logoImg.width;
    logoDrawW = Math.round(logoImg.width * logoScale);
    logoDrawH = Math.round(logoImg.height * logoScale);
  }

  // ======== LOAD PROFILE IMAGE ========
  let profileImg: HTMLImageElement | null = null;
  if (review.profileImage) {
    profileImg = await loadImage(review.profileImage);
  }

  // ======== CALCULATE CARD DIMENSIONS ========
  const cardMarginX = 64;
  const cardX = cardMarginX;
  const cardW = W - cardMarginX * 2;
  const cardPad = 56;
  const contentW = cardW - cardPad * 2;

  // Measure review text
  ctx.font = "400 36px 'DM Sans', Arial, sans-serif";
  const reviewLines = wrapText(ctx, review.reviewText, contentW);

  // Heights for each section
  const avatarRowH = 80;
  const businessNameH = 46;
  const starsRowH = 62;
  const reviewTextH = reviewLines.length * 50;

  const totalContentH =
    avatarRowH +
    26 + // gap after avatar row
    businessNameH +
    14 + // gap after business name
    starsRowH +
    22 + // gap after stars
    reviewTextH;

  const cardH = totalContentH + cardPad * 2;

  // Center the entire logo+card group vertically on the canvas
  const gap = 60;
  const groupH = logoDrawH + gap + cardH;
  const groupTopY = Math.round((H - groupH) / 2);

  // Draw the logo at the top of the centered group
  const logoY = groupTopY;
  if (logoImg) {
    const logoX = Math.round((W - logoDrawW) / 2);
    drawLogoWhite(ctx, logoImg, logoX, logoY, logoDrawW, logoDrawH);
  } else {
    ctx.save();
    ctx.font = "300 72px 'DM Sans', sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("uplaud", W / 2, logoY);
    ctx.restore();
  }

  const cardY = groupTopY + logoDrawH + gap;

  // ======== DRAW CARD ========
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 6;
  roundedRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.restore();

  // ======== CARD CONTENT ========
  const cx = cardX + cardPad;
  let cy = cardY + cardPad;

  // -- Profile photo / avatar --
  const avatarR = 34;
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
    ctx.fillStyle = "#7C3AED";
    ctx.fill();
    ctx.font = "700 24px 'DM Sans', Arial, sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, avatarCX, avatarCY + 1);
    ctx.restore();
  }

  // -- Name --
  const nameX = cx + avatarR * 2 + 16;
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "700 36px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "#111827";
  ctx.fillText(review.reviewerName, nameX, cy + 2);

  // -- Handle --
  if (review.handle) {
    ctx.font = "400 26px 'DM Sans', Arial, sans-serif";
    ctx.fillStyle = "#9CA3AF";
    ctx.fillText(review.handle, nameX, cy + 42);
  }
  ctx.restore();

  cy += avatarRowH + 26;

  // -- Business name (2pt larger than review text) --
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "600 38px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "#6B21A8";
  ctx.fillText(review.businessName, cardX + cardW / 2, cy);
  ctx.restore();

  cy += businessNameH + 14;

  // -- Stars (orange, centered) --
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const starFontSize = 48;
  let starStr = "";
  for (let i = 0; i < 5; i++) {
    starStr += i < review.score ? "★" : "☆";
  }
  ctx.font = `400 ${starFontSize}px Arial, sans-serif`;
  ctx.fillStyle = "#F59E0B";
  ctx.fillText(starStr, cardX + cardW / 2, cy);
  ctx.restore();

  cy += starsRowH + 22;

  // -- Review text (green, #25D366 WhatsApp green) --
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "400 36px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "#25D366";
  reviewLines.forEach((line, i) => {
    ctx.fillText(line, cx, cy + i * 50);
  });
  ctx.restore();

  // ======== BOTTOM: @uplaudofficial ========
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.font = "700 36px 'DM Sans', Arial, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fillText("@uplaudofficial", W / 2, H - 80);
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
