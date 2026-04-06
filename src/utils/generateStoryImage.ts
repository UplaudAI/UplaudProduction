/**
 * generateStoryImage.ts — Uplaud Instagram Story card generator
 *
 * Layout (top to bottom):
 *  - Purple→lavender gradient background
 *  - Uplaud logo (white) centered at top
 *  - White-border card fills most of the canvas:
 *      TOP (cream #FFF7E4):  avatar circle + name + review count
 *      BOTTOM (green #D6F9C2): biz name, category tags, stars+score, review text
 *  - Sticker overlaps card bottom-right corner
 *  - "Follow @uplaudofficial" centered at very bottom
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

const COL = {
  bgTop:     "#7600B6",
  bgBot:     "#E1C2FC",
  cardCream: "#FFF7E4",
  cardGreen: "#D6F9C2",
  purple:    "#6214A8",
  peach:     "#FFDFBE",
  starFill:  "#FFCA00",
  starEmpty: "#D9D9D9",
  black:     "#000000",
  white:     "#FFFFFF",
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

function drawStickerNoWhite(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const tmp = document.createElement("canvas");
  tmp.width = Math.round(w); tmp.height = Math.round(h);
  const t = tmp.getContext("2d")!;
  t.drawImage(img, 0, 0, Math.round(w), Math.round(h));
  const imgData = t.getImageData(0, 0, Math.round(w), Math.round(h));
  const d = imgData.data;
  const visited = new Uint8Array(Math.round(w) * Math.round(h));
  const queue: number[] = [];
  const iw = Math.round(w);
  function isNearWhite(idx: number) { return d[idx] > 240 && d[idx+1] > 240 && d[idx+2] > 240; }
  const corners = [0, iw - 1, iw * (Math.round(h) - 1), iw * Math.round(h) - 1];
  for (const c of corners) { if (!visited[c] && isNearWhite(c * 4)) { visited[c] = 1; queue.push(c); } }
  while (queue.length > 0) {
    const idx = queue.pop()!;
    d[idx * 4 + 3] = 0;
    const px = idx % iw, py = Math.floor(idx / iw);
    const ns = [px > 0 ? idx-1 : -1, px < iw-1 ? idx+1 : -1, py > 0 ? idx-iw : -1, py < Math.round(h)-1 ? idx+iw : -1];
    for (const n of ns) { if (n >= 0 && !visited[n] && isNearWhite(n * 4)) { visited[n] = 1; queue.push(n); } }
  }
  t.putImageData(imgData, 0, 0);
  ctx.drawImage(tmp, x, y);
}

export async function generateStoryImage(review: ReviewData, logoUrl?: string): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Background ──
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, COL.bgTop);
  bg.addColorStop(1, COL.bgBot);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Load images ──
  const logoImg    = await loadImage(logoUrl || "/lovable-uploads/logo.png");
  const stickerImg = await loadImage("/lovable-uploads/sticker-ask-me.png");
  let profileImg: HTMLImageElement | null = null;
  if (review.profileImage) profileImg = await loadImage(review.profileImage);

  // ── Fixed layout constants ──
  const LOGO_TOP   = 60;
  const LOGO_W     = 420;
  const CARD_MX    = 48;
  const CARD_PAD   = 52;
  const CARD_R     = 24;
  const AVATAR_R   = 40;
  const BIZ_FONT   = 46;
  const TAG_FONT   = 24;
  const STAR_SZ    = 48;
  const REV_FONT   = 42;
  const LINE_H     = 58;
  const FOLLOW_FONT= 36;

  // Logo
  let logoH = 180;
  if (logoImg) {
    const ls = LOGO_W / logoImg.width;
    logoH = Math.round(logoImg.height * ls);
    drawLogoWhite(ctx, logoImg, Math.round((W - LOGO_W) / 2), LOGO_TOP, LOGO_W, logoH);
  }

  // ── Card geometry ──
  const cardX  = CARD_MX;
  const cardW  = W - CARD_MX * 2;
  const cardY  = LOGO_TOP + logoH + 50;
  const cx     = cardX + CARD_PAD;
  const contentW = cardW - CARD_PAD * 2;

  // Measure avatar row height
  const avatarRowH = AVATAR_R * 2 + 10;   // circle + breathing room

  // Measure review text
  ctx.font = `400 ${REV_FONT}px ${FF}`;
  const lines = wrapText(ctx, `\u201C${review.reviewText}\u201D`, contentW);
  const revTextH = lines.length * LINE_H;

  // Cream section height: top padding + avatar row + bottom padding
  const creamH = CARD_PAD + avatarRowH + CARD_PAD;

  // Green section content: biz + tags + stars + gap + review text + bottom pad
  const tagRowH  = review.categories?.length ? 36 : 0;
  const tagGap   = review.categories?.length ? 14 : 0;
  const greenContentH = 10 + BIZ_FONT + 14 + tagRowH + tagGap + STAR_SZ + 20 + revTextH;
  const greenSectionH = greenContentH + CARD_PAD;

  // Force card to fill most of the canvas
  // Reserve space at bottom for: sticker overhang below card + follow text
  const STICKER_W    = 460;
  const STICKER_ASPECT = stickerImg ? stickerImg.width / stickerImg.height : 2.1;
  const STICKER_H    = Math.round(STICKER_W / STICKER_ASPECT);
  const FOLLOW_RESERVE = STICKER_H * 0.60 + FOLLOW_FONT + 40; // below card
  const minCardH = H - cardY - FOLLOW_RESERVE - 40;
  const cardH = Math.max(creamH + greenSectionH, minCardH);

  // ── Draw card ──
  // Full card in green first
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.12)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 6;
  roundedRect(ctx, cardX, cardY, cardW, cardH, CARD_R);
  ctx.fillStyle = COL.cardGreen;
  ctx.fill();
  ctx.restore();

  // Cream top section (only avatar row)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cardX + CARD_R, cardY);
  ctx.lineTo(cardX + cardW - CARD_R, cardY);
  ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + CARD_R);
  ctx.lineTo(cardX + cardW, cardY + creamH);
  ctx.lineTo(cardX, cardY + creamH);
  ctx.lineTo(cardX, cardY + CARD_R);
  ctx.quadraticCurveTo(cardX, cardY, cardX + CARD_R, cardY);
  ctx.closePath();
  ctx.fillStyle = COL.cardCream;
  ctx.fill();
  ctx.restore();

  // ── Avatar row (on cream) ──
  let cy = cardY + CARD_PAD;
  const aCX = cx + AVATAR_R;
  const aCY = cy + AVATAR_R;

  if (profileImg) {
    ctx.save();
    ctx.beginPath(); ctx.arc(aCX, aCY, AVATAR_R, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(profileImg, aCX - AVATAR_R, aCY - AVATAR_R, AVATAR_R * 2, AVATAR_R * 2);
    ctx.restore();
  } else {
    const ini = review.reviewerName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    ctx.save();
    ctx.beginPath(); ctx.arc(aCX, aCY, AVATAR_R, 0, Math.PI * 2);
    ctx.fillStyle = COL.purple; ctx.fill();
    ctx.font = `700 26px ${FF}`; ctx.fillStyle = COL.white;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(ini, aCX, aCY + 1);
    ctx.restore();
  }

  const nameX = cx + AVATAR_R * 2 + 18;
  ctx.save();
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = `700 38px ${FF}`; ctx.fillStyle = COL.black;
  ctx.fillText(review.reviewerName, nameX, aCY - 20);
  if (review.reviewCount) {
    ctx.font = `600 26px ${FF}`; ctx.fillStyle = COL.purple;
    ctx.fillText(`${review.reviewCount} reviews`, nameX, aCY + 10);
  } else if (review.handle) {
    ctx.font = `400 26px ${FF}`; ctx.fillStyle = "#9CA3AF";
    ctx.fillText(review.handle, nameX, aCY + 10);
  }
  ctx.restore();

  // ── Green section content ──
  cy = cardY + creamH + 10;  // start of green content

  // Business name
  ctx.save();
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = `700 ${BIZ_FONT}px ${FF}`; ctx.fillStyle = COL.black;
  ctx.fillText(review.businessName, cx, cy);
  ctx.restore();
  cy += BIZ_FONT + 14;

  // Category tags
  if (review.categories?.length) {
    let tagX = cx;
    for (const cat of review.categories) {
      const tagH = 36, tagPadX = 18, tagR = 10;
      ctx.font = `600 ${TAG_FONT}px ${FF}`;
      const tw = ctx.measureText(cat).width + tagPadX * 2;
      ctx.save();
      roundedRect(ctx, tagX, cy, tw, tagH, tagR);
      ctx.fillStyle = COL.peach; ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.font = `600 ${TAG_FONT}px ${FF}`; ctx.fillStyle = COL.black;
      ctx.fillText(cat, tagX + tagPadX, cy + tagH / 2);
      ctx.restore();
      tagX += tw + 10;
    }
    cy += tagRowH + tagGap;
  }

  // Stars + score
  let starX = cx;
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.font = `400 ${STAR_SZ}px ${FF}`;
    ctx.fillStyle = i < Math.floor(review.score) ? COL.starFill : COL.starEmpty;
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText("★", starX, cy);
    starX += Math.round(STAR_SZ * 0.93);
    ctx.restore();
  }
  ctx.save();
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.font = `700 34px ${FF}`; ctx.fillStyle = COL.black;
  ctx.fillText(review.score.toFixed(1), starX + 12, cy + 5);
  ctx.restore();
  cy += STAR_SZ + 20;

  // Review text — scale font up to fill available green space
  const availableTextH = cardY + cardH - cy - CARD_PAD;
  const totalBaseTextH = lines.length * LINE_H;
  let finalRevFont = REV_FONT;
  let finalLineH = LINE_H;
  // Reserve lower portion of green for sticker overlap (so text doesn't go there)
  const stickerReserveH = 180; // keep bottom ~180px of card clear for sticker
  const textAreaH = availableTextH - stickerReserveH;
  if (totalBaseTextH < textAreaH * 0.5 && lines.length > 0) {
    // Scale up: fit text to fill ~80% of text area
    const scale = Math.min(1.6, (textAreaH * 0.80) / totalBaseTextH);
    finalRevFont = Math.round(REV_FONT * scale);
    finalLineH = Math.round(LINE_H * scale);
    // Re-wrap at new font size
    ctx.font = `400 ${finalRevFont}px ${FF}`;
    const newLines = wrapText(ctx, `\u201C${review.reviewText}\u201D`, contentW);
    const newTextH = newLines.length * finalLineH;
    // Vertically center in available space
    const textY = cy + Math.round((textAreaH - newTextH) * 0.35);
    ctx.save();
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillStyle = COL.black;
    newLines.forEach((line, i) => { ctx.fillText(line, cx, textY + i * finalLineH); });
    ctx.restore();
  } else {
    const textY = cy + Math.round((textAreaH - totalBaseTextH) * 0.35);
    ctx.save();
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.font = `400 ${finalRevFont}px ${FF}`; ctx.fillStyle = COL.black;
    lines.forEach((line, i) => { ctx.fillText(line, cx, textY + i * finalLineH); });
    ctx.restore();
  }

  // ── Sticker + Follow text ──
  // "Follow @uplaudofficial" anchored to very bottom of canvas
  const followY = H - 70;
  ctx.save();
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = `600 ${FOLLOW_FONT}px ${FF}`; ctx.fillStyle = COL.white;
  ctx.fillText("Follow @uplaudofficial", W / 2, followY);
  ctx.restore();

  // Sticker overlaps the card bottom-right corner
  if (stickerImg) {
    const stkAspect = stickerImg.width / stickerImg.height;
    const stkW = Math.round(560);
    const stkH = Math.round(stkW / stkAspect);
    // Overlap card by ~45% from bottom
    const stkY = cardY + cardH - stkH * 0.50;
    const stkX = cardX + cardW - stkW + 40;
    drawStickerNoWhite(ctx, stickerImg, stkX, stkY, stkW, stkH);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => { if (blob) resolve(blob); else reject(new Error("Failed")); }, "image/png");
  });
}
