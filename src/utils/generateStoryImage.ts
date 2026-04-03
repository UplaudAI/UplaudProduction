/**
 * generateStoryImage.ts
 *
 * Generates a 1080×1920 Instagram Story image on a <canvas>.
 * Auto-scales text size for long reviews to always fit.
 */

export interface ReviewData {
  reviewerName: string;
  businessName: string;
  reviewText: string;
  score: number;
  handle?: string;
  profileImage?: string;
  likes?: number;
  reviewCount?: number;
  categories?: string[];
}

const FF = "Arial, sans-serif";

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(res => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

function drawLogoWhite(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const tmp = document.createElement("canvas");
  tmp.width = w; tmp.height = h;
  const t = tmp.getContext("2d")!;
  t.drawImage(img, 0, 0, w, h);
  t.globalCompositeOperation = "source-in";
  t.fillStyle = "#FFFFFF";
  t.fillRect(0, 0, w, h);
  ctx.drawImage(tmp, x, y);
}

/** Compute layout at a given scale factor and return whether it fits. */
function computeLayout(
  ctx: CanvasRenderingContext2D,
  review: ReviewData,
  baseLogoH: number,
  W: number, H: number,
  s: number
) {
  const cardMX = Math.round(48 * Math.max(s, 0.65));
  const cardW = W - cardMX * 2;
  const cardPad = Math.round(52 * s);
  const contentW = cardW - cardPad * 2;

  // Bubble sizing
  const bubPadX = Math.round(32 * s);
  const bubPadY = Math.round(24 * s);
  const revFont = Math.round(38 * s);
  const lineH = Math.round(52 * s);
  ctx.font = `400 ${revFont}px ${FF}`;
  const lines = wrapText(ctx, `\u201C${review.reviewText}\u201D`, contentW - bubPadX * 2);

  const avatarRowH = Math.round(82 * s);
  const bizH = Math.round(48 * s);
  const tagRowH = review.categories?.length ? Math.round(44 * s) : 0;
  const starH = Math.round(52 * s);
  const revTextH = lines.length * lineH + bubPadY * 2;

  const gaps = Math.round(22 * s) + Math.round(10 * s) + (tagRowH ? Math.round(10 * s) : 0) + Math.round(14 * s) + Math.round(18 * s);
  const cardH = avatarRowH + bizH + tagRowH + starH + revTextH + gaps + cardPad * 2;

  const logoH = Math.round(baseLogoH * s);
  const logoGap = Math.round(50 * s);
  const stickerH = Math.round(200 * s);
  const followH = Math.round(60 * s);
  const topPad = 30;

  const total = topPad + logoH + logoGap + cardH + Math.round(30 * s) + stickerH + followH;

  return {
    fits: total <= H, total,
    cardMX, cardW, cardPad, contentW,
    bubPadX, bubPadY, revFont, lineH, lines,
    avatarRowH, bizH, tagRowH, starH, revTextH, gaps,
    cardH, logoH, logoGap, stickerH, followH,
  };
}

export async function generateStoryImage(
  review: ReviewData,
  logoUrl?: string
): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background: purple → lavender gradient ──
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#7B2FBE");
  bg.addColorStop(0.55, "#9B4FD6");
  bg.addColorStop(1, "#C8A8E8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Logo ──
  const logoImg = await loadImage(logoUrl || "/lovable-uploads/logo.png");
  let baseLH = 180, baseLW = 360;
  if (logoImg) {
    const ls = 360 / logoImg.width;
    baseLW = Math.round(logoImg.width * ls);
    baseLH = Math.round(logoImg.height * ls);
  }

  let profileImg: HTMLImageElement | null = null;
  if (review.profileImage) profileImg = await loadImage(review.profileImage);

  // ── Scale to fit ──
  let s = 1.0;
  let L = computeLayout(ctx, review, baseLH, W, H, s);
  while (!L.fits && s > 0.5) { s -= 0.05; L = computeLayout(ctx, review, baseLH, W, H, s); }

  const {
    cardMX, cardW, cardPad, contentW,
    bubPadX, bubPadY, revFont, lineH, lines,
    avatarRowH, bizH, tagRowH, starH, revTextH,
    cardH, logoH, logoGap, stickerH, followH,
  } = L;

  const logoW = Math.round(baseLW * s);
  const lH = logoH;

  // Center group
  const totalGroup = lH + logoGap + cardH + Math.round(30 * s) + stickerH + followH;
  const groupY = Math.max(30, Math.round((H - totalGroup) / 2));

  // ── Draw logo ──
  if (logoImg) {
    drawLogoWhite(ctx, logoImg, Math.round((W - logoW) / 2), groupY, logoW, lH);
  } else {
    ctx.save();
    ctx.font = `300 ${Math.round(72 * s)}px ${FF}`;
    ctx.fillStyle = "#FFF";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText("uplaud", W / 2, groupY);
    ctx.restore();
  }

  // ── Card ──
  const cardX = cardMX;
  const cardY = groupY + lH + logoGap;
  const cx = cardX + cardPad;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.12)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 4;
  roundedRect(ctx, cardX, cardY, cardW, cardH, Math.round(24 * s));
  ctx.fillStyle = "#FFF7E6";
  ctx.fill();
  ctx.restore();

  let cy = cardY + cardPad;

  // ── Avatar row ──
  const aR = Math.round(36 * s);
  const aCX = cx + aR, aCY = cy + aR;

  if (profileImg) {
    ctx.save();
    ctx.beginPath(); ctx.arc(aCX, aCY, aR, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(profileImg, aCX - aR, aCY - aR, aR * 2, aR * 2);
    ctx.restore();
  } else {
    const ini = review.reviewerName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    ctx.save();
    ctx.beginPath(); ctx.arc(aCX, aCY, aR, 0, Math.PI * 2);
    ctx.fillStyle = "#6214a8"; ctx.fill();
    ctx.font = `700 ${Math.round(26 * s)}px ${FF}`;
    ctx.fillStyle = "#FFF"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(ini, aCX, aCY + 1);
    ctx.restore();
  }

  const nameX = cx + aR * 2 + Math.round(16 * s);
  const nameSz = Math.round(38 * s);
  if (review.reviewCount) {
    // Name top, review count below
    ctx.save();
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.font = `700 ${nameSz}px ${FF}`; ctx.fillStyle = "#111";
    ctx.fillText(review.reviewerName, nameX, aCY - Math.round(22 * s));
    ctx.font = `600 ${Math.round(26 * s)}px ${FF}`; ctx.fillStyle = "#22c55e";
    ctx.fillText(`${review.reviewCount} reviews`, nameX, aCY + Math.round(8 * s));
    ctx.restore();
  } else if (review.handle) {
    ctx.save();
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.font = `700 ${nameSz}px ${FF}`; ctx.fillStyle = "#111";
    ctx.fillText(review.reviewerName, nameX, aCY - Math.round(22 * s));
    ctx.font = `400 ${Math.round(28 * s)}px ${FF}`; ctx.fillStyle = "#9CA3AF";
    ctx.fillText(review.handle, nameX, aCY + Math.round(8 * s));
    ctx.restore();
  } else {
    ctx.save();
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.font = `700 ${nameSz}px ${FF}`; ctx.fillStyle = "#111";
    ctx.fillText(review.reviewerName, nameX, aCY);
    ctx.restore();
  }

  cy += avatarRowH + Math.round(22 * s);

  // ── Business name ──
  const bizFont = Math.round(42 * s);
  ctx.save();
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = `700 ${bizFont}px ${FF}`; ctx.fillStyle = "#111";
  ctx.fillText(review.businessName, cx, cy);
  ctx.restore();
  cy += bizH + Math.round(10 * s);

  // ── Category tags ──
  if (review.categories?.length) {
    let tagX = cx;
    const tagFont = Math.round(22 * s);
    const tagH = Math.round(32 * s);
    const tagPadX = Math.round(16 * s);
    const tagR = Math.round(8 * s);

    for (const cat of review.categories) {
      ctx.font = `600 ${tagFont}px ${FF}`;
      const tw = ctx.measureText(cat).width + tagPadX * 2;

      ctx.save();
      roundedRect(ctx, tagX, cy, tw, tagH, tagR);
      ctx.fillStyle = "#FCE4E4";
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.font = `600 ${tagFont}px ${FF}`; ctx.fillStyle = "#B45454";
      ctx.fillText(cat, tagX + tagPadX, cy + tagH / 2);
      ctx.restore();

      tagX += tw + Math.round(10 * s);
    }
    cy += tagRowH + Math.round(10 * s);
  }

  // ── Stars + score ──
  const starSz = Math.round(44 * s);
  const fullStars = Math.floor(review.score);
  let starStr = "";
  for (let i = 0; i < 5; i++) starStr += i < fullStars ? "★" : "☆";

  ctx.save();
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = `400 ${starSz}px ${FF}`; ctx.fillStyle = "#F59E0B";
  ctx.fillText(starStr, cx, cy);
  const starTextW = ctx.measureText(starStr).width;

  ctx.font = `700 ${Math.round(36 * s)}px ${FF}`; ctx.fillStyle = "#333";
  ctx.fillText(review.score.toFixed(1), cx + starTextW + Math.round(12 * s), cy + Math.round(4 * s));
  ctx.restore();
  cy += starH + Math.round(14 * s);

  // ── Review text in green bubble ──
  const bubW = contentW;
  const bubH = lines.length * lineH + bubPadY * 2;

  ctx.save();
  roundedRect(ctx, cx, cy, bubW, bubH, Math.round(14 * s));
  ctx.fillStyle = "#DCF8C6";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = `400 ${revFont}px ${FF}`; ctx.fillStyle = "#1A1A1A";
  lines.forEach((line, i) => {
    ctx.fillText(line, cx + bubPadX, cy + bubPadY + i * lineH);
  });
  ctx.restore();

  cy += bubH + Math.round(18 * s);

  // ── Bottom sticker area ──
  // "ask me before google" text badge + uplaud.ai
  const stickerY = cardY + cardH + Math.round(30 * s);
  const stickerCX = W / 2;

  // Rounded sticker shape
  const stW = Math.round(500 * s);
  const stH = Math.round(160 * s);
  const stX = stickerCX - stW / 2;
  const stY = stickerY;

  ctx.save();
  roundedRect(ctx, stX, stY, stW, stH, Math.round(30 * s));
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fill();
  ctx.strokeStyle = "#7DD3C0";
  ctx.lineWidth = Math.round(3 * s);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = `800 ${Math.round(30 * s)}px ${FF}`; ctx.fillStyle = "#6214a8";
  ctx.fillText("ask me", stickerCX, stY + Math.round(35 * s));
  ctx.font = `800 ${Math.round(30 * s)}px ${FF}`; ctx.fillStyle = "#6214a8";
  ctx.fillText("before google", stickerCX, stY + Math.round(68 * s));
  ctx.font = `600 ${Math.round(24 * s)}px ${FF}`; ctx.fillStyle = "#22c55e";
  ctx.fillText("uplaud.ai", stickerCX, stY + Math.round(105 * s));
  ctx.restore();

  // ── Follow @uplaudofficial ──
  const followY = stY + stH + Math.round(30 * s);
  ctx.save();
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.font = `500 ${Math.round(34 * s)}px ${FF}`; ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("Follow ", W / 2 - ctx.measureText("@uplaudofficial").width / 2, followY);
  // Measure "Follow " width
  const fW = ctx.measureText("Follow ").width;
  ctx.font = `700 ${Math.round(34 * s)}px ${FF}`; ctx.fillStyle = "#FFF";
  ctx.fillText("@uplaudofficial", W / 2 - ctx.measureText("@uplaudofficial").width / 2 + fW, followY);
  ctx.restore();

  // Simpler approach: draw as one line
  ctx.save();
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  // Clear previous attempt by overdrawing background
  ctx.font = `600 ${Math.round(34 * s)}px ${FF}`; ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillText("Follow @uplaudofficial", W / 2, followY);
  ctx.restore();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => { if (blob) resolve(blob); else reject(new Error("Failed")); }, "image/png");
  });
}
