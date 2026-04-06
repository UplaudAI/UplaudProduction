/**
 * generateStoryImage.ts
 *
 * Generates a 1080×1920 Instagram Story image on a <canvas>.
 * Auto-scales everything so long reviews always fit.
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

// ── Exact brand colors ──
const COL = {
  bgTop:      "#7600B6",
  bgBot:      "#E1C2FC",
  cardCream:  "#FFF7E4",
  cardGreen:  "#D6F9C2",
  purple:     "#6214A8",
  peach:      "#FFDFBE",
  starFill:   "#FFCA00",
  starEmpty:  "#D9D9D9",
  black:      "#000000",
  white:      "#FFFFFF",
  followText: "#FFFFFF",
};

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
  t.fillStyle = COL.white;
  t.fillRect(0, 0, w, h);
  ctx.drawImage(tmp, x, y);
}

function computeLayout(
  ctx: CanvasRenderingContext2D,
  review: ReviewData,
  baseLogoH: number,
  W: number, H: number,
  s: number
) {
  const cardMX   = Math.round(52 * Math.max(s, 0.65));
  const cardW    = W - cardMX * 2;
  const cardPad  = Math.round(52 * s);
  const contentW = cardW - cardPad * 2;

  const bubPadX = Math.round(32 * s);
  const bubPadY = Math.round(24 * s);
  const revFont = Math.round(36 * s);
  const lineH   = Math.round(50 * s);

  ctx.font = `400 ${revFont}px ${FF}`;
  const lines = wrapText(ctx, `\u201C${review.reviewText}\u201D`, contentW - bubPadX * 2);

  const avatarRowH = Math.round(80 * s);
  const bizH      = Math.round(50 * s);
  const tagRowH   = review.categories?.length ? Math.round(42 * s) : 0;
  const starH     = Math.round(54 * s);
  const revTextH  = lines.length * lineH + bubPadY * 2;

  const g1 = Math.round(22 * s); // after avatar
  const g2 = Math.round(12 * s); // after biz
  const g3 = tagRowH ? Math.round(10 * s) : 0; // after tags
  const g4 = Math.round(14 * s); // after stars
  const g5 = Math.round(14 * s); // after bubble (before card bottom pad)

  const cardH = cardPad + avatarRowH + g1 + bizH + g2 + tagRowH + g3 + starH + g4 + revTextH + g5 + cardPad;

  const logoH      = Math.round(baseLogoH * s);
  const logoGap    = Math.round(50 * s);
  const stickerH   = Math.round(220 * s);
  const followH    = Math.round(70 * s);
  const topPad     = 40;
  const botPad     = 30;

  const total = topPad + logoH + logoGap + cardH + Math.round(28 * s) + stickerH + followH + botPad;

  return {
    fits: total <= H,
    cardMX, cardW, cardPad, contentW,
    bubPadX, bubPadY, revFont, lineH, lines,
    avatarRowH, bizH, tagRowH, starH, revTextH,
    g1, g2, g3, g4, g5,
    cardH, logoH, logoGap, stickerH, followH,
  };
}

export async function generateStoryImage(review: ReviewData, logoUrl?: string): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background gradient: top purple → bottom lavender ──
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, COL.bgTop);
  bg.addColorStop(1, COL.bgBot);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Load assets ──
  const logoImg    = await loadImage(logoUrl || "/lovable-uploads/logo.png");
  // Use transparent PNG version of the sticker
  const stickerImg = await loadImage("/lovable-uploads/sticker-ask-me.png");
  let profileImg: HTMLImageElement | null = null;
  if (review.profileImage) profileImg = await loadImage(review.profileImage);

  // ── Logo dimensions ──
  let baseLH = 180, baseLW = 360;
  if (logoImg) {
    const ls = 360 / logoImg.width;
    baseLW = Math.round(logoImg.width * ls);
    baseLH = Math.round(logoImg.height * ls);
  }

  // ── Find scale ──
  let s = 1.0;
  let L = computeLayout(ctx, review, baseLH, W, H, s);
  while (!L.fits && s > 0.5) { s -= 0.05; L = computeLayout(ctx, review, baseLH, W, H, s); }

  const {
    cardMX, cardW, cardPad, contentW,
    bubPadX, bubPadY, revFont, lineH, lines,
    avatarRowH, bizH, tagRowH, starH, revTextH,
    g1, g2, g3, g4, g5,
    cardH, logoH, logoGap, stickerH, followH,
  } = L;

  const logoW = Math.round(baseLW * s);
  const totalGroup = logoH + logoGap + cardH + Math.round(28 * s) + stickerH + followH;
  const groupY = Math.max(40, Math.round((H - totalGroup) / 2));

  // ── Logo ──
  if (logoImg) {
    drawLogoWhite(ctx, logoImg, Math.round((W - logoW) / 2), groupY, logoW, logoH);
  }

  // ── Card ──
  const cardX = cardMX;
  const cardY = groupY + logoH + logoGap;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.12)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 4;
  roundedRect(ctx, cardX, cardY, cardW, cardH, Math.round(24 * s));
  ctx.fillStyle = COL.cardCream;
  ctx.fill();
  ctx.restore();

  const cx = cardX + cardPad;
  let cy = cardY + cardPad;

  // ── Avatar ──
  const aR  = Math.round(36 * s);
  const aCX = cx + aR;
  const aCY = cy + aR;

  if (profileImg) {
    ctx.save();
    ctx.beginPath(); ctx.arc(aCX, aCY, aR, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(profileImg, aCX - aR, aCY - aR, aR * 2, aR * 2);
    ctx.restore();
  } else {
    const ini = review.reviewerName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    ctx.save();
    ctx.beginPath(); ctx.arc(aCX, aCY, aR, 0, Math.PI * 2);
    ctx.fillStyle = COL.purple; ctx.fill();
    ctx.font = `700 ${Math.round(24 * s)}px ${FF}`;
    ctx.fillStyle = COL.white; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(ini, aCX, aCY + 1);
    ctx.restore();
  }

  // Name + review count
  const nameX  = cx + aR * 2 + Math.round(14 * s);
  const nameSz = Math.round(36 * s);

  if (review.reviewCount) {
    ctx.save();
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.font = `700 ${nameSz}px ${FF}`; ctx.fillStyle = COL.black;
    ctx.fillText(review.reviewerName, nameX, aCY - Math.round(20 * s));
    ctx.font = `600 ${Math.round(24 * s)}px ${FF}`; ctx.fillStyle = COL.purple;
    ctx.fillText(`${review.reviewCount} reviews`, nameX, aCY + Math.round(8 * s));
    ctx.restore();
  } else if (review.handle) {
    ctx.save();
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.font = `700 ${nameSz}px ${FF}`; ctx.fillStyle = COL.black;
    ctx.fillText(review.reviewerName, nameX, aCY - Math.round(20 * s));
    ctx.font = `400 ${Math.round(26 * s)}px ${FF}`; ctx.fillStyle = "#9CA3AF";
    ctx.fillText(review.handle, nameX, aCY + Math.round(8 * s));
    ctx.restore();
  } else {
    ctx.save();
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.font = `700 ${nameSz}px ${FF}`; ctx.fillStyle = COL.black;
    ctx.fillText(review.reviewerName, nameX, aCY);
    ctx.restore();
  }

  cy += avatarRowH + g1;

  // ── Business name ──
  ctx.save();
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = `700 ${Math.round(40 * s)}px ${FF}`; ctx.fillStyle = COL.black;
  ctx.fillText(review.businessName, cx, cy);
  ctx.restore();
  cy += bizH + g2;

  // ── Category tags ──
  if (review.categories?.length) {
    let tagX = cx;
    const tagFont = Math.round(22 * s);
    const tagH    = Math.round(34 * s);
    const tagPadX = Math.round(18 * s);
    const tagR    = Math.round(10 * s);

    for (const cat of review.categories) {
      ctx.font = `600 ${tagFont}px ${FF}`;
      const tw = ctx.measureText(cat).width + tagPadX * 2;
      ctx.save();
      roundedRect(ctx, tagX, cy, tw, tagH, tagR);
      ctx.fillStyle = COL.peach; ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.font = `600 ${tagFont}px ${FF}`; ctx.fillStyle = COL.black;
      ctx.fillText(cat, tagX + tagPadX, cy + tagH / 2);
      ctx.restore();
      tagX += tw + Math.round(10 * s);
    }
    cy += tagRowH + g3;
  }

  // ── Stars + score ──
  const starSz   = Math.round(44 * s);
  const fullStars = Math.floor(review.score);
  let starX = cx;

  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.font = `400 ${starSz}px ${FF}`;
    ctx.fillStyle = i < fullStars ? COL.starFill : COL.starEmpty;
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText("★", starX, cy);
    starX += Math.round(starSz * 0.95);
    ctx.restore();
  }

  ctx.save();
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = `700 ${Math.round(34 * s)}px ${FF}`; ctx.fillStyle = COL.black;
  ctx.fillText(review.score.toFixed(1), starX + Math.round(10 * s), cy + Math.round(4 * s));
  ctx.restore();
  cy += starH + g4;

  // ── Review text in green bubble ──
  const bubW = contentW;
  const bubH = lines.length * lineH + bubPadY * 2;

  ctx.save();
  roundedRect(ctx, cx, cy, bubW, bubH, Math.round(14 * s));
  ctx.fillStyle = COL.cardGreen; ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = `400 ${revFont}px ${FF}`; ctx.fillStyle = COL.black;
  lines.forEach((line, i) => {
    ctx.fillText(line, cx + bubPadX, cy + bubPadY + i * lineH);
  });
  ctx.restore();

  // ── Bottom section: sticker centered, Follow text below ──
  const bottomAreaY = cardY + cardH + Math.round(24 * s);
  const bottomAreaH = H - bottomAreaY - Math.round(40 * s);

  // "Follow @uplaudofficial" text at very bottom
  const followFontSz = Math.round(32 * s);
  const followY = H - Math.round(60 * s);
  ctx.save();
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = `600 ${followFontSz}px ${FF}`; ctx.fillStyle = COL.followText;
  ctx.fillText("Follow @uplaudofficial", W / 2, followY);
  ctx.restore();

  // Sticker centered in the remaining space above follow text
  if (stickerImg) {
    const stickerAspect = stickerImg.width / stickerImg.height;
    // Use available height to size sticker, but cap width
    const availH = followY - Math.round(16 * s) - bottomAreaY;
    const stickerH2 = Math.min(availH, Math.round(stickerH));
    const stickerW2 = Math.round(stickerH2 * stickerAspect);
    const stickerX2 = Math.round((W - stickerW2) / 2);
    const stickerY2 = Math.round(bottomAreaY + (availH - stickerH2) / 2);
    ctx.drawImage(stickerImg, stickerX2, stickerY2, stickerW2, stickerH2);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => { if (blob) resolve(blob); else reject(new Error("Failed")); }, "image/png");
  });
}
